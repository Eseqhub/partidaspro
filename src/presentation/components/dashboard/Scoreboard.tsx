import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faPause, faStop, faFutbol, faExpand, faShirt
} from '@fortawesome/free-solid-svg-icons';
import { MatchOverlay } from './MatchOverlay';

interface ScoreboardProps {
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;
  homeColor?: string;
  awayColor?: string;
  timer: number;
  status: 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';
  onToggleTimer?: () => void;
  onStopMatch?: () => void;
  onUpdateConfig?: (updates: any) => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  homeScore, awayScore,
  homeTeamName, awayTeamName,
  homeColor = 'Branco', awayColor = 'Preto',
  timer, status,
  onToggleTimer, onStopMatch, onUpdateConfig,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const colors = [
    { name: 'Branco' }, { name: 'Preto' }, { name: 'Azul' },
    { name: 'Amarelo' }, { name: 'Verde' }, { name: 'Vermelho' }, { name: 'Laranja' },
  ];

  const getVestColorClass = (colorName: string) => {
    const map: Record<string, string> = {
      'Branco':   'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]',
      'Preto':    'text-zinc-800 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]',
      'Azul':     'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]',
      'Amarelo':  'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]',
      'Verde':    'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]',
      'Vermelho': 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      'Laranja':  'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]',
    };
    return map[colorName] || 'text-white/10';
  };

