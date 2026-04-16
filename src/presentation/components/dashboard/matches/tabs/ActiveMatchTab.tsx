import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShuffle, faPlay, faPause, faStop, faExpand, faShirt } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { TacticalBoardV2 } from '@/presentation/components/dashboard/TacticalBoardV2';
import { PlayerCard } from '@/presentation/components/dashboard/PlayerCard';
import { MatchOverlay } from '@/presentation/components/dashboard/MatchOverlay';
import { DraftResult } from '@/core/services/DraftService';
import { SportType } from '@/core/entities/match';

interface ActiveMatchTabProps {
  draftResult: DraftResult | null;
  config: any;
  setConfig: (cfg: any) => void;
  score: { home: number; away: number };
  timer: number;
  status: string;
  setActiveTab: (tab: any) => void;
}

export const ActiveMatchTab: React.FC<ActiveMatchTabProps> = ({
  draftResult,
  config,
  setConfig,
  score,
  timer,
  status,
  setActiveTab,
}) => {
  if (!draftResult) {
    return (
      <GlassCard className="py-24 text-center border-dashed border-white/10 animate-in fade-in zoom-in duration-500 rounded-2xl">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faShuffle} className="text-white/20 text-3xl" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-6">Aguardando sorteio das equipes</p>
        <Button 
          onClick={() => setActiveTab('attendance')}
          className="mx-auto py-3 px-8 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all text-[10px] font-black uppercase tracking-[0.3em] rounded-lg"
        >
          IR PARA CHAMADA
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Seletor de Modalidade Compacto */}
      <div className="flex flex-wrap justify-center gap-2 p-1 bg-black/40 border border-white/5 rounded-xl self-center max-w-fit mx-auto">
        {['Futsal', 'Society', 'Campo'].map((mode) => (
          <button
            key={mode}
            onClick={() => setConfig({ ...config, sport_type: mode as any })}
            className={`px-6 py-2 text-[8px] font-black uppercase tracking-widest transition-all rounded-lg ${
              config.sport_type === mode 
              ? 'bg-primary text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]' 
              : 'text-white/40 hover:text-white/60'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Prancheta Tática com Background Gradiente Sutil */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="mb-12 flex justify-center w-full relative">
          <div className="w-full flex justify-center" style={{ maxWidth: 320 }}>
            <TacticalBoardV2
              homeTeam={draftResult.homeTeam}
              awayTeam={draftResult.awayTeam}
              homeTeamName={config.homeTeamName || "TIME A"}
              awayTeamName={config.awayTeamName || "TIME B"}
              homeScore={score.home}
              awayScore={score.away}
              timer={timer}
              matchStatus={status as any}
              sportType={config.sport_type as SportType}
              playersPerTeam={config.playersPerTeam}
            />
          </div>
        </div>
      </div>

      {/* Grid de Times - Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Time A */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                {config.homeTeamName || "TIME MANDANTE"}
              </h3>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-md">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">RANKG: {draftResult.homeRating.toFixed(1)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draftResult.homeTeam.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>

        {/* Time B */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-white/20 rounded-full" />
              <h3 className="text-sm font-black text-white/60 uppercase tracking-[0.2em] italic">
                {config.awayTeamName || "TIME VISITANTE"}
              </h3>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-md">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">RANKG: {draftResult.awayRating.toFixed(1)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draftResult.awayTeam.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
