'use client';

import React, { useState, useMemo } from 'react';
import { Player } from '@/core/entities/player';
import { MatchEvent } from '@/core/entities/match';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faSquare, faStar, faUsers, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

interface TacticalBoardProps {
  homeTeam: Player[];
  awayTeam: Player[];
  homeColor?: string;
  awayColor?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  sportType?: 'Futsal' | 'Society' | 'Campo';
  events?: MatchEvent[];
}

const getLineLimit = (sportType: string) => {
    if (sportType === 'Futsal') return 5;
    if (sportType === 'Society') return 7;
    if (sportType === 'Campo') return 11;
    return 7;
};

const getFormationCoords = (index: number, total: number, isHome: boolean, sportType: string) => {
    // Para visual de HUD profissional, centralizamos o time no campo
    // Goleiro sempre no fundo
    if (index === 0) return { x: 50, y: 85 };

    const layout: Record<string, number[]> = {
        'Futsal': [1, 2, 1],
        'Society': [2, 3, 1],
        'Campo': [4, 3, 3]
    };

    const currentLayout = layout[sportType] || [2, 3, 1];
    let playerIdx = index - 1;
    let rowIdx = 0;
    let posInRow = 0;
    let accumulated = 0;

    for (let i = 0; i < currentLayout.length; i++) {
        if (playerIdx < accumulated + currentLayout[i]) {
            rowIdx = i;
            posInRow = playerIdx - accumulated;
            break;
        }
        accumulated += currentLayout[i];
    }

    const rowYStep = 55 / currentLayout.length;
    const baseY = 70 - (rowIdx * rowYStep); // Invertido para perspectiva (fundo -> frente)

    const pCountInRow = currentLayout[rowIdx];
    const xStep = 80 / (pCountInRow + 1);
    const finalX = xStep * (posInRow + 1) + 10;

    return { x: finalX, y: baseY };
};

const PlayerNode = ({ player, x, y, isReserve = false }: { player: Player, x?: number, y?: number, isReserve?: boolean }) => {
    const shortName = player.name.split(' ')[0].substring(0, 10);
    const rating = player.rating || 3.0;
    const mainPos = player.positions?.[0] || 'SA';

    if (isReserve) {
        return (
            <div className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-all min-w-[40px] group">
                <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-zinc-900 group-hover:border-primary/50 transition-colors">
                    {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/20">
                            {mainPos}
                        </div>
                    )}
                </div>
                <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter truncate w-full text-center">{shortName}</span>
            </div>
        );
    }

    return (
        <div 
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group z-30"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
                {/* Photo with Neon Ring */}
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-primary/50 shadow-[0_0_15px_rgba(204,255,0,0.3)] overflow-hidden bg-zinc-950 group-hover:scale-110 group-hover:border-primary transition-all duration-300">
                    {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-white/10">
                            {mainPos}
                        </div>
                    )}
                </div>

                {/* Rating Badge */}
                <div className="absolute -top-1 -right-1 bg-primary text-black text-[7px] md:text-[9px] font-black px-1 rounded-sm shadow-lg border border-black/40">
                    {rating.toFixed(1)}
                </div>
            </div>
            
            {/* Info Block */}
            <div className="mt-2 text-center">
                <div className="bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/20 shadow-xl group-hover:border-primary/40 transition-colors">
                    <p className="text-[7px] md:text-[9px] font-black uppercase text-white tracking-widest leading-none drop-shadow-md">
                        {shortName}
                    </p>
                </div>
                <p className="text-[6px] md:text-[8px] font-black text-primary/70 uppercase tracking-widest mt-0.5 italic">
                    {mainPos}
                </p>
            </div>
        </div>
    )
}

