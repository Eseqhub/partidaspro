import React from 'react';
import { Player } from '@/core/entities/player';

// Mapa de formações por esporte
const FORMATIONS: Record<string, number[]> = {
  Futsal:  [1, 2, 1],
  Society: [2, 3, 1],
  Campo:   [4, 3, 3],
};

export const getLineLimit = (sport: string): number => {
  if (sport === 'Futsal')  return 5;
  if (sport === 'Campo')   return 11;
  return 7;
};

export const getFormationCoords = (
  index: number, _total: number, _isHome: boolean, sportType: string
): { x: number; y: number } => {
  if (index === 0) return { x: 50, y: 85 };

  const layout = FORMATIONS[sportType] ?? [2, 3, 1];
  let playerIdx = index - 1;
  let rowIdx = 0;
  let posInRow = 0;
  let accumulated = 0;

  for (let i = 0; i < layout.length; i++) {
    if (playerIdx < accumulated + layout[i]) {
      rowIdx = i;
      posInRow = playerIdx - accumulated;
      break;
    }
    accumulated += layout[i];
  }

  const rowYStep = 55 / layout.length;
  const baseY    = 70 - rowIdx * rowYStep;
  const xStep    = 80 / (layout[rowIdx] + 1);
  const finalX   = xStep * (posInRow + 1) + 10;

  return { x: finalX, y: baseY };
};

// ─── Player Node (Reserva) ───────────────────────────────────────────────────
export const ReservePlayerNode: React.FC<{ player: Player }> = ({ player }) => {
  const mainPos = player.positions?.[0] || 'SA';
  return (
    <div className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-all min-w-[40px] group">
      <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-zinc-900 group-hover:border-primary/50 transition-colors">
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/20">{mainPos}</div>
        }
      </div>
      <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter truncate w-full text-center">
        {player.name.split(' ')[0].substring(0, 10)}
      </span>
    </div>
  );
};

// ─── Player Node (Titular no campo) ─────────────────────────────────────────
export const FieldPlayerNode: React.FC<{ player: Player; x: number; y: number }> = ({ player, x, y }) => {
  const shortName = player.name.split(' ')[0].substring(0, 10);
  const rating    = player.rating || 3.0;
  const mainPos   = player.positions?.[0] || 'SA';

  return (
    <div
      className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-primary/50 shadow-[0_0_15px_rgba(204,255,0,0.3)] overflow-hidden bg-zinc-950 group-hover:scale-110 group-hover:border-primary transition-all duration-300">
          {player.photo_url
            ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs font-black text-white/10">{mainPos}</div>
          }
        </div>
        <div className="absolute -top-1 -right-1 bg-primary text-black text-[7px] md:text-[9px] font-black px-1 rounded-sm shadow-lg border border-black/40">
          {rating.toFixed(1)}
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/20 shadow-xl group-hover:border-primary/40 transition-colors">
          <p className="text-[7px] md:text-[9px] font-black uppercase text-white tracking-widest leading-none drop-shadow-md">{shortName}</p>
        </div>
        <p className="text-[6px] md:text-[8px] font-black text-primary/70 uppercase tracking-widest mt-0.5 italic">{mainPos}</p>
      </div>
    </div>
  );
};
