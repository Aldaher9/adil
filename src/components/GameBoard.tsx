import { GameState, Player, Card, Marble, PlayerColor } from '../types/game';
import { Board } from './Board';
import { CardHand } from './CardHand';
import { PlayerInfo } from './PlayerInfo';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageSquare, Menu } from 'lucide-react';
import { performMove, getValidMoves } from '../logic/gameRules';
import confetti from 'canvas-confetti';
import { updateRoomState } from '../services/firebase';

interface GameBoardProps {
  gameState: GameState;
  onLeave: () => void;
  setGameState: (state: GameState) => void;
  roomId: string | null;
}

export function GameBoard({ gameState, onLeave, setGameState, roomId }: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  // Identify local player (for now, hardcoded to first player or 'red')
  const localPlayerId = gameState.players[0].id; 
  const localPlayer = gameState.players.find(p => p.id === localPlayerId);

  // Sync state helper
  const updateState = (newState: GameState) => {
    setGameState(newState);
    if (roomId) {
      updateRoomState(roomId, newState);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameState.winner) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      return;
    }

    const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurn);
    if (!currentPlayer) return;

    // Only run AI if it's a local game OR if I am the host (Player 1) in an online game
    // For simplicity, only run AI if roomId is null (Local Mode)
    if (roomId && currentPlayer.isBot) {
       return; 
    }

    // Check if player has valid moves
    const validMoves = getValidMoves(gameState);
    
    // Auto-pass if no moves (and hand not empty)
    if (validMoves.length === 0 && currentPlayer.cards.length > 0) {
      const timer = setTimeout(() => {
        // Burn card logic
        const cardToBurn = currentPlayer.cards[0];
        console.log(`${currentPlayer.name} has no moves, burning card.`);
        
        const nextTurnIndex = (gameState.players.findIndex(p => p.color === gameState.currentTurn) + 1) % 4;
        const newPlayers = gameState.players.map(p => 
          p.color === currentPlayer.color 
            ? { ...p, cards: p.cards.filter(c => c.id !== cardToBurn.id) }
            : p
        );
        
        updateState({
          ...gameState,
          players: newPlayers,
          currentTurn: newPlayers[nextTurnIndex].color,
          discardPile: [...gameState.discardPile, cardToBurn],
          lastPlayedCard: cardToBurn
        });

      }, 1000);
      return () => clearTimeout(timer);
    }

    // AI Execution
    if (currentPlayer.isBot && !roomId) {
      const timer = setTimeout(() => {
        if (validMoves.length > 0) {
          // Simple AI: Pick random valid move
          const move = validMoves[Math.floor(Math.random() * validMoves.length)];
          const newState = performMove(gameState, move.card, move.marble.id);
          updateState(newState);
        }
      }, 1500); // Delay for realism
      return () => clearTimeout(timer);
    }
  }, [gameState, roomId]);

  const handleCardClick = (card: Card) => {
// ... existing code ...
    if (gameState.currentTurn !== localPlayer?.color) return;
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleMarbleClick = (marble: Marble) => {
    if (!selectedCard) return;
    if (gameState.currentTurn !== localPlayer?.color) return;
    if (marble.color !== localPlayer.color) {
      // Unless it's a swap/kill context, we usually click our own marbles
      // But for Swap, we might click opponent.
      // For MVP, assume moving own marble.
      return;
    }

    // Execute Move
    const newState = performMove(gameState, selectedCard, marble.id);
    
    // Check if state actually changed (valid move)
    if (newState !== gameState) {
      updateState(newState);
      setSelectedCard(null);
    } else {
      // Invalid move feedback (shake?)
      console.log("Invalid move");
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 z-50 border-b border-white/5">
        <button onClick={onLeave} className="p-2 hover:bg-white/10 rounded-full text-white/80">
          <ArrowLeft />
        </button>
        <div className="font-bold text-xl tracking-widest text-white/90">
          JAKARO {roomId && <span className="text-xs bg-indigo-600 px-2 py-1 rounded ml-2">ONLINE: {roomId}</span>}
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full text-white/80">
            <MessageSquare />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full text-white/80">
            <Menu />
          </button>
        </div>
      </div>

      {/* Winner Overlay */}
      <AnimatePresence>
        {gameState.winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center"
          >
            <div className="text-center">
              <h2 className="text-6xl font-bold text-yellow-400 mb-4">TEAM {gameState.winner} WINS!</h2>
              <button onClick={onLeave} className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition">
                Back to Lobby
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center relative p-4">
        {/* Board */}
        <div className="aspect-square h-full max-h-[800px] relative">
          <Board 
            gameState={gameState} 
            onMarbleClick={handleMarbleClick}
            selectedCard={selectedCard}
          />
        </div>

        {/* Player Info Corners */}
        <PlayerInfo player={gameState.players[0]} position="bottom-left" isCurrentTurn={gameState.currentTurn === gameState.players[0].color} />
        <PlayerInfo player={gameState.players[1]} position="top-left" isCurrentTurn={gameState.currentTurn === gameState.players[1].color} />
        <PlayerInfo player={gameState.players[2]} position="top-right" isCurrentTurn={gameState.currentTurn === gameState.players[2].color} />
        <PlayerInfo player={gameState.players[3]} position="bottom-right" isCurrentTurn={gameState.currentTurn === gameState.players[3].color} />
      </div>

      {/* Bottom Hand Area */}
      <div className="h-32 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full flex justify-center items-end pb-4 z-40">
        {localPlayer && (
          <CardHand 
            cards={localPlayer.cards} 
            selectedCard={selectedCard} 
            onCardClick={handleCardClick}
            isMyTurn={gameState.currentTurn === localPlayer.color}
          />
        )}
      </div>
    </div>
  );
}

