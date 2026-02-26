import { Player } from '../types/game';
import { clsx } from 'clsx';

interface PlayerInfoProps {
  player: Player;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isCurrentTurn: boolean;
}

export function PlayerInfo({ player, position, isCurrentTurn }: PlayerInfoProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4 flex-row-reverse text-right',
    'bottom-left': 'bottom-24 left-4', // Raised for hand
    'bottom-right': 'bottom-24 right-4 flex-row-reverse text-right', // Raised for hand
  };

  return (
    <div className={clsx(
      "absolute flex items-center gap-3 p-3 rounded-2xl backdrop-blur-md transition-all duration-300",
      positionClasses[position],
      isCurrentTurn ? "bg-white/20 border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.3)]" : "bg-black/30 border border-white/5"
    )}>
      <div className={clsx(
        "w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold shadow-lg",
        getPlayerColorClass(player.color)
      )}>
        {player.name.charAt(0)}
      </div>
      <div>
        <div className="font-bold text-white text-sm">{player.name}</div>
        <div className="text-xs text-white/60">{player.cards.length} cards</div>
      </div>
    </div>
  );
}

function getPlayerColorClass(color: string) {
  switch (color) {
    case 'red': return 'bg-red-500 border-red-300';
    case 'green': return 'bg-green-500 border-green-300';
    case 'yellow': return 'bg-yellow-500 border-yellow-300 text-black';
    case 'blue': return 'bg-blue-500 border-blue-300';
    default: return 'bg-gray-500';
  }
}
