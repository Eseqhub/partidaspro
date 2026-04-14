import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faStop, 
  faTrophy,
  faFutbol,
  faExpand,
  faChevronDown,
  faShirt
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
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  homeColor = 'Branco',
  awayColor = 'Preto',
  timer,
  status,
  onToggleTimer,
  onStopMatch,
  onUpdateConfig
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const colors = [
    { name: 'Branco', class: 'bg-white text-black' },
    { name: 'Preto', class: 'bg-slate-900 text-white' },
    { name: 'Azul', class: 'bg-blue-600 text-white' },
    { name: 'Amarelo', class: 'bg-yellow-400 text-black' },
    { name: 'Verde', class: 'bg-green-600 text-white' },
    { name: 'Vermelho', class: 'bg-red-600 text-white' },
    { name: 'Laranja', class: 'bg-orange-500 text-white' }
  ];

  const getVestColorClass = (colorName: string) => {
    const map: Record<string, string> = {
      'Branco': 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]',
      'Preto': 'text-zinc-800 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]',
      'Azul': 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]',
      'Amarelo': 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]',
      'Verde': 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]',
      'Vermelho': 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      'Laranja': 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'
    };
    return map[colorName] || 'text-white/10';
  };

  return (
    <>
    <GlassCard className="p-4 md:p-8 mb-8 relative border-primary/20 bg-black/40 overflow-hidden shadow-[0_0_50px_rgba(163,230,53,0.05)]">
      {/* HUD Header Decoration */}
      <div className="flex justify-between items-center mb-6 border-b border-primary/10 pb-2">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${status === 'Em curso' ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sessão {status}</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMaximized(true)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-all bg-white/5 px-3 py-1 border border-white/5"
            >
                <FontAwesomeIcon icon={faExpand} /> Maximizar HUD
            </button>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Data Feed</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 md:gap-4 lg:px-6">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-black/40 border-2 border-primary/20 rounded-xl flex items-center justify-center relative group overflow-hidden">
             <FontAwesomeIcon 
               icon={faShirt} 
               className={`text-4xl md:text-5xl transition-colors ${getVestColorClass(homeColor)}`} 
             />
             
             {/* Text indicator overlaid on shirt or below */}
             <div className="absolute bottom-1 w-full text-center px-1">
                <span className="bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10 shadow-lg">
                    {homeColor}
                </span>
             </div>
          </div>
          <h3 className="text-white font-black text-center text-[10px] md:text-sm uppercase tracking-widest mt-6 italic">{homeTeamName}</h3>
          
          <div className="relative mt-3 w-full max-w-[100px]">
            <select 
                value={homeColor}
                onChange={(e) => onUpdateConfig?.({ homeColor: e.target.value })}
                className="w-full text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 py-2 px-3 rounded hover:border-primary/40 focus:border-primary transition-all appearance-none outline-none text-center"
            >
                {colors.filter(c => c.name !== awayColor).map(c => <option key={c.name} value={c.name} className="bg-slate-900 font-bold">{c.name}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20 pointer-events-none" />
          </div>
        </div>

        {/* Score & Timer Area */}
        <div className="flex flex-col items-center gap-4 flex-grow px-2 md:px-8">
          <div className="flex items-center gap-4 md:gap-12 text-6xl md:text-[100px] font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <span className={homeScore > awayScore ? 'text-primary' : 'text-white/80'}>{homeScore}</span>
            <div className="flex flex-col items-center gap-1 opacity-20">
                <FontAwesomeIcon icon={faFutbol} className={`text-sm md:text-xl ${status === 'Em curso' ? 'animate-spin-slow' : ''}`} />
            </div>
            <span className={awayScore > homeScore ? 'text-primary' : 'text-white/80'}>{awayScore}</span>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 px-6 md:px-12 py-3 relative group overflow-hidden">
             {/* Animated Scanline */}
             <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent h-1/2 -translate-y-full group-hover:animate-scan transition-all pointer-events-none" />
             
             {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
            
            <span className={`text-2xl md:text-5xl font-mono ${status === 'Em curso' ? 'text-primary' : 'text-white/30'} font-black tracking-[0.2em] tabular-nums transition-colors`}>
              {formatTime(timer)}
            </span>
          </div>

          <div className="flex gap-2 md:gap-4 mt-2">
            <button 
                onClick={onToggleTimer}
                className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transition-all ${
                    status === 'Em curso' 
                    ? 'bg-orange-500 text-black hover:bg-orange-400 rotate-90' 
                    : 'bg-primary text-black hover:bg-primary/80'
                } shadow-[0_0_20px_rgba(163,230,53,0.1)] active:scale-95`}
            >
                <FontAwesomeIcon icon={status === 'Em curso' ? faPause : faPlay} className="text-lg md:text-2xl" />
            </button>
            <button 
                onClick={onStopMatch}
                className="w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/40 transition-all active:scale-95"
            >
                <FontAwesomeIcon icon={faStop} className="text-lg md:text-2xl" />
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-center relative group overflow-hidden">
             <FontAwesomeIcon 
               icon={faShirt} 
               className={`text-4xl md:text-5xl transition-colors ${getVestColorClass(awayColor)}`} 
             />
             
             {/* Text indicator overlaid on shirt or below */}
             <div className="absolute bottom-1 w-full text-center px-1">
                <span className="bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10 shadow-lg">
                    {awayColor}
                </span>
             </div>
          </div>
          <h3 className="text-white font-black text-center text-[10px] md:text-sm uppercase tracking-widest mt-6 italic">{awayTeamName}</h3>
          
          <div className="relative mt-3 w-full max-w-[100px]">
            <select 
                value={awayColor}
                onChange={(e) => onUpdateConfig?.({ awayColor: e.target.value })}
                className="w-full text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 py-2 px-3 rounded hover:border-primary/40 focus:border-primary transition-all appearance-none outline-none text-center"
            >
                {colors.filter(c => c.name !== homeColor).map(c => <option key={c.name} value={c.name} className="bg-slate-900 font-bold">{c.name}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20 pointer-events-none" />
          </div>
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

