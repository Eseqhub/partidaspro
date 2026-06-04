import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faPause, faStop, faExpand, faShirt, faChevronDown, faChevronUp,
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
  duration?: number;   // minutos
  stoppage?: number;   // minutos de acréscimo
  matchInfo?: {
    campo?: string;
    gameMode?: string;
    location?: string;
    rotationRule?: string;
  };
  onToggleTimer?: () => void;
  onStopMatch?: () => void;
  onUpdateConfig?: (updates: any) => void;
}

const neon  = '#ccff00';
const blue  = '#00b4ff';

const rotationLabel = (r?: string) => ({
  winner_stays: 'Ganhador Fica',
  two_and_out:  'Jogou 2 Sai',
  goal_diff:    'Dif. de Gols',
} as any)[r ?? ''] ?? '';

const VEST_COLORS: { label: string; hex: string }[] = [
  { label: 'Branco',   hex: '#ffffff' },
  { label: 'Preto',    hex: '#222222' },
  { label: 'Vermelho', hex: '#EF4444' },
  { label: 'Azul',     hex: '#3B82F6' },
  { label: 'Verde',    hex: '#22C55E' },
  { label: 'Amarelo',  hex: '#EAB308' },
  { label: 'Laranja',  hex: '#F97316' },
  { label: 'Roxo',     hex: '#A855F7' },
  { label: 'Rosa',     hex: '#EC4899' },
  { label: 'Cinza',    hex: '#6B7280' },
  { label: 'Ciano',    hex: '#06B6D4' },
  { label: 'Marrom',   hex: '#92400E' },
];

const getVestHex = (colorName: string) =>
  VEST_COLORS.find(v => v.label === colorName)?.hex ?? '#fff';

