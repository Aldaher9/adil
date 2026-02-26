/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Lobby } from './components/Lobby';
import { GameState } from './types/game';
import { subscribeToRoom } from './services/firebase';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const handleStartGame = (initialState: GameState, roomId?: string) => {
    setGameState(initialState);
    if (roomId) setCurrentRoomId(roomId);
    setView('game');
  };

  const handleLeaveGame = () => {
    setGameState(null);
    setCurrentRoomId(null);
    setView('lobby');
  };

  // Subscribe to Firebase updates if in a room
  useEffect(() => {
    if (currentRoomId && view === 'game') {
      const unsubscribe = subscribeToRoom(currentRoomId, (newState) => {
        setGameState(newState);
      });
      return () => unsubscribe();
    }
  }, [currentRoomId, view]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {view === 'lobby' && <Lobby onStartGame={handleStartGame} />}
      {view === 'game' && gameState && (
        <GameBoard 
          gameState={gameState} 
          onLeave={handleLeaveGame} 
          setGameState={setGameState}
          roomId={currentRoomId}
        />
      )}
    </div>
  );
}