export const TacticalBoard: React.FC<TacticalBoardProps> = ({ 
  homeTeam, 
  awayTeam, 
  homeTeamName = 'MANDANTE',
  awayTeamName = 'VISITANTE',
  sportType = 'Society',
}) => {
  const [viewingTeam, setViewingTeam] = useState<'home' | 'away'>('home');
  const limit = getLineLimit(sportType);

  const activeTeam = viewingTeam === 'home' ? homeTeam : awayTeam;
  const activeTeamName = viewingTeam === 'home' ? homeTeamName : awayTeamName;

  const starters = activeTeam.slice(0, limit);
  const reserves = activeTeam.slice(limit);

  const stats = useMemo(() => {
    if (activeTeam.length === 0) return { avg: 0, best: null };
    const avg = activeTeam.reduce((acc, p) => acc + (p.rating || 3), 0) / activeTeam.length;
    const best = [...activeTeam].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    return { avg, best };
  }, [activeTeam]);

  return (
    <div className="w-full flex flex-col items-center select-none animate-in fade-in duration-700">
        
        {/* HUD Header */}
        <div className="w-full max-w-xl mb-8 relative">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-[1px] w-8 md:w-12 bg-gradient-to-l from-primary/50 to-transparent" />
                    <h2 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter text-center">
                        MINHA PELADA <span className="text-primary drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]">PRO</span>
                    </h2>
                    <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-primary/50 to-transparent" />
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1 rounded-full flex items-center gap-3">
                    <span className="text-[7px] md:text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">HUD DE ESCALAÇÃO PROFISSIONAL</span>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse shrink-0" />
                    <span className="text-[7px] md:text-[8px] font-black text-primary uppercase tracking-[0.3em]">{sportType} {limit}x{limit}</span>
                </div>
            </div>
        </div>

        {/* Team Selector Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
            <button 
                onClick={() => setViewingTeam('home')}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                    viewingTeam === 'home' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'
                }`}
            >
                {homeTeamName}
            </button>
            <button 
                onClick={() => setViewingTeam('away')}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                    viewingTeam === 'away' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'
                }`}
            >
                {awayTeamName}
            </button>
        </div>
        
        {/* HUD Team Name Header */}
        <div className="w-full max-w-xl mb-4">
            <div className="relative h-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-[45deg]" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h3 className="text-base md:text-xl font-black text-white uppercase italic tracking-[0.2em] relative z-10 px-4 text-center">
                    {activeTeamName}
                </h3>
            </div>
        </div>

        {/* Perspective Container */}
        <div className="relative w-full max-w-xl py-6 md:py-12" style={{ perspective: '1200px' }}>
            
            {/* Campo 3D */}
            <div 
                className="relative w-full aspect-[1.1/1] md:aspect-[1.2/1] bg-slate-950 border-2 border-primary/20 shadow-[0_0_50px_rgba(204,255,0,0.1)] overflow-hidden transition-all duration-1000 ease-in-out"
                style={{ 
                    transform: 'rotateX(25deg)',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Gramado com Grid Cibernético */}
                <div className="absolute inset-0 bg-[#020617]">
                    <div className="absolute inset-0 opacity-20" 
                         style={{ backgroundImage: 'linear-gradient(rgba(204,255,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px md:40px md:40px' }} 
                    />
                    
                    {/* Linhas do Campo Estilizadas */}
                    <div className="absolute inset-4 border-2 border-primary/30">
                        {/* Meio de Campo */}
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-primary/20 -translate-x-1/2" />
                        <div className="absolute top-1/2 left-1/2 w-40 h-40 border-2 border-primary/30 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(204,255,0,0.1)]" />
                        
                        {/* Áreas (apenas uma pois estamos vendo o time do fundo) */}
                        <div className="absolute top-0 left-1/2 w-[60%] h-[30%] border-2 border-t-0 border-primary/30 -translate-x-1/2" />
                        
                        {/* Glowing Borders */}
                        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(204,255,0,0.1)]" />
                    </div>
                </div>

                {/* Atletas Starters (Dentro da transformação para perspectiva) */}
                <div className="absolute inset-4" style={{ transform: 'translateZ(20px)' }}>
                    {starters.map((p, i) => {
                        const { x, y } = getFormationCoords(i, starters.length, true, sportType);
                        return <PlayerNode key={p.id} player={p} x={x} y={y} />;
                    })}
                </div>
            </div>

            {/* Shadow beneath the rotated field */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/60 blur-2xl -z-10" />
        </div>

        {/* HUD FOOTER - Stats */}
        <div className="w-full max-w-xl mt-8 grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-4 rounded-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Média do Time</p>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white italic">{stats.avg.toFixed(1)}</span>
                    <div className="flex gap-0.5 mb-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FontAwesomeIcon 
                                key={i} 
                                icon={faStar} 
                                className={`text-[8px] ${i < Math.round(stats.avg) ? 'text-primary' : 'text-white/10'}`} 
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Jogador Destaque</p>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white uppercase italic truncate">
                        {stats.best?.name || '---'}
                    </span>
                    <div className="bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-[8px] font-black text-orange-500 uppercase">
                        MVP
                    </div>
                </div>
            </div>
        </div>

        {/* Área de Reservas - Mais compacta */}
        {reserves.length > 0 && (
            <div className="w-full max-w-[500px] mt-12 bg-black/40 border-y border-white/5 py-4">
                <div className="flex items-center gap-4 px-4 mb-4">
                    <FontAwesomeIcon icon={faUsers} className="text-white/20 text-xs" />
                    <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Banco de Reservas ({reserves.length})</h4>
                    <div className="flex-1 h-[1px] bg-white/5" />
                </div>
                <div className="flex flex-wrap gap-4 px-6 justify-center">
                    {reserves.map(p => <PlayerNode key={p.id} player={p} isReserve />)}
                </div>
            </div>
        )}

        <div className="mt-12 flex items-center gap-6 opacity-20 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Broadcast PRO HUD v3.0</span>
            </div>
        </div>
    </div>
  );
};


