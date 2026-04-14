'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlay, faPause, faStop, faExpand } from '@fortawesome/free-solid-svg-icons';

interface MatchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;
  homeColor: string;
  awayColor: string;
  timer: number;
  status: string;
  onToggleTimer: () => void;
  formatTime: (s: number) => string;
}

export function MatchOverlay({
  isOpen,
  onClose,
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  homeColor,
  awayColor,
  timer,
  status,
  onToggleTimer,
  formatTime
}: MatchOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 select-none">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all z-50 text-xl"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>

      {/* Main Scoreboard Layout */}
      <div className="w-full max-w-7xl flex flex-col items-center gap-6 md:gap-12 relative z-10">
        
        {/* Teams & Score Row */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
          
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center md:items-end gap-4 w-full">
            <div className="flex flex-row-reverse md:flex-row items-center gap-4">
                <div className="text-center md:text-right">
                    <h2 className="text-2xl md:text-6xl font-black text-white italic uppercase tracking-tighter">{homeTeamName}</h2>
                    <div className="flex justify-center md:justify-end gap-2 mt-1 md:mt-2">
                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-primary/20 border border-primary/40 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">Mandante</span>
                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/5 border border-white/10 text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">{homeColor}</span>
                    </div>
                </div>
                <div className="w-2 md:w-4 h-12 md:h-24 rounded-none bg-primary shadow-[0_0_20px_rgba(163,230,53,0.3)]" />
            </div>
          </div>

          {/* Scores ... */}
          <div className="flex items-center gap-6 md:gap-16">
            <div className="text-7xl md:text-[180px] font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                {homeScore}
            </div>
            <div className="text-2xl md:text-6xl font-black text-white/10 italic">VS</div>
            <div className="text-7xl md:text-[180px] font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                {awayScore}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center md:items-start gap-4 w-full">
            <div className="flex items-center gap-4">
                <div className="w-2 md:w-4 h-12 md:h-24 rounded-none bg-white/20 border border-white/10" />
                <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-6xl font-black text-white italic uppercase tracking-tighter">{awayTeamName}</h2>
                    <div className="flex justify-center md:justify-start gap-2 mt-1 md:mt-2">
                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/5 border border-white/10 text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">Visitante</span>
                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/5 border border-white/10 text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">{awayColor}</span>
                    </div>
                </div>
            </div>
          </div>

        </div>

        {/* Huge Timer Container */}
        <div className="relative group p-6 md:p-12 bg-white/[0.02] border border-white/5 backdrop-blur-3xl w-full md:w-auto flex flex-col items-center">
            {/* HUD Corner Decoration ... */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />

            {/* Time Label */}
            <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-3 py-0.5 md:px-4 md:py-1 bg-primary text-black text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] italic leading-none whitespace-nowrap">
                {status === 'Em curso' ? 'MATCH CLOCK ACTIVE' : 'MATCH CLOCK PAUSED'}
            </div>

            <div 
                className={`text-7xl md:text-[240px] font-mono font-black italic tracking-tighter tabular-nums leading-none ${
                    status === 'Em curso' ? 'text-primary' : 'text-white/20'
                } transition-colors duration-500 shadow-[0_0_100px_rgba(163,230,53,0.1)]`}
            >
                {formatTime(timer)}
            </div>

            {/* Controls Sub-Overlay ... */}
            <div className="mt-4 md:mt-8 flex justify-center gap-4">
                <button 
                  onClick={onToggleTimer}
                  className={`w-14 h-14 md:w-20 md:h-20 flex items-center justify-center text-xl md:text-2xl transition-all ${
                    status === 'Em curso' ? 'bg-orange-500 text-black hover:scale-110' : 'bg-primary text-black hover:scale-110'
                  }`}
                >
                    <FontAwesomeIcon icon={status === 'Em curso' ? faPause : faPlay} />
                </button>
            </div>
        </div>

        {/* Footer / Info Row */}
        <div className="w-full max-w-3xl flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-4 md:pt-8 mt-6 md:mt-12 gap-4 md:gap-0">
            <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">PRO BROADCAST FEED</span>
                <span className="text-xs font-bold text-white uppercase italic">Partidas Pro Premium Session</span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">SESSION STATUS</span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'Em curso' ? 'bg-primary animate-pulse' : 'bg-orange-500'}`} />
                    <span className="text-xs font-bold text-white uppercase italic">{status}</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
