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
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 select-none">
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
      <div className="w-full max-w-7xl flex flex-col items-center gap-12 relative z-10">
        
        {/* Teams & Score Row */}
        <div className="w-full flex items-center justify-between gap-12">
          
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-end gap-4">
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">{homeTeamName}</h2>
                    <div className="flex justify-end gap-2 mt-2">
                        <span className="px-3 py-1 bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-widest leading-none">Mandante</span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest leading-none">{homeColor}</span>
                    </div>
                </div>
                <div className="w-4 h-24 rounded-none bg-primary shadow-[0_0_20px_rgba(163,230,53,0.3)]" />
            </div>
          </div>

          {/* Scores ... */}
          <div className="flex items-center gap-8 md:gap-16">
            <div className="text-8xl md:text-[180px] font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                {homeScore}
            </div>
            <div className="text-4xl md:text-6xl font-black text-white/10 italic">VS</div>
            <div className="text-8xl md:text-[180px] font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                {awayScore}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-start gap-4">
            <div className="flex items-center gap-4">
                <div className="w-4 h-24 rounded-none bg-white/20 border border-white/10" />
                <div className="text-left">
                    <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">{awayTeamName}</h2>
                    <div className="flex justify-start gap-2 mt-2">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest leading-none">Visitante</span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest leading-none">{awayColor}</span>
                    </div>
                </div>
            </div>
          </div>

        </div>

        {/* Huge Timer Container */}
        <div className="relative group p-12 bg-white/[0.02] border border-white/5 backdrop-blur-3xl">
            {/* HUD Corner Decoration */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />

            {/* Time Label */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">
                {status === 'Em curso' ? 'MATCH CLOCK ACTIVE' : 'MATCH CLOCK PAUSED'}
            </div>

            <div 
                className={`text-[120px] md:text-[240px] font-mono font-black italic tracking-tighter tabular-nums leading-none ${
                    status === 'Em curso' ? 'text-primary' : 'text-white/20'
                } transition-colors duration-500 shadow-[0_0_100px_rgba(163,230,53,0.1)]`}
            >
                {formatTime(timer)}
            </div>

            {/* Controls Sub-Overlay (Hidden until hover) */}
            <div className="mt-8 flex justify-center gap-4">
                <button 
                  onClick={onToggleTimer}
                  className={`w-20 h-20 flex items-center justify-center text-2xl transition-all ${
                    status === 'Em curso' ? 'bg-orange-500 text-black hover:scale-110' : 'bg-primary text-black hover:scale-110'
                  }`}
                >
                    <FontAwesomeIcon icon={status === 'Em curso' ? faPause : faPlay} />
                </button>
            </div>
        </div>

        {/* Footer / Info Row */}
        <div className="w-full max-w-3xl flex items-center justify-between border-t border-white/10 pt-8 mt-12">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">PRO BROADCAST FEED</span>
                <span className="text-xs font-bold text-white uppercase italic">Partidas Pro Premium Session</span>
            </div>
            <div className="flex flex-col items-end gap-1">
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
