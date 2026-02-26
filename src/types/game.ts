export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'Joker';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // For sorting/logic
  isJoker?: boolean;
}

export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export interface Marble {
  id: string;
  color: PlayerColor;
  position: number; // 0-99 (main path), or special codes for base/home
  isSafe: boolean; // In home strip
  isBase: boolean; // In base
  offset?: number; // For rendering multiple marbles on same spot
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  team: 1 | 2; // Team 1 or 2
  cards: Card[];
  marbles: Marble[];
  isReady: boolean;
  isBot: boolean;
  botLevel?: 'easy' | 'medium' | 'hard';
}

export type GamePhase = 'lobby' | 'dealing' | 'playing' | 'game_over';

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentTurn: PlayerColor;
  deck: Card[];
  discardPile: Card[];
  lastPlayedCard: Card | null;
  round: number; // 1-5 (cards dealt decrease/reset)
  winner: number | null; // Team 1 or 2
  selectedCard: Card | null;
  possibleMoves: number[]; // Indices of possible moves
  history: string[]; // Log of actions
}

// Constants for board geometry
export const BOARD_SIZE = 100; // Arbitrary units for logic, not pixels
export const PATH_LENGTH = 70; // Main path steps usually around 60-80 depending on board
// Standard Jakaro/Ludo: 
// 4 arms. Each arm has a home strip.
// Let's standardize:
// Main path is circular: 0 to 63 (16 steps per quadrant * 4)
// Base: -1
// Home: 100 + offset (100, 101, 102, 103)
