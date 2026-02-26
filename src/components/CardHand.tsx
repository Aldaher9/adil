import { Card } from '../types/game';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface CardHandProps {
  cards: Card[];
  selectedCard: Card | null;
  onCardClick: (card: Card) => void;
  isMyTurn: boolean;
}

export function CardHand({ cards, selectedCard, onCardClick, isMyTurn }: CardHandProps) {
  return (
    <div className="flex gap-[-10px] items-end justify-center perspective-1000">
      {cards.map((card, index) => {
        const isSelected = selectedCard?.id === card.id;
        const rotation = (index - (cards.length - 1) / 2) * 5; // Fan effect
        const translateY = isSelected ? -20 : 0;

        return (
          <motion.div
            key={card.id}
            className={clsx(
              "relative w-24 h-36 bg-white rounded-xl shadow-xl border-2 cursor-pointer transition-all duration-200 hover:z-10 origin-bottom",
              isSelected ? "border-yellow-400 z-20" : "border-gray-200 z-0",
              !isMyTurn && "opacity-70 grayscale"
            )}
            style={{
              rotate: rotation,
              y: translateY,
              marginLeft: index === 0 ? 0 : -40 // Overlap
            }}
            whileHover={{ y: -30, scale: 1.1, zIndex: 30 }}
            onClick={() => isMyTurn && onCardClick(card)}
          >
            {/* Card Content */}
            <div className="absolute top-2 left-2 text-lg font-bold" style={{ color: ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black' }}>
              {card.rank}
              <div className="text-xs">{getSuitIcon(card.suit)}</div>
            </div>
            
            <div className="absolute bottom-2 right-2 text-lg font-bold rotate-180" style={{ color: ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black' }}>
              {card.rank}
              <div className="text-xs">{getSuitIcon(card.suit)}</div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 pointer-events-none" style={{ color: ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black' }}>
              {getSuitIcon(card.suit)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function getSuitIcon(suit: string) {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
}
