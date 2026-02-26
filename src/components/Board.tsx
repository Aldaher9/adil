import { GameState, Marble, PlayerColor } from '../types/game';
import { motion } from 'motion/react';
import { SAFE_ZONE_OFFSETS } from '../logic/gameRules';

interface BoardProps {
  gameState: GameState;
  onMarbleClick: (marble: Marble) => void;
  selectedCard: any;
}

export function Board({ gameState, onMarbleClick, selectedCard }: BoardProps) {
  // SVG Coordinate System: 1000x1000
  const CENTER = 500;
  const RADIUS = 350;
  
  // Generate path points
  const getPathPoint = (index: number) => {
    // 64 steps total
    // Index 0 is Red Start. Let's place Red at Bottom (90 degrees).
    // Direction: Clockwise.
    // Angle 0 is 3 o'clock. 90 is 6 o'clock.
    // So Index 0 = 90 deg.
    // Index 1 = 90 + step.
    
    const angleOffset = 90; 
    const anglePerStep = 360 / 64;
    const angle = (index * anglePerStep + angleOffset) * (Math.PI / 180);
    
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle)
    };
  };

  // Base positions (4 corners)
  const getBasePosition = (color: PlayerColor, index: number) => {
    const offset = 50;
    // Corners outside the circle
    const baseCenters = {
      red: { x: 900, y: 900 },    // Bottom Right
      green: { x: 100, y: 900 },   // Bottom Left
      yellow: { x: 100, y: 100 },  // Top Left
      blue: { x: 900, y: 100 }     // Top Right
    };
    const center = baseCenters[color];
    // 2x2 grid
    const dx = (index % 2) * offset - offset/2;
    const dy = Math.floor(index / 2) * offset - offset/2;
    return { x: center.x + dx, y: center.y + dy };
  };

  // Safe zone positions
  const getSafeZonePosition = (color: PlayerColor, step: number) => {
    // step is 0, 1, 2, 3
    // Red Safe enters near Index 63 (approx 90 deg). Moves UP towards center.
    // Green Safe enters near Index 15 (approx 180 deg). Moves RIGHT towards center.
    // Yellow Safe enters near Index 31 (approx 270 deg). Moves DOWN towards center.
    // Blue Safe enters near Index 47 (approx 0/360 deg). Moves LEFT towards center.
    
    const startRadius = RADIUS - 40;
    const endRadius = 100;
    const r = startRadius - ((startRadius - endRadius) / 3) * step;
    
    let angle = 0;
    switch(color) {
      case 'red': angle = 90; break;
      case 'green': angle = 180; break; // Wait, Green starts at 16 (approx 180).
      case 'yellow': angle = 270; break;
      case 'blue': angle = 0; break;
    }
    
    // Adjust angles to match the path index logic if needed, but cardinal directions are safer for safe zones
    const rad = angle * (Math.PI / 180);
    return {
      x: CENTER + r * Math.cos(rad),
      y: CENTER + r * Math.sin(rad)
    };
  };

  const getMarblePosition = (marble: Marble) => {
    if (marble.isBase) {
      const player = gameState.players.find(p => p.color === marble.color);
      const index = player?.marbles.findIndex(m => m.id === marble.id) || 0;
      return getBasePosition(marble.color, index);
    }
    if (marble.isSafe) {
      const offset = SAFE_ZONE_OFFSETS[marble.color];
      return getSafeZonePosition(marble.color, marble.position - offset);
    }
    return getPathPoint(marble.position);
  };

  return (
    <div className="w-full h-full relative select-none">
      <svg viewBox="0 0 1000 1000" className="w-full h-full drop-shadow-2xl">
        {/* Background Board */}
        <circle cx="500" cy="500" r="480" fill="#1e1e1e" stroke="#333" strokeWidth="10" />
        
        {/* Center Home */}
        <circle cx="500" cy="500" r="80" fill="#333" stroke="#555" strokeWidth="5" />
        <text x="500" y="510" textAnchor="middle" fill="#666" fontSize="40" fontWeight="bold">JAKARO</text>

        {/* Safe Zones Backgrounds (Optional) */}
        
        {/* Main Path Track Steps */}
        {Array.from({ length: 64 }).map((_, i) => {
          const pos = getPathPoint(i);
          // Highlight start positions
          const isStart = i === 0 || i === 16 || i === 32 || i === 48;
          return (
            <circle 
              key={i} 
              cx={pos.x} 
              cy={pos.y} 
              r={isStart ? 12 : 8} 
              fill={isStart ? '#fff' : '#444'} 
              opacity={isStart ? 0.8 : 0.5}
            />
          );
        })}

        {/* Safe Zone Steps */}
        {['red', 'green', 'yellow', 'blue'].map(color => (
           Array.from({ length: 4 }).map((_, i) => {
             const pos = getSafeZonePosition(color as PlayerColor, i);
             return (
               <circle 
                 key={`${color}-safe-${i}`} 
                 cx={pos.x} 
                 cy={pos.y} 
                 r="6" 
                 fill={getColorHex(color)} 
                 opacity="0.3"
               />
             );
           })
        ))}

        {/* Bases */}
        <BaseArea color="red" x={900} y={900} />
        <BaseArea color="green" x={100} y={900} />
        <BaseArea color="yellow" x={100} y={100} />
        <BaseArea color="blue" x={900} y={100} />

        {/* Marbles */}
        {gameState.players.flatMap(p => p.marbles).map(marble => {
          const pos = getMarblePosition(marble);
          // Check if marble belongs to current turn player to highlight interactivity
          const isMyTurn = gameState.currentTurn === marble.color;
          const isSelectable = isMyTurn && selectedCard; // Simplified check

          return (
            <motion.g 
              key={marble.id}
              initial={false}
              animate={{ x: pos.x, y: pos.y }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => onMarbleClick(marble)}
              className={isSelectable ? "cursor-pointer" : "cursor-default"}
              whileHover={isSelectable ? { scale: 1.2 } : {}}
            >
              <circle 
                r="22" 
                fill={getColorHex(marble.color)} 
                stroke="white" 
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              {/* Inner detail to look like a marble */}
              <circle r="10" fill="white" opacity="0.2" cx="-5" cy="-5" />
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

function BaseArea({ color, x, y }: { color: string, x: number, y: number }) {
  return (
    <g>
      <rect 
        x={x - 100} 
        y={y - 100} 
        width="200" 
        height="200" 
        rx="30" 
        fill={getColorHex(color)} 
        fillOpacity="0.1" 
        stroke={getColorHex(color)} 
        strokeWidth="2" 
      />
      {/* 4 slots */}
      <circle cx={x - 25} cy={y - 25} r="10" fill={getColorHex(color)} opacity="0.2" />
      <circle cx={x + 25} cy={y - 25} r="10" fill={getColorHex(color)} opacity="0.2" />
      <circle cx={x - 25} cy={y + 25} r="10" fill={getColorHex(color)} opacity="0.2" />
      <circle cx={x + 25} cy={y + 25} r="10" fill={getColorHex(color)} opacity="0.2" />
    </g>
  );
}

function getColorHex(color: string) {
  switch (color) {
    case 'red': return '#ef4444';
    case 'green': return '#22c55e';
    case 'yellow': return '#eab308';
    case 'blue': return '#3b82f6';
    default: return '#999';
  }
}

