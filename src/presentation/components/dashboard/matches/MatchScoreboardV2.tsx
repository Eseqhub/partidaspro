import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faPause, faStop, faExpand, faShirt
} from '@fortawesome/free-solid-svg-icons';
import { MatchOverlay } from '@/presentation/components/dashboard/MatchOverlay';

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

export const ScoreboardV2: React.FC<ScoreboardProps> = ({
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
      <div className="relative group mb-6 md:mb-10">
        {/* Glow de Fundo com Gradient Dinâmico */}
        <div className={`absolute -inset-1 rounded-[2rem] blur-2xl opacity-20 transition-all duration-1000 ${
          status === 'Em curso' ? 'bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse' : 'bg-primary/20'
        }`} />
        
        <GlassCard className="p-4 md:p-8 relative border-white/10 bg-black/60 overflow-hidden shadow-2xl rounded-[1.5rem] md:rounded-[2rem]">
          {/* Header Indicador */}
          <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${status === 'Em curso' ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(204,255,0,1)]' : 'bg-white/20'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                LIVE MATCH <span className="text-primary/60">●</span> {status}
              </span>
            </div>
            <button
              onClick={() => setIsMaximized(true)}
              className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-primary transition-all bg-white/5 px-3 py-1.5 rounded-full border border-white/5"
            >
              <FontAwesomeIcon icon={faExpand} className="group-hover:scale-110 transition-transform" />
              <span>Broadcast Mode</span>
            </button>
          </div>

          {/* Layout Principal - Flex Col no Mobile, Row no Desktop */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 font-inter">
            
            {/* Bloco Time Casa */}
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 w-full md:w-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center relative group/shirt shrink-0">
                <FontAwesomeIcon icon={faShirt} className={`text-3xl md:text-4xl transition-all duration-500 group-hover/shirt:scale-110 ${getVestColorClass(homeColor)}`} />
              </div>
              <div className="flex flex-col md:items-center flex-1 min-w-0">
                <h3 className="text-white font-black text-lg md:text-sm uppercase tracking-tighter md:tracking-widest italic truncate w-full md:text-center">
                  {homeTeamName || 'REVEZAMENTO A'}
                </h3>
                <select
                  value={homeColor}
                  onChange={e => onUpdateConfig?.({ homeColor: e.target.value })}
                  className="mt-1 bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/40 py-1 px-3 rounded-full outline-none appearance-none hover:border-primary/40 transition-colors"
                >
                  {colors.filter(c => c.name !== awayColor).map(c =>
                    <option key={c.name} value={c.name} className="bg-slate-950">{c.name}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Central Score & Core Buttons */}
            <div className="flex flex-col items-center gap-6 shrink-0 order-first md:order-none w-full md:w-auto">
              <div className="flex items-center gap-4 md:gap-8">
                {/* Home Score Control */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => onUpdateConfig?.({ homeScore: homeScore + 1 })}
                    className="w-10 h-10 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 transition-all rounded-full flex items-center justify-center text-lg font-black"
                  >+</button>
                  <span className={`text-7xl md:text-[100px] font-black tabular-nums transition-all ${homeScore > awayScore ? 'text-primary drop-shadow-[0_0_20px_rgba(204,255,0,0.4)]' : 'text-white/90'}`}>
                    {homeScore}
                  </span>
                  <button
                    onClick={() => onUpdateConfig?.({ homeScore: Math.max(0, homeScore - 1) })}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 transition-all rounded-full flex items-center justify-center text-lg"
                  >-</button>
                </div>

                <div className="h-20 w-[2px] bg-gradient-to-b from-transparent via-white/10 to-transparent self-center mx-2 md:mx-4" />

                {/* Away Score Control */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => onUpdateConfig?.({ awayScore: awayScore + 1 })}
                    className="w-10 h-10 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 transition-all rounded-full flex items-center justify-center text-lg font-black"
                  >+</button>
                  <span className={`text-7xl md:text-[100px] font-black tabular-nums transition-all ${awayScore > homeScore ? 'text-primary drop-shadow-[0_0_20px_rgba(204,255,0,0.4)]' : 'text-white/90'}`}>
                    {awayScore}
                  </span>
                  <button
                    onClick={() => onUpdateConfig?.({ awayScore: Math.max(0, awayScore - 1) })}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 transition-all rounded-full flex items-center justify-center text-lg"
                  >-</button>
                </div>
              </div>

              {/* Timer Display com Gradiente de Fundo */}
              <div className="relative group/timer w-full md:w-auto">
                <div className={`absolute -inset-2 blur-xl opacity-20 transition-opacity duration-500 group-hover/timer:opacity-40 rounded-full ${status === 'Em curso' ? 'bg-primary' : 'bg-white'}`} />
                <div className="bg-black/60 border border-white/10 px-10 py-3 rounded-2xl relative flex flex-col items-center min-w-[180px]">
                  <span className={`text-3xl md:text-5xl font-black font-mono tracking-widest tabular-nums transition-colors ${status === 'Em curso' ? 'text-primary' : 'text-white/20'}`}>
                    {formatTime(timer)}
                  </span>
                  {status === 'Pausada' && (
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] absolute -bottom-1">TEMPO PAUSADO</span>
                  )}
                </div>
              </div>

              {/* Main Actions */}
              <div className="flex gap-4">
                <button
                  onClick={onToggleTimer}
                  className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-all rounded-[1.2rem] ${
                    status === 'Em curso'
                      ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                      : 'bg-primary text-black hover:bg-white shadow-[0_0_30px_rgba(204,255,0,0.3)]'
                  } active:scale-90`}
                >
                  <FontAwesomeIcon icon={status === 'Em curso' ? faPause : faPlay} className="text-xl md:text-2xl" />
                </button>
                <button
                  onClick={onStopMatch}
                  className="w-14 h-14 md:w-16 md:h-16 bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/40 transition-all rounded-[1.2rem] active:scale-90"
                >
                  <FontAwesomeIcon icon={faStop} className="text-xl md:text-2xl" />
                </button>
              </div>
            </div>

            {/* Bloco Time Visitante */}
            <div className="flex flex-row-reverse md:flex-col items-center gap-4 md:gap-3 flex-1 w-full md:w-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center relative group/shirt shrink-0">
                <FontAwesomeIcon icon={faShirt} className={`text-3xl md:text-4xl transition-all duration-500 group-hover/shirt:scale-110 ${getVestColorClass(awayColor)}`} />
              </div>
              <div className="flex flex-col items-end md:items-center flex-1 min-w-0">
                <h3 className="text-white font-black text-lg md:text-sm uppercase tracking-tighter md:tracking-widest italic truncate w-full text-right md:text-center">
                  {awayTeamName || 'REVEZAMENTO B'}
                </h3>
                <select
                  value={awayColor}
                  onChange={e => onUpdateConfig?.({ awayColor: e.target.value })}
                  className="mt-1 bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/40 py-1 px-3 rounded-full outline-none appearance-none hover:border-primary/40 transition-colors"
                >
                  {colors.filter(c => c.name !== homeColor).map(c =>
                    <option key={c.name} value={c.name} className="bg-slate-950">{c.name}</option>
                  )}
                </select>
              </div>
            </div>

          </div>
        </GlassCard>
      </div>

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
