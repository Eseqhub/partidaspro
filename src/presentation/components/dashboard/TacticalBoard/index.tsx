'use client';

import React, { useState, useMemo } from 'react';
import { Player } from '@/core/entities/player';
import { MatchEvent } from '@/core/entities/match';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUsers, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { getLineLimit, getFormationCoords, FieldPlayerNode, ReservePlayerNode } from './playerUtils';

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

export const TacticalBoard: React.FC<TacticalBoardProps> = ({
  homeTeam, awayTeam,
  homeTeamName = 'MANDANTE', awayTeamName = 'VISITANTE',
  sportType = 'Society',
}) => {
  const [viewingTeam, setViewingTeam] = useState<'home' | 'away'>('home');
  const limit       = getLineLimit(sportType);
  const activeTeam  = viewingTeam === 'home' ? homeTeam : awayTeam;
  const activeName  = viewingTeam === 'home' ? homeTeamName : awayTeamName;
  const starters    = activeTeam.slice(0, limit);
  const reserves    = activeTeam.slice(limit);

  const stats = useMemo(() => {
    if (!activeTeam.length) return { avg: 0, best: null as Player | null };
    const avg  = activeTeam.reduce((a, p) => a + (p.rating || 3), 0) / activeTeam.length;
    const best = [...activeTeam].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    return { avg, best };
  }, [activeTeam]);

  return (
    <div className="w-full flex flex-col items-center select-none animate-in fade-in duration-700">

      {/* Header */}
      <div className="w-full max-w-xl mb-8">
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

      {/* Seletor de times */}
      <div className="flex gap-2 mb-8 p-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
        {(['home', 'away'] as const).map(side => (
          <button key={side} onClick={() => setViewingTeam(side)}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
              viewingTeam === side ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'
            }`}>
            {side === 'home' ? homeTeamName : awayTeamName}
          </button>
        ))}
      </div>

      {/* Nome do time ativo */}
      <div className="w-full max-w-xl mb-4">
        <div className="relative h-12 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-[45deg]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <h3 className="text-base md:text-xl font-black text-white uppercase italic tracking-[0.2em] relative z-10 px-4 text-center">{activeName}</h3>
        </div>
      </div>

      {/* Campo 3D */}
      <div className="relative w-full max-w-xl py-6 md:py-12" style={{ perspective: '1200px' }}>
        <div className="relative w-full aspect-[1.1/1] md:aspect-[1.2/1] bg-slate-950 border-2 border-primary/20 shadow-[0_0_50px_rgba(204,255,0,0.1)] overflow-hidden transition-all duration-1000 ease-in-out"
          style={{ transform: 'rotateX(25deg)', transformStyle: 'preserve-3d' }}>
          {/* Gramado */}
          <div className="absolute inset-0 bg-[#020617]">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(rgba(204,255,0,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(204,255,0,0.1) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="absolute inset-4 border-2 border-primary/30">
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-primary/20 -translate-x-1/2" />
              <div className="absolute top-1/2 left-1/2 w-40 h-40 border-2 border-primary/30 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(204,255,0,0.1)]" />
              <div className="absolute top-0 left-1/2 w-[60%] h-[30%] border-2 border-t-0 border-primary/30 -translate-x-1/2" />
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(204,255,0,0.1)]" />
            </div>
          </div>
          {/* Jogadores titulares */}
          <div className="absolute inset-4" style={{ transform: 'translateZ(20px)' }}>
            {starters.map((p, i) => {
              const { x, y } = getFormationCoords(i, starters.length, true, sportType);
              return <FieldPlayerNode key={p.id} player={p} x={x} y={y} />;
            })}
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/60 blur-2xl -z-10" />
      </div>

      {/* Stats HUD */}
      <div className="w-full max-w-xl mt-8 grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-4 rounded-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Média do Time</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white italic">{stats.avg.toFixed(1)}</span>
            <div className="flex gap-0.5 mb-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <FontAwesomeIcon key={i} icon={faStar}
                  className={`text-[8px] ${i < Math.round(stats.avg) ? 'text-primary' : 'text-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Jogador Destaque</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-white uppercase italic truncate">{stats.best?.name || '---'}</span>
            <div className="bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-[8px] font-black text-orange-500 uppercase">MVP</div>
          </div>
        </div>
      </div>

      {/* Banco de reservas */}
      {reserves.length > 0 && (
        <div className="w-full max-w-[500px] mt-12 bg-black/40 border-y border-white/5 py-4">
          <div className="flex items-center gap-4 px-4 mb-4">
            <FontAwesomeIcon icon={faUsers} className="text-white/20 text-xs" />
            <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Banco de Reservas ({reserves.length})</h4>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>
          <div className="flex flex-wrap gap-4 px-6 justify-center">
            {reserves.map(p => <ReservePlayerNode key={p.id} player={p} />)}
          </div>
        </div>
      )}

      <div className="mt-12 flex items-center gap-6 opacity-20 hover:opacity-100 transition-opacity">
        <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Broadcast PRO HUD v3.0</span>
      </div>
    </div>
  );
};
