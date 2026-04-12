import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faStop, 
  faTrophy,
  faFutbol
} from '@fortawesome/free-solid-svg-icons';

interface ScoreboardProps {
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;
  timer: number;
  status: 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';
  onToggleTimer?: () => void;
  onStopMatch?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  timer,
  status,
  onToggleTimer,
  onStopMatch
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GlassCard className="p-4 md:p-8 mb-8 relative border-primary/20 bg-black/40">
      {/* HUD Header Decoration */}
      <div className="flex justify-between items-center mb-6 border-b border-primary/10 pb-2">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${status === 'Em curso' ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sessão {status}</span>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Data Feed</div>
      </div>
      
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-dark-surface border-2 border-primary/20 flex items-center justify-center relative group">
             <FontAwesomeIcon icon={faTrophy} className="text-white/10 group-hover:text-primary transition-colors text-2xl md:text-3xl" />
             <div className="absolute top-0 left-0 w-1 h-3 bg-primary" />
          </div>
          <h3 className="text-white font-black text-center text-xs md:text-sm uppercase tracking-wider mt-3">{homeTeamName}</h3>
        </div>

        {/* Score & Timer Area */}
        <div className="flex flex-col items-center gap-4 flex-grow px-2 md:px-8">
          <div className="flex items-center gap-4 md:gap-8 text-6xl md:text-8xl font-black text-white tabular-nums tracking-tighter">
            <span className={homeScore > awayScore ? 'text-primary' : ''}>{homeScore}</span>
            <div className="flex flex-col items-center gap-1 opacity-20">
                <FontAwesomeIcon icon={faFutbol} className="text-sm md:text-xl animate-spin-slow" />
            </div>
            <span className={awayScore > homeScore ? 'text-primary' : ''}>{awayScore}</span>
          </div>
          
          <div className="bg-primary/10 border border-primary/30 px-4 md:px-8 py-2 relative">
             {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />
            <span className="text-2xl md:text-4xl font-mono text-primary font-black tracking-widest tabular-nums">
              {formatTime(timer)}
            </span>
          </div>

          <div className="flex gap-2 md:gap-4">
            <button 
                onClick={onToggleTimer}
                className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center transition-all ${
                    status === 'Em curso' 
                    ? 'bg-accent text-white hover:bg-accent/80' 
                    : 'bg-primary text-black hover:bg-primary/80'
                }`}
            >
                <FontAwesomeIcon icon={status === 'Em curso' ? faPause : faPlay} className="text-lg md:text-xl" />
            </button>
            <button 
                onClick={onStopMatch}
                className="w-10 h-10 md:w-14 md:h-14 bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <FontAwesomeIcon icon={faStop} className="text-lg md:text-xl" />
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-dark-surface border-2 border-white/5 flex items-center justify-center relative group">
            <FontAwesomeIcon icon={faTrophy} className="text-white/10 group-hover:text-primary transition-colors text-2xl md:text-3xl" />
            <div className="absolute top-0 right-0 w-1 h-3 bg-white/20" />
          </div>
          <h3 className="text-white font-black text-center text-xs md:text-sm uppercase tracking-wider mt-3">{awayTeamName}</h3>
        </div>
      </div>
    </GlassCard>
  );
};

