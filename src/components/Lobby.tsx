import { useState } from 'react';
import { initializeGame } from '../logic/gameRules';
import { GameState } from '../types/game';
import { motion } from 'motion/react';
import { Users, Cpu, Trophy, Play, Globe } from 'lucide-react';
import { createRoom, joinRoom, subscribeToRoom } from '../services/firebase';

interface LobbyProps {
  onStartGame: (state: GameState, roomId?: string) => void;
}

export function Lobby({ onStartGame }: LobbyProps) {
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local');
  const [botCount, setBotCount] = useState(3);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleStartLocal = () => {
    const state = initializeGame(['You'], botCount);
    onStartGame(state);
  };

  const handleCreateOnline = async () => {
    try {
      setIsCreating(true);
      const state = initializeGame(['Player 1'], 0); // No bots for now in online
      const roomId = await createRoom(state);
      onStartGame(state, roomId);
    } catch (e) {
      setError("Firebase not configured. Check console.");
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinOnline = async () => {
    if (!roomIdInput) return;
    try {
      setIsCreating(true);
      const state = await joinRoom(roomIdInput);
      if (state) {
        onStartGame(state, roomIdInput);
      } else {
        setError("Room not found");
      }
    } catch (e) {
      setError("Error joining room");
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl"
      >
        <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">
          JAKARO PRO
        </h1>
        <p className="text-center text-slate-400 mb-8">The Ultimate Board Game Experience</p>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setGameMode('local')}
              className={`p-4 rounded-xl border transition-all ${
                gameMode === 'local' 
                  ? 'bg-indigo-600 border-indigo-400 text-white' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-6 h-6 mb-2 mx-auto" />
              <div className="text-sm font-medium">Local / AI</div>
            </button>
            <button
              onClick={() => setGameMode('online')}
              className={`p-4 rounded-xl border transition-all ${
                gameMode === 'online' 
                  ? 'bg-indigo-600 border-indigo-400 text-white' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Globe className="w-6 h-6 mb-2 mx-auto" />
              <div className="text-sm font-medium">Online</div>
            </button>
          </div>

          {gameMode === 'local' && (
            <div className="bg-black/20 p-4 rounded-xl space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-3">Opponents</label>
                <div className="flex justify-between items-center">
                  <span className="text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    {botCount} Bots
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setBotCount(num)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          botCount === num 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleStartLocal}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-xl font-bold text-lg text-white shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Local Game
              </button>
            </div>
          )}

          {gameMode === 'online' && (
            <div className="bg-black/20 p-4 rounded-xl space-y-4">
              <div className="text-sm text-slate-400 mb-2">
                Requires Firebase Config in code.
              </div>
              
              <button
                onClick={handleCreateOnline}
                disabled={isCreating}
                className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1a1a1a] px-2 text-slate-500">Or Join</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Room ID"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleJoinOnline}
                  disabled={isCreating || !roomIdInput}
                  className="px-6 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 disabled:opacity-50"
                >
                  Join
                </button>
              </div>
              
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