export const ScoreboardV2: React.FC<ScoreboardProps> = ({
  homeScore, awayScore,
  homeTeamName, awayTeamName,
  homeColor = 'Branco', awayColor = 'Preto',
  timer, status,
  duration = 0, stoppage = 0,
  matchInfo,
  onToggleTimer, onStopMatch, onUpdateConfig,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [expanded,    setExpanded]    = useState(false);

  const colors = [
    'Branco','Preto','Vermelho','Azul','Verde','Amarelo',
    'Laranja','Roxo','Rosa','Cinza','Ciano','Marrom',
  ];

  const fmt = (s: number) => {
    const m = Math.floor(Math.abs(s) / 60);
    const sc = Math.abs(s) % 60;
    return `${m.toString().padStart(2,'0')}:${sc.toString().padStart(2,'0')}`;
  };

  const totalSec  = (duration + stoppage) * 60;
  const remaining = totalSec > 0 ? Math.max(0, totalSec - timer) : null;
  const isOvertime = totalSec > 0 && timer > totalSec;
  const pct = totalSec > 0 ? Math.min(1, timer / totalSec) : 0;

  const live = status === 'Em curso';

  return (
    <>
      {/* ── Compact Scoreboard ──────────────────────────────────────────── */}
      <div className="relative mb-4">
        {/* Glow */}
        <div className={`absolute -inset-0.5 blur-xl opacity-10 transition-all duration-700 rounded-2xl ${
          live ? 'bg-primary animate-pulse' : 'bg-white/10'
        }`} />

        <div style={{
          background: 'linear-gradient(160deg,rgba(0,0,0,0.9) 0%,rgba(0,10,25,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden', position: 'relative',
        }}>

          {/* ── Row 1: Status bar ──────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: live ? neon : 'rgba(255,255,255,0.2)',
                boxShadow: live ? `0 0 8px ${neon}` : 'none',
                animation: live ? 'pulse 1.5s infinite' : 'none',
              }} />
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)' }}>
                LIVE MATCH <span style={{ color: live ? neon : 'transparent' }}>●</span>
              </span>
              <span style={{
                fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                padding: '2px 8px', borderRadius: 4,
                background: live ? `${neon}18` : 'rgba(255,255,255,0.04)',
                color: live ? neon : 'rgba(255,255,255,0.3)',
                border: `1px solid ${live ? neon + '30' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setExpanded(e => !e)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)', padding: '4px 8px', cursor: 'pointer', borderRadius: 6 }}>
                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} style={{ fontSize: 7 }} />
                {expanded ? 'Recolher' : 'Expandir'}
              </button>
              <button onClick={() => setIsMaximized(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)', padding: '4px 8px', cursor: 'pointer', borderRadius: 6 }}>
                <FontAwesomeIcon icon={faExpand} style={{ fontSize: 7 }} />
                Broadcast
              </button>
            </div>
          </div>

          {/* ── Row 2: Score principal ─────────────────────────────────── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center', gap: 12, padding: '14px 16px',
          }}>
            {/* Time A */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FontAwesomeIcon icon={faShirt} style={{ fontSize: 22, color: getVestHex(homeColor), flexShrink: 0,
                filter: `drop-shadow(0 0 6px ${getVestHex(homeColor)}66)` }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {homeTeamName || 'Time A'}
                </p>
                {expanded && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {VEST_COLORS.filter(v => v.label !== awayColor).map(v => (
                      <button key={v.label} type="button" title={v.label}
                        onClick={() => onUpdateConfig?.({ homeColor: v.label })}
                        style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', border: 'none',
                          background: homeColor === v.label ? `${v.hex}25` : 'rgba(255,255,255,0.04)',
                          outline: homeColor === v.label ? `2px solid ${v.hex}` : '2px solid transparent',
                          outlineOffset: 1, transition: 'all 0.12s' }}>
                        <FontAwesomeIcon icon={faShirt} style={{ fontSize: 14, color: v.hex,
                          filter: homeColor === v.label ? `drop-shadow(0 0 3px ${v.hex})` : 'none' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Score central */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Home score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <button onClick={() => onUpdateConfig?.({ homeScore: homeScore + 1 })}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${neon}18`, border: `1px solid ${neon}30`, color: neon,
                      fontSize: 14, fontWeight: 900, cursor: 'pointer', borderRadius: 4 }}>+</button>
                  <span style={{ fontSize: 42, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1,
                    color: homeScore > awayScore ? neon : '#fff',
                    textShadow: homeScore > awayScore ? `0 0 24px ${neon}88` : 'none' }}>
                    {homeScore}
                  </span>
                  <button onClick={() => onUpdateConfig?.({ homeScore: Math.max(0, homeScore - 1) })}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer', borderRadius: 4 }}>−</button>
                </div>

                <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>:</span>

                {/* Away score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <button onClick={() => onUpdateConfig?.({ awayScore: awayScore + 1 })}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${blue}18`, border: `1px solid ${blue}30`, color: blue,
                      fontSize: 14, fontWeight: 900, cursor: 'pointer', borderRadius: 4 }}>+</button>
                  <span style={{ fontSize: 42, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1,
                    color: awayScore > homeScore ? blue : '#fff',
                    textShadow: awayScore > homeScore ? `0 0 24px ${blue}88` : 'none' }}>
                    {awayScore}
                  </span>
                  <button onClick={() => onUpdateConfig?.({ awayScore: Math.max(0, awayScore - 1) })}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer', borderRadius: 4 }}>−</button>
                </div>
              </div>
            </div>

            {/* Time B */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {awayTeamName || 'Time B'}
                </p>
                {expanded && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, justifyContent: 'flex-end' }}>
                    {VEST_COLORS.filter(v => v.label !== homeColor).map(v => (
                      <button key={v.label} type="button" title={v.label}
                        onClick={() => onUpdateConfig?.({ awayColor: v.label })}
                        style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', border: 'none',
                          background: awayColor === v.label ? `${v.hex}25` : 'rgba(255,255,255,0.04)',
                          outline: awayColor === v.label ? `2px solid ${v.hex}` : '2px solid transparent',
                          outlineOffset: 1, transition: 'all 0.12s' }}>
                        <FontAwesomeIcon icon={faShirt} style={{ fontSize: 14, color: v.hex,
                          filter: awayColor === v.label ? `drop-shadow(0 0 3px ${v.hex})` : 'none' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <FontAwesomeIcon icon={faShirt} style={{ fontSize: 22, color: getVestHex(awayColor), flexShrink: 0,
                filter: `drop-shadow(0 0 6px ${getVestHex(awayColor)}66)` }} />
            </div>
          </div>

          {/* ── Row 3: Timer + controles + tempo restante ──────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
          }}>
            {/* Cronômetro */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em',
                color: live ? neon : 'rgba(255,255,255,0.5)',
                textShadow: live ? `0 0 16px ${neon}66` : 'none' }}>
                {fmt(timer)}
              </span>
              {isOvertime && (
                <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                  color: '#F97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                  padding: '2px 6px' }}>
                  +{fmt(timer - totalSec)}
                </span>
              )}
            </div>

            {/* Play / Stop */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onToggleTimer} style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: live ? '#F97316' : neon, color: '#000',
                boxShadow: live ? '0 0 16px rgba(249,115,22,0.35)' : `0 0 16px ${neon}44`,
              }}>
                <FontAwesomeIcon icon={live ? faPause : faPlay} style={{ fontSize: 14 }} />
              </button>
              <button onClick={onStopMatch} style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.5)',
              }}>
                <FontAwesomeIcon icon={faStop} style={{ fontSize: 14 }} />
              </button>
            </div>

            {/* Tempo restante */}
            {remaining !== null ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.2)', marginBottom: 1 }}>
                  {isOvertime ? 'acréscimos' : 'restante'}
                </p>
                <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace',
                  color: remaining < 60 ? '#EF4444' : remaining < 180 ? '#F97316' : 'rgba(255,255,255,0.45)' }}>
                  {isOvertime ? `+${fmt(timer - totalSec)}` : fmt(remaining)}
                </span>
              </div>
            ) : (
              <div style={{ width: 56 }} />
            )}
          </div>

          {/* ── Row 4: Progress bar ────────────────────────────────────── */}
          {totalSec > 0 && (
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{
                height: '100%', transition: 'width 1s linear',
                width: `${pct * 100}%`,
                background: pct >= 1 ? '#EF4444' : `linear-gradient(90deg,${neon},${blue})`,
              }} />
            </div>
          )}

          {/* ── Row 5: Info chips (expandido ou sempre) ───────────────── */}
          {(matchInfo?.campo || matchInfo?.gameMode || matchInfo?.rotationRule || matchInfo?.location) && (
            <div style={{
              display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
              padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              {[
                matchInfo.campo,
                matchInfo.gameMode,
                rotationLabel(matchInfo.rotationRule),
                matchInfo.location,
              ].filter(Boolean).map((item, i) => (
                <span key={i} style={{
                  fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.25)', padding: '2px 7px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 4,
                }}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
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
        formatTime={fmt}
      />
    </>
  );
};
