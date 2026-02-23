import { ReinforcementPhrase } from "../lib/firestore-service";
import { Plus, Minus } from "lucide-react";

interface ReinforcementPanelProps {
  phrases: ReinforcementPhrase[];
  onSelect: (phrase: ReinforcementPhrase) => void;
  loading?: boolean;
}

export default function ReinforcementPanel({ phrases, onSelect, loading }: ReinforcementPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {phrases.map((phrase) => (
        <button
          key={phrase.id}
          onClick={() => onSelect(phrase)}
          disabled={loading}
          className={`
            relative group p-4 rounded-xl border-2 text-left transition-all
            ${phrase.points > 0 
              ? 'border-green-100 bg-green-50/50 hover:border-green-500 hover:bg-green-50' 
              : 'border-red-100 bg-red-50/50 hover:border-red-500 hover:bg-red-50'}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`
              p-1.5 rounded-lg 
              ${phrase.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            `}>
              {phrase.points > 0 ? <Plus size={16} /> : <Minus size={16} />}
            </span>
            <span className={`
              font-bold text-lg
              ${phrase.points > 0 ? 'text-green-700' : 'text-red-700'}
            `}>
              {phrase.points > 0 ? '+' : ''}{phrase.points}
            </span>
          </div>
          <p className="font-medium text-gray-700 group-hover:text-gray-900 leading-tight">
            {phrase.text}
          </p>
        </button>
      ))}
    </div>
  );
}
