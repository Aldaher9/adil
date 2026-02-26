import { Card, GameState, Marble, Player, PlayerColor, Rank } from "../types/game";
import { v4 as uuidv4 } from 'uuid';

// Board Configuration
export const TOTAL_STEPS = 64;
export const SAFE_ZONE_STEPS = 4;
export const BASE_POSITION = -1;

// Start positions (Index on the main path 0-63)
export const PLAYER_START_POSITIONS: Record<PlayerColor, number> = {
  red: 0,
  green: 16,
  yellow: 32,
  blue: 48
};

// The index *before* the start position is where you enter the safe zone
export const SAFETY_ENTRY_POINTS: Record<PlayerColor, number> = {
  red: 63,
  green: 15,
  yellow: 31,
  blue: 47
};

// Safe zone positions are represented as 100 + (0-3) for Red, 200+ for Green?
// Simpler: 
// Red Safe: 100, 101, 102, 103
// Green Safe: 200, 201, 202, 203
// Yellow Safe: 300, 301, 302, 303
// Blue Safe: 400, 401, 402, 403
export const SAFE_ZONE_OFFSETS: Record<PlayerColor, number> = {
  red: 100,
  green: 200,
  yellow: 300,
  blue: 400
};

export const createDeck = (): Card[] => {
  const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      let value = 0;
      if (rank === 'A') value = 1; // Or 11
      else if (rank === 'K') value = 13;
      else if (rank === 'Q') value = 12;
      else if (rank === 'J') value = 11;
      else value = parseInt(rank);

      deck.push({
        id: uuidv4(),
        suit,
        rank,
        value
      });
    });
  });
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const initializeGame = (playerNames: string[], botCount: number = 0): GameState => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  const players: Player[] = colors.map((color, index) => {
    const isBot = index >= 4 - botCount;
    return {
      id: uuidv4(),
      name: index < playerNames.length ? playerNames[index] : `Bot ${index + 1}`,
      color,
      team: (index % 2) + 1 as 1 | 2,
      cards: [],
      marbles: Array(4).fill(0).map(() => ({
        id: uuidv4(),
        color,
        position: BASE_POSITION,
        isSafe: false,
        isBase: true
      })),
      isReady: true,
      isBot,
      botLevel: 'medium'
    };
  });

  let initialState: GameState = {
    id: uuidv4(),
    phase: 'dealing',
    players,
    currentTurn: 'red',
    deck: createDeck(),
    discardPile: [],
    lastPlayedCard: null,
    round: 1,
    winner: null,
    selectedCard: null,
    possibleMoves: [],
    history: []
  };

  return dealCards(initialState);
};

export const dealCards = (state: GameState): GameState => {
  const cardsToDeal = state.round === 1 ? 5 : 4;
  let newDeck = [...state.deck];
  
  // Reshuffle if needed
  if (newDeck.length < state.players.length * cardsToDeal) {
    newDeck = shuffleDeck([...newDeck, ...state.discardPile]);
    state.discardPile = [];
  }

  const newPlayers = state.players.map(player => {
    const newCards = [...player.cards];
    for (let i = 0; i < cardsToDeal; i++) {
      if (newDeck.length > 0) {
        newCards.push(newDeck.pop()!);
      }
    }
    return { ...player, cards: newCards };
  });

  return {
    ...state,
    deck: newDeck,
    players: newPlayers,
    phase: 'playing'
  };
};

// --- Logic ---

export const getMarbleCurrentGlobalPosition = (marble: Marble): number => {
  if (marble.isBase) return -1;
  if (marble.isSafe) return marble.position; // 100-103, etc.
  return marble.position; // 0-63
};

export const calculateTargetPosition = (
  marble: Marble,
  steps: number,
  playerColor: PlayerColor
): { position: number; isSafe: boolean; isBase: boolean } | null => {
  
  // Handle Base Exit
  if (marble.isBase) {
    if (steps === 1 || steps === 11 || steps === 13) {
      return { position: PLAYER_START_POSITIONS[playerColor], isSafe: false, isBase: false };
    }
    return null;
  }

  // Handle Safe Zone Movement
  if (marble.isSafe) {
    const safeBase = SAFE_ZONE_OFFSETS[playerColor];
    const currentStepInSafe = marble.position - safeBase; // 0 to 3
    const targetStep = currentStepInSafe + steps;
    
    if (targetStep >= 0 && targetStep < SAFE_ZONE_STEPS) {
      return { position: safeBase + targetStep, isSafe: true, isBase: false };
    }
    return null; // Cannot move out of safe zone or overshoot
  }

  // Handle Normal Path Movement
  let currentPos = marble.position;
  const entryPoint = SAFETY_ENTRY_POINTS[playerColor];
  
  // Moving Backwards (Card 4 or -1)
  if (steps < 0) {
    let newPos = (currentPos + steps + TOTAL_STEPS) % TOTAL_STEPS;
    // Special case: If you back up past your start, you don't enter safe zone from behind usually.
    return { position: newPos, isSafe: false, isBase: false };
  }

  // Moving Forward
  // We need to check if we cross the entry point
  // Distance to entry point
  let distToEntry = (entryPoint - currentPos + TOTAL_STEPS) % TOTAL_STEPS;
  
  // If we are AT the entry point, dist is 0.
  // If we are passing it.
  
  if (distToEntry < steps) {
    // We might enter safe zone
    const stepsInSafe = steps - distToEntry - 1;
    if (stepsInSafe >= 0 && stepsInSafe < SAFE_ZONE_STEPS) {
      return { 
        position: SAFE_ZONE_OFFSETS[playerColor] + stepsInSafe, 
        isSafe: true, 
        isBase: false 
      };
    } else if (stepsInSafe >= SAFE_ZONE_STEPS) {
       return null; // Overshot
    }
  }

  // Normal move on track
  const newPos = (currentPos + steps) % TOTAL_STEPS;
  return { position: newPos, isSafe: false, isBase: false };
};

