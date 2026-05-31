import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShuffle } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { TacticalBoardV2 } from '@/presentation/components/dashboard/TacticalBoardV2';
import { PlayerCard } from '@/presentation/components/dashboard/PlayerCard';
import { DraftResult } from '@/core/services/DraftService';
import { SportType } from '@/core/entities/match';

// Mapa: tipo_campo (do wizard / banco) → SportKey + playersPerTeam esperado pelo TacticalBoardV2
const CAMPO_MAP: Record<string, { sportType: SportType; playersPerTeam: number; label: string }> = {
  'Futsal 5x5':  { sportType: 'Futsal',   playersPerTeam: 5,  label: 'Futsal 5×5'   },
  'Society 6x6': { sportType: 'Society',  playersPerTeam: 6,  label: 'Society 6×6'  },
  'Society 7x7': { sportType: 'Society',  playersPerTeam: 7,  label: 'Society 7×7'  },
  'Campo 11x11': { sportType: 'Campo',    playersPerTeam: 11, label: 'Campo 11×11'  },
  // fallbacks dos valores antigos
  'Futsal':      { sportType: 'Futsal',   playersPerTeam: 5,  label: 'Futsal 5×5'   },
  'Society':     { sportType: 'Society',  playersPerTeam: 7,  label: 'Society 7×7'  },
  'Campo':       { sportType: 'Campo',    playersPerTeam: 11, label: 'Campo 11×11'  },
};

interface ActiveMatchTabProps {
  draftResult: DraftResult | null;
  config: any;
  setConfig: (cfg: any) => void;
  score: { home: number; away: number };
  timer: number;
  status: string;
  setActiveTab: (tab: any) => void;
  matchType?: 'rachao' | 'desafio';
}

export const ActiveMatchTab: React.FC<ActiveMatchTabProps> = ({
  draftResult,
  config,
  setConfig,
  score,
  timer,
  status,
  setActiveTab,
  matchType = 'rachao',
}) => {
  // Resolve as configurações do campo com base no tipo_campo real da partida
  const campoCfg = CAMPO_MAP[config.tipo_campo ?? config.sport_type ?? 'Society 7x7']
    ?? { sportType: 'Society' as SportType, playersPerTeam: 7, label: 'Society 7×7' };

  if (!draftResult) {
    const emptyMsg = matchType === 'desafio'
      ? 'Aguardando o adversário aceitar o desafio'
      : 'Aguardando sorteio das equipes';
    const emptyBtn = matchType === 'desafio'
      ? null
      : (
        <Button
          onClick={() => setActiveTab('attendance')}
          className="mx-auto py-3 px-8 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all text-[10px] font-black uppercase tracking-[0.3em] rounded-lg"
        >
          IR PARA CHAMADA
        </Button>
      );

    return (
      <GlassCard className="py-24 text-center border-dashed border-white/10 animate-in fade-in zoom-in duration-500 rounded-2xl">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faShuffle} className="text-white/20 text-3xl" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-6">{emptyMsg}</p>
        {emptyBtn}
      </GlassCard>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Badge do tipo de campo (read-only — vem da partida criada) */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3 px-5 py-2 bg-black/40 border border-white/5 rounded-xl">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Campo:</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            {campoCfg.label}
          </span>
          {matchType === 'desafio' && (
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              DESAFIO
            </span>
          )}
        </div>
      </div>

      {/* Prancheta Tática */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="mb-12 flex justify-center w-full relative">
          <div className="w-full flex justify-center" style={{ maxWidth: 320 }}>
            <TacticalBoardV2
              homeTeam={draftResult.homeTeam}
              awayTeam={draftResult.awayTeam}
              homeTeamName={config.homeTeamName || 'TIME A'}
              awayTeamName={config.awayTeamName || 'TIME B'}
              homeScore={score.home}
              awayScore={score.away}
              timer={timer}
              matchStatus={status as any}
              sportType={campoCfg.sportType}
              playersPerTeam={campoCfg.playersPerTeam}
            />
          </div>
        </div>
      </div>

      {/* Grid de Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Time A */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                {config.homeTeamName || 'TIME MANDANTE'}
              </h3>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-md">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                RANKG: {draftResult.homeRating.toFixed(1)}
              </span>
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
                {config.awayTeamName || 'TIME VISITANTE'}
              </h3>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-md">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                RANKG: {draftResult.awayRating.toFixed(1)}
              </span>
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
