'use client';

import React from 'react';
import { Player, PlayerPositionV2 } from '@/core/entities/player';

interface TacticalBoardProps {
  homeTeam: Player[];
  awayTeam: Player[];
  homeColor?: string;
  awayColor?: string;
  homeTeamName?: string;
  awayTeamName?: string;
}

const getPositionCoords = (pos: PlayerPositionV2) => {
  const map: Record<string, { x: number; y: number }> = {
    'G': { x: 50, y: 5 },
    'ZAG': { x: 50, y: 20 },
    'ZGE': { x: 35, y: 20 },
    'ZGD': { x: 65, y: 20 },
    'LE': { x: 12, y: 25 },
    'LD': { x: 88, y: 25 },
    'VOL': { x: 50, y: 40 },
    'MC': { x: 50, y: 55 },
    'ME': { x: 25, y: 60 },
    'MD': { x: 75, y: 60 },
    'MO': { x: 50, y: 70 },
    'PE': { x: 15, y: 85 },
    'PD': { x: 85, y: 85 },
    'SA': { x: 40, y: 85 },
    'CA': { x: 50, y: 92 },
  };
  return map[pos] || { x: 50, y: 50 };
};

const getVestColorClass = (colorName: string) => {
    const map: Record<string, string> = {
      'Branco': 'bg-white text-black border-white',
      'Preto': 'bg-zinc-800 text-white border-zinc-900',
      'Azul': 'bg-blue-600 text-white border-blue-800',
      'Amarelo': 'bg-yellow-400 text-black border-yellow-600',
      'Verde': 'bg-green-600 text-white border-green-800',
      'Vermelho': 'bg-red-600 text-white border-red-800',
      'Laranja': 'bg-orange-500 text-white border-orange-700'
    };
    return map[colorName] || 'bg-white/10 text-white border-white/20';
};

const PlayerNode = ({ player, x, y, colorData }: { player: Player, x: number, y: number, colorData: string }) => {
    const colorClasses = getVestColorClass(colorData);
    const shortName = player.name.split(' ')[0].substring(0, 10);
    
    return (
        <div 
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 ${colorClasses}`}>
                <span className="text-[8px] md:text-[10px] font-black">{player.positions[0] || 'CA'}</span>
            </div>
            
            <div className="bg-black/80 px-1.5 py-0.5 rounded mt-1 border border-white/10 shadow-lg z-30 group-hover:scale-110 transition-transform">
                <span className="text-[7px] md:text-[9px] font-black uppercase text-white truncate max-w-[50px] inline-block text-center tracking-tighter">
                    {shortName}
                </span>
            </div>
        </div>
    )
}

export const TacticalBoard: React.FC<TacticalBoardProps> = ({ 
  homeTeam, 
  awayTeam, 
  homeColor = 'Branco', 
  awayColor = 'Preto' 
}) => {

  const renderTeam = (team: Player[], isHome: boolean, colorData: string) => {
    const counts: Record<string, number> = {};

    return team.map((p) => {
      const pos = p.positions[0] || 'CA';
      if (!counts[pos]) counts[pos] = 0;
      counts[pos]++;
      
      const coords = getPositionCoords(pos);
      
      const duplicatesBefore = counts[pos] - 1;
      const offsetX = duplicatesBefore * 5; // spread % horizontal
      const offsetY = duplicatesBefore * 1; // spread % vertical
      
      const finalX = Math.min(95, Math.max(5, coords.x + offsetX));
      const finalY = isHome 
        ? (coords.y * 0.45) + offsetY // map 0-100 to 0-45
        : 100 - (coords.y * 0.45) - offsetY; // map 0-100 to 100-55

      return <PlayerNode key={p.id} player={p} x={finalX} y={finalY} colorData={colorData} />;
    });
  };

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 md:p-8 flex items-center justify-center overflow-hidden">
        
        {/* Aspect Ratio Container for the Field */}
        <div className="relative w-full max-w-sm aspect-[1/1.5] bg-green-800/20 border-2 border-white/60 overflow-hidden shadow-2xl">
            
            {/* Field Stripes (Grass Pattern) */}
            <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`flex-1 w-full ${i % 2 === 0 ? 'bg-green-600' : 'bg-green-700'}`} />
                ))}
            </div>

            {/* Field Lines - Pure CSS Geometry */}
            <div className="absolute inset-0 pointer-events-none border-[3px] border-white/60 m-2">
                {/* Center Line */}
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/60 -translate-y-1/2" />
                
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 w-20 h-20 md:w-28 md:h-28 border-[3px] border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2" />

                {/* Top Penalty Box */}
                <div className="absolute top-0 left-1/2 w-1/2 h-[15%] border-[3px] border-t-0 border-white/60 -translate-x-1/2" />
                {/* Top Goal Box */}
                <div className="absolute top-0 left-1/2 w-1/4 h-[5%] border-[3px] border-t-0 border-white/60 -translate-x-1/2" />
                {/* Top Penalty Arc */}
                <div className="absolute top-[15%] left-1/2 w-16 h-16 border-[3px] border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 clip-bottom-half opacity-60" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }} />
                {/* Top Penalty Dot */}
                <div className="absolute top-[10%] left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2" />

                {/* Bottom Penalty Box */}
                <div className="absolute bottom-0 left-1/2 w-1/2 h-[15%] border-[3px] border-b-0 border-white/60 -translate-x-1/2" />
                {/* Bottom Goal Box */}
                <div className="absolute bottom-0 left-1/2 w-1/4 h-[5%] border-[3px] border-b-0 border-white/60 -translate-x-1/2" />
                {/* Bottom Penalty Arc */}
                <div className="absolute bottom-[15%] left-1/2 w-16 h-16 border-[3px] border-white/60 rounded-full -translate-x-1/2 translate-y-1/2 opacity-60" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
                {/* Bottom Penalty Dot */}
                <div className="absolute bottom-[10%] left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2" />
            </div>

            {/* Teams Rendering */}
            <div className="absolute inset-0 m-2">
                {renderTeam(homeTeam, true, homeColor)}
                {renderTeam(awayTeam, false, awayColor)}
            </div>

            {/* Attack Direction Indicator Home -> Away */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-20">
               <div className="h-16 w-px bg-white" />
               <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[8px] border-transparent border-t-white" />
            </div>
            
            {/* Attack Direction Indicator Away -> Home */}
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-20">
               <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-transparent border-b-white" />
               <div className="h-16 w-px bg-white" />
            </div>

        </div>
    </div>
  );
};
