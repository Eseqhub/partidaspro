import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShuffle, faPlay, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { TacticalBoardV2 } from '@/presentation/components/dashboard/TacticalBoardV2';
import { PlayerRow } from '@/presentation/components/dashboard/PlayerRow';
import { DraftResult } from '@/core/services/DraftService';
import { SportType } from '@/core/entities/match';
import { Formation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';
import { buildLineupMessage, openWhatsApp } from '@/core/services/ShareService';

const CAMPO_MAP: Record<string, { sportType: SportType; playersPerTeam: number; label: string }> = {
  'Futsal 5x5':  { sportType: 'Futsal',  playersPerTeam: 5,  label: 'Futsal 5×5'  },
  'Society 6x6': { sportType: 'Society', playersPerTeam: 6,  label: 'Society 6×6' },
  'Society 7x7': { sportType: 'Society', playersPerTeam: 7,  label: 'Society 7×7' },
  'Campo 11x11': { sportType: 'Campo',   playersPerTeam: 11, label: 'Campo 11×11' },
  'Futsal':      { sportType: 'Futsal',  playersPerTeam: 5,  label: 'Futsal 5×5'  },
  'Society':     { sportType: 'Society', playersPerTeam: 7,  label: 'Society 7×7' },
  'Campo':       { sportType: 'Campo',   playersPerTeam: 11, label: 'Campo 11×11' },
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
  onStartMatch?: () => void;
  homeFormation?: Formation;
  awayFormation?: Formation;
}

export const ActiveMatchTab: React.FC<ActiveMatchTabProps> = ({
  draftResult, config, setConfig, score, timer, status,
  setActiveTab, matchType = 'rachao', onStartMatch,
  homeFormation, awayFormation,
}) => {
  const campoCfg = CAMPO_MAP[config.tipo_campo ?? config.sport_type ?? 'Society 7x7']
    ?? { sportType: 'Society' as SportType, playersPerTeam: 7, label: 'Society 7×7' };

  if (!draftResult) {
    const msg = matchType === 'desafio'
      ? 'Aguardando o adversário aceitar o desafio'
      : 'Aguardando sorteio das equipes';
    return (
      <GlassCard className="py-20 text-center border-dashed border-white/10 rounded-2xl">
        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faShuffle} className="text-white/20 text-2xl" />
        </div>
        <p className="text-[9px] uppercase font-black tracking-[0.25em] text-white/30 mb-5">{msg}</p>
        {matchType !== 'desafio' && (
          <Button onClick={() => setActiveTab('attendance')}
            className="mx-auto py-2.5 px-6 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all text-[9px] font-black uppercase tracking-[0.3em] rounded-lg">
            IR PARA CHAMADA
          </Button>
        )}
      </GlassCard>
    );
  }

  const homeTeamName = config.homeTeamName || 'TIME A';
  const awayTeamName = config.awayTeamName || 'TIME B';

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Botão INICIAR (só quando Agendada) */}
      {status === 'Agendada' && onStartMatch && (
        <div className="flex items-center justify-between px-4 py-3 border border-primary/20 bg-primary/[0.04] rounded-xl">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/30">Sorteio concluído</p>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mt-0.5">Pronto para iniciar</p>
          </div>
          <button onClick={onStartMatch}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-black uppercase tracking-[0.25em] text-[10px] rounded-lg shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:scale-105 transition-all active:scale-95">
            <FontAwesomeIcon icon={faPlay} />
            INICIAR
          </button>
        </div>
      )}

      {/* Badge campo + prancheta */}
      <div className="flex flex-col items-center">
        {/* Campo label */}
        <div className="flex items-center gap-2 mb-3 px-3 py-1 bg-black/40 border border-white/5 rounded-lg">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Campo:</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">{campoCfg.label}</span>
        </div>

        {/* Prancheta tática — tamanho reduzido */}
        <div style={{ width: '100%', maxWidth: 280 }}>
          <TacticalBoardV2
            homeTeam={draftResult.homeTeam}
            awayTeam={draftResult.awayTeam}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeScore={score.home}
            awayScore={score.away}
            timer={timer}
            matchStatus={status as any}
            sportType={campoCfg.sportType}
            playersPerTeam={campoCfg.playersPerTeam}
            homeFormation={homeFormation}
            awayFormation={awayFormation}
          />
        </div>
      </div>

      {/* Compartilhar escalação no WhatsApp */}
      <button
        onClick={() => openWhatsApp(buildLineupMessage(
          homeTeamName, awayTeamName, draftResult.homeTeam, draftResult.awayTeam,
          { campo: campoCfg.label, local: config.location },
        ))}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
        style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
      >
        <FontAwesomeIcon icon={faWhatsapp} className="text-sm" />
        Compartilhar Escalação
      </button>

      {/* Times — layout compacto lado a lado */}
      <div className="grid grid-cols-2 gap-3">

        {/* Time A */}
        <div className="border border-white/5 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-primary/[0.06] border-b border-primary/10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white truncate max-w-[80px]">
                {homeTeamName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={faUsers} className="text-white/20" style={{ fontSize: 7 }} />
              <span className="text-[8px] font-bold text-white/30">{draftResult.homeTeam.length}</span>
            </div>
          </div>
          {/* Formação badge */}
          {homeFormation && (
            <div className="px-3 py-1 border-b border-white/[0.04] bg-black/20">
              <span className="text-[7px] font-black uppercase tracking-widest text-primary/60">
                {homeFormation.label} — {homeFormation.name}
              </span>
            </div>
          )}
          {/* Lista jogadores */}
          <div>
            {draftResult.homeTeam.map((p, i) => (
              <PlayerRow key={p.id} player={p} index={i} accentColor="#ccff00" />
            ))}
          </div>
          {/* Rating */}
          <div className="px-3 py-1.5 bg-black/20 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[7px] font-black uppercase tracking-widest text-white/20">Força média</span>
            <span className="text-[9px] font-black text-primary">{draftResult.homeRating.toFixed(0)}</span>
          </div>
        </div>

        {/* Time B */}
        <div className="border border-white/5 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-white/30 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60 truncate max-w-[80px]">
                {awayTeamName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={faUsers} className="text-white/20" style={{ fontSize: 7 }} />
              <span className="text-[8px] font-bold text-white/30">{draftResult.awayTeam.length}</span>
            </div>
          </div>
          {/* Formação badge */}
          {awayFormation && (
            <div className="px-3 py-1 border-b border-white/[0.04] bg-black/20">
              <span className="text-[7px] font-black uppercase tracking-widest text-blue-400/60">
                {awayFormation.label} — {awayFormation.name}
              </span>
            </div>
          )}
          {/* Lista jogadores */}
          <div>
            {draftResult.awayTeam.map((p, i) => (
              <PlayerRow key={p.id} player={p} index={i} accentColor="#00b4ff" />
            ))}
          </div>
          {/* Rating */}
          <div className="px-3 py-1.5 bg-black/20 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[7px] font-black uppercase tracking-widest text-white/20">Força média</span>
            <span className="text-[9px] font-black text-blue-400">{draftResult.awayRating.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Lista de espera (se houver) */}
      {draftResult.waitingList.length > 0 && (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5 bg-black/20">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
              Aguardando ({draftResult.waitingList.length})
            </span>
          </div>
          <div className="grid grid-cols-2">
            {draftResult.waitingList.map((p, i) => (
              <PlayerRow key={p.id} player={p} index={i} accentColor="#6B7280" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