  return (
    <>
      <GlassCard className="p-3 md:p-8 mb-6 md:mb-8 relative border-primary/20 bg-black/40 overflow-hidden shadow-[0_0_50px_rgba(163,230,53,0.05)]">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-4 border-b border-primary/10 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 shrink-0 ${status === 'Em curso' ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/40 truncate max-w-[140px] md:max-w-none">
              Sessão {status}
            </span>
          </div>
          <button
            onClick={() => setIsMaximized(true)}
            className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/40 hover:text-primary transition-all bg-white/5 px-2 md:px-3 py-1 border border-white/5 shrink-0"
          >
            <FontAwesomeIcon icon={faExpand} />
            <span className="hidden sm:inline">Maximizar</span>
          </button>
        </div>

        {/* ── Times + Placar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 md:gap-4">

          {/* Time Casa */}
          <div className="flex flex-col items-center gap-1 md:gap-2 min-w-0 flex-1">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-black/40 border border-primary/20 flex items-center justify-center relative overflow-hidden shrink-0">
              <FontAwesomeIcon icon={faShirt} className={`text-2xl md:text-3xl ${getVestColorClass(homeColor)}`} />
            </div>
            <h3 className="text-white font-black text-center text-[9px] md:text-xs uppercase tracking-wider italic line-clamp-2 w-full px-1">
              {homeTeamName || 'Casa'}
            </h3>
            <select
              value={homeColor}
              onChange={e => onUpdateConfig?.({ homeColor: e.target.value })}
              className="w-full max-w-[72px] md:max-w-[100px] text-[7px] md:text-[8px] font-black uppercase bg-white/5 border border-white/10 text-white/40 py-1 px-1 hover:border-primary/40 outline-none appearance-none text-center"
            >
              {colors.filter(c => c.name !== awayColor).map(c =>
                <option key={c.name} value={c.name} className="bg-slate-900">{c.name}</option>
              )}
            </select>
          </div>

          {/* Placar central */}
          <div className="flex flex-col items-center gap-1.5 md:gap-3 shrink-0">
            {/* Números */}
            <div className="flex items-center gap-2 md:gap-6">
              {/* Home controls */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => onUpdateConfig?.({ homeScore: homeScore + 1 })}
                  className="w-6 h-6 md:w-8 md:h-8 bg-primary/20 hover:bg-primary hover:text-black text-primary border border-primary/20 transition-all text-xs flex items-center justify-center"
                >+</button>
                <span className={`text-4xl sm:text-5xl md:text-[72px] font-black tabular-nums leading-none ${homeScore > awayScore ? 'text-primary' : 'text-white/80'}`}>
                  {homeScore}
                </span>
                <button
                  onClick={() => onUpdateConfig?.({ homeScore: Math.max(0, homeScore - 1) })}
                  className="w-6 h-6 md:w-8 md:h-8 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 transition-all text-xs flex items-center justify-center"
                >-</button>
              </div>

              <span className="text-white/20 font-black text-xl md:text-4xl">×</span>

              {/* Away controls */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => onUpdateConfig?.({ awayScore: awayScore + 1 })}
                  className="w-6 h-6 md:w-8 md:h-8 bg-primary/20 hover:bg-primary hover:text-black text-primary border border-primary/20 transition-all text-xs flex items-center justify-center"
                >+</button>
                <span className={`text-4xl sm:text-5xl md:text-[72px] font-black tabular-nums leading-none ${awayScore > homeScore ? 'text-primary' : 'text-white/80'}`}>
                  {awayScore}
                </span>
                <button
                  onClick={() => onUpdateConfig?.({ awayScore: Math.max(0, awayScore - 1) })}
                  className="w-6 h-6 md:w-8 md:h-8 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 transition-all text-xs flex items-center justify-center"
                >-</button>
              </div>
            </div>

            {/* Timer */}
            <div className="bg-primary/5 border border-primary/20 px-3 md:px-8 py-1.5 md:py-2 relative">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />
              <span className={`text-base sm:text-xl md:text-4xl font-mono font-black tracking-[0.1em] md:tracking-[0.2em] tabular-nums transition-colors ${status === 'Em curso' ? 'text-primary' : 'text-white/30'}`}>
                {formatTime(timer)}
              </span>
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              <button
                onClick={onToggleTimer}
                className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center transition-all ${
                  status === 'Em curso'
                    ? 'bg-orange-500 text-black hover:bg-orange-400'
                    : 'bg-primary text-black hover:bg-primary/80'
                } shadow-[0_0_20px_rgba(163,230,53,0.1)] active:scale-95`}
              >
                <FontAwesomeIcon icon={status === 'Em curso' ? faPause : faPlay} className="text-base md:text-xl" />
              </button>
              <button
                onClick={onStopMatch}
                className="w-10 h-10 md:w-14 md:h-14 bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/40 transition-all active:scale-95"
              >
                <FontAwesomeIcon icon={faStop} className="text-base md:text-xl" />
              </button>
            </div>
          </div>

          {/* Time Visitante */}
          <div className="flex flex-col items-center gap-1 md:gap-2 min-w-0 flex-1">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
              <FontAwesomeIcon icon={faShirt} className={`text-2xl md:text-3xl ${getVestColorClass(awayColor)}`} />
            </div>
            <h3 className="text-white font-black text-center text-[9px] md:text-xs uppercase tracking-wider italic line-clamp-2 w-full px-1">
              {awayTeamName || 'Visita'}
            </h3>
            <select
              value={awayColor}
              onChange={e => onUpdateConfig?.({ awayColor: e.target.value })}
              className="w-full max-w-[72px] md:max-w-[100px] text-[7px] md:text-[8px] font-black uppercase bg-white/5 border border-white/10 text-white/40 py-1 px-1 hover:border-primary/40 outline-none appearance-none text-center"
            >
              {colors.filter(c => c.name !== homeColor).map(c =>
                <option key={c.name} value={c.name} className="bg-slate-900">{c.name}</option>
              )}
            </select>
          </div>
        </div>
      </GlassCard>

      <MatchOverlay
        isOpen={isMaximized}
        onClose={() => setIsMaximized(false)}
        homeScore={homeScore}
        awayScore={awayScore}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeColor={homeColor}
        awayColor={awayColor}
        timer={timer}
        status={status}
        onToggleTimer={onToggleTimer!}
        formatTime={formatTime}
      />
    </>
  );
};
