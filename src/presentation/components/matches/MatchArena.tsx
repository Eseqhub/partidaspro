'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Play, Pause, RotateCcw, Plus, User } from 'lucide-react';

interface MatchArenaProps {
  matchId: string;
  initialData: {
    homeScore: number;
    awayScore: number;
    timerSeconds: number;
    isTimerRunning: boolean;
  };
}

export const MatchArena: React.FC<MatchArenaProps> = ({ matchId, initialData }) => {
  const [seconds, setSeconds] = useState(initialData.timerSeconds);
  const [isRunning, setIsRunning] = useState(initialData.isTimerRunning);
  const [homeScore, setHomeScore] = useState(initialData.homeScore);
  const [awayScore, setAwayScore] = useState(initialData.awayScore);

  // Lógica do Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Scoreboard Premium */}
      <GlassCard className="p-8 bg-slate-900/60 border-primary/20">
        <div className="flex items-center justify-between gap-10">
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="text-3xl font-black">HT</span>
            </div>
            <h3 className="font-bold text-white text-center">Home Team</h3>
            <div className="text-7xl font-black text-white">{homeScore}</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-bold text-white/40 uppercase tracking-[0.3em]">TEMPO</div>
            <div className="text-5xl font-mono font-black text-primary bg-black/40 px-6 py-2 rounded-xl border border-white/5 tabular-nums leading-none">
              {formatTime(seconds)}
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-primary/60 font-bold">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
              {isRunning ? 'EM CURSO' : 'PAUSADO'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <span className="text-3xl font-black">AT</span>
            </div>
            <h3 className="font-bold text-white text-center">Away Team</h3>
            <div className="text-7xl font-black text-white">{awayScore}</div>
          </div>
        </div>
      </GlassCard>

      {/* Controles do Organizador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h4 className="text-xs font-bold text-white/40 uppercase mb-4">Controle de Tempo</h4>
          <div className="flex gap-4">
             <Button 
               className="flex-1 gap-2" 
               variant={isRunning ? 'glass' : 'primary'}
               onClick={() => setIsRunning(!isRunning)}
             >
               {isRunning ? <Pause size={20} /> : <Play size={20} />}
               {isRunning ? 'Pausar' : 'Iniciar'}
             </Button>
             <Button variant="outline" className="h-12 w-12 p-0 border-white/10 text-white/40 hover:text-white">
                <RotateCcw size={20} />
             </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h4 className="text-xs font-bold text-white/40 uppercase mb-4">Ações Rápidas</h4>
          <div className="flex gap-2">
             <Button variant="glass" size="sm" className="flex-1 gap-2 text-[10px] font-bold">
                <Plus size={14} /> GOL
             </Button>
             <Button variant="glass" size="sm" className="flex-1 gap-2 text-[10px] font-bold">
                <Plus size={14} /> ASSIST.
             </Button>
             <Button variant="glass" size="sm" className="flex-1 gap-2 text-[10px] font-bold">
                <Plus size={14} /> FALTA
             </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