export const getValidMoves = (state: GameState): { card: Card, marble: Marble, target: any }[] => {
  const player = state.players.find(p => p.color === state.currentTurn);
  if (!player) return [];

  const moves: { card: Card, marble: Marble, target: any }[] = [];

  player.cards.forEach(card => {
    // Determine possible steps for this card
    let possibleSteps = [card.value];
    if (card.rank === 'A') possibleSteps = [1, 11]; 
    if (card.rank === 'K') possibleSteps = [13];
    if (card.rank === '4') possibleSteps = [-4];
    if (card.rank === '10') possibleSteps = [10, -1];
    if (card.rank === '5') possibleSteps = [5];
    if (card.rank === 'Q') possibleSteps = [12];
    
    // Check each marble
    player.marbles.forEach(marble => {
      // Special case: Base Exit
      if (marble.isBase) {
        if (['A', 'K'].includes(card.rank)) {
           // Can exit
           moves.push({ 
             card, 
             marble, 
             target: { position: PLAYER_START_POSITIONS[player.color], isSafe: false, isBase: false } 
           });
        }
        return; // Can't move normally from base
      }

      // Normal moves
      possibleSteps.forEach(steps => {
        const target = calculateTargetPosition(marble, steps, player.color);
        if (target) {
          // Check collision rules (e.g. can't land on own safe marble? can't land on own base?)
          // For now, assume valid if target exists
          moves.push({ card, marble, target });
        }
      });
    });
  });

  return moves;
};

export const performMove = (
  state: GameState,
  card: Card,
  marbleId: string,
  swapTargetId?: string // For Bus/Swap
): GameState => {
  const playerIndex = state.players.findIndex(p => p.color === state.currentTurn);
  const player = state.players[playerIndex];
  const marbleIndex = player.marbles.findIndex(m => m.id === marbleId);
  const marble = player.marbles[marbleIndex];

  if (!marble) return state;

  // Determine steps based on card
  let steps = 0;
  if (card.rank === 'A') steps = 1; // Default to 1, UI should allow choosing 11
  else if (card.rank === 'K') steps = 13;
  else if (card.rank === '4') steps = -4;
  else if (card.rank === '10') steps = 10; // UI should allow -1
  else if (card.rank === 'Q') steps = 12;
  else if (card.rank === '5') steps = 5;
  else steps = card.value;

  // TODO: Handle choices (A=1/11, 10=10/-1, 7=Split). 
  // For MVP, we assume default values or specific UI triggers.
  // Let's assume the UI passes a modified "virtual" card or we handle it here.
  // For now, simple mapping.

  let target = calculateTargetPosition(marble, steps, player.color);
  
  // Handle Swap (Bus/Jack)
  if (card.rank === 'J' || card.rank === 'Joker') {
     // Swap logic
     return state; // Placeholder
  }

  if (!target) return state; // Invalid move

  // Check for collisions
  let newPlayers = [...state.players];
  let eaten = false;

  // Check if landing on someone
  newPlayers = newPlayers.map(p => {
    const newMarbles = p.marbles.map(m => {
      if (m.isBase || m.isSafe) return m; // Safe/Base marbles can't be eaten usually
      if (target && m.position === target.position && !target.isSafe && !target.isBase) {
        // Collision!
        if (p.color !== player.color) {
          // Eat opponent
          eaten = true;
          return { ...m, position: BASE_POSITION, isBase: true, isSafe: false };
        } else {
           // Self collision? Usually not allowed or blocks.
           // For simplicity, we allow landing on self (stacking) or block?
           // Jakaro usually blocks.
        }
      }
      return m;
    });
    return { ...p, marbles: newMarbles };
  });

  // Update the moved marble
  newPlayers[playerIndex].marbles[marbleIndex] = {
    ...marble,
    position: target.position,
    isSafe: target.isSafe,
    isBase: target.isBase
  };

  // Remove card from hand
  newPlayers[playerIndex].cards = newPlayers[playerIndex].cards.filter(c => c.id !== card.id);

  // Next turn
  let nextTurnIndex = (playerIndex + 1) % 4;
  
  // Check win condition
  const isWinner = newPlayers[playerIndex].marbles.every(m => m.isSafe);
  let winner = state.winner;
  if (isWinner) {
    winner = player.team;
  }

  // Check if round should end (all players out of cards)
  const allCardsPlayed = newPlayers.every(p => p.cards.length === 0);
  
  let nextState = {
    ...state,
    players: newPlayers,
    currentTurn: newPlayers[nextTurnIndex].color,
    discardPile: [...state.discardPile, card],
    lastPlayedCard: card,
    winner,
    selectedCard: null
  };

  if (allCardsPlayed && !winner) {
    // Start next round
    nextState.round += 1;
    // Deal new cards
    nextState = dealCards(nextState);
    // Turn usually stays with next player, or resets to dealer? 
    // Standard Jakaro: Turn continues in sequence.
  }

  return nextState;
};
