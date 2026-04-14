import React from 'react';
import { Player, PlayerPositionV2 } from '@/core/entities/player';
import { GlassCard } from '../ui/GlassCard';
import { Star } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

const positionColors: Record<PlayerPositionV2, string> = {
  G: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  LD: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  LE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ZGD: 'bg-green-700/20 text-green-400 border-green-700/30',
  ZGE: 'bg-green-700/20 text-green-400 border-green-700/30',
  ZAG: 'bg-green-700/20 text-green-400 border-green-700/30',
  VOL: 'bg-emerald-700/20 text-emerald-400 border-emerald-700/30',
  MC: 'bg-green-600/20 text-green-400 border-green-600/30',
  MD: 'bg-green-500/20 text-green-400 border-green-500/30',
  ME: 'bg-green-500/20 text-green-400 border-green-500/30',
  MO: 'bg-green-400/20 text-green-400 border-green-400/30',
  PE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  PD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  SA: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  CA: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.floor(rating) ? 'fill-yellow-500 text-yellow-500' : 'text-white/10'}
      />
    ));
  };

  return (
    <GlassCard className="p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-primary/20 overflow-hidden flex-shrink-0">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl font-black">
            {player.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-lg text-white truncate">{player.name}</h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
            {player.status}
          </span>
        </div>
        
        <div className="flex gap-0.5 mb-2">
          {renderStars(player.rating)}
        </div>

        <div className="flex flex-wrap gap-1">
          {player.positions.map((pos) => (
            <span 
              key={pos} 
              className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${positionColors[pos]}`}
            >
              {pos}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
