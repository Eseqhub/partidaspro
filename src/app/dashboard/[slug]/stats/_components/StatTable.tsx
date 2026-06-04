import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal, faFutbol, faHandshake, faStar, faTrophy } from '@fortawesome/free-solid-svg-icons';

interface PlayerStat {
  id: string;
  name: string;
  photo_url?: string;
  positions: string[];
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  mvps: number;
  score: number;
}

const medals   = ['#FFD700', '#C0C0C0', '#CD7F32'];
const neon     = '#ccff00';
const blue     = '#00b4ff';
const gold     = '#FFD700';

const STAT_META: Record<string, { label: string; icon: any; color: string; suffix?: string }> = {
  goals:   { label: 'Gols',       icon: faFutbol,    color: neon,          suffix: '⚽' },
  assists: { label: 'Assistências', icon: faHandshake, color: blue,         suffix: '🤝' },
  mvps:    { label: 'Craques MVP', icon: faStar,      color: gold,          suffix: '🏆' },
  score:   { label: 'Ranking',     icon: faTrophy,    color: '#a855f7',     suffix: 'pts' },
};

interface Props {
  players: PlayerStat[];
  statKey: keyof PlayerStat;
}

export function StatTable({ players, statKey }: Props) {
  if (!players.length) return (
    <p style={{ textAlign: 'center', padding: '48px 0', fontSize: 10, fontWeight: 900,
      textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)' }}>
      Sem dados ainda
    </p>
  );

  const meta = STAT_META[statKey as string];
  const max  = Number(players[0][statKey]) || 1;

  return (
    <div>
      {/* Legenda */}
      {meta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          padding: '7px 12px', background: `${meta.color}0c`, border: `1px solid ${meta.color}20`, borderRadius: 8 }}>
          <FontAwesomeIcon icon={meta.icon} style={{ fontSize: 12, color: meta.color }} />
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: meta.color }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto', fontWeight: 700 }}>
            Top {Math.min(players.length, 10)}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {players.slice(0, 20).map((p, i) => {
          const val  = Number(p[statKey]);
          const pct  = (val / max) * 100;
          const initials = p.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
          const medalColor = medals[i] ?? null;
          const accentColor = i === 0 ? neon : medalColor ?? 'rgba(255,255,255,0.15)';
          const losses = p.losses ?? (p.matches - p.wins - (p.draws ?? 0));

          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: i === 0 ? `${neon}06` : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              borderRadius: 10,
              border: i === 0 ? `1px solid ${neon}18` : '1px solid transparent',
            }}>
              {/* Posição */}
              <div style={{ width: 22, textAlign: 'center', flexShrink: 0 }}>
                {i < 3
                  ? <FontAwesomeIcon icon={faMedal} style={{ color: medals[i], fontSize: 14 }} />
                  : <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${accentColor}`,
              }}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 13, fontWeight: 900, color: accentColor }}>{initials}</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? neon : '#fff', flexShrink: 0, lineHeight: 1 }}>
                    {val}
                    {meta?.suffix && <span style={{ fontSize: 9, marginLeft: 3, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{meta.suffix}</span>}
                  </span>
                </div>

                {/* Barra */}
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2,
                    background: i === 0 ? `linear-gradient(90deg,${neon},#aadd00)` : 'rgba(255,255,255,0.25)',
                    transition: 'width 0.5s ease' }} />
                </div>

                {/* V/E/D chips */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                    {p.matches}J
                  </span>
                  {p.wins > 0 && (
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 3,
                      background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                      {p.wins}V
                    </span>
                  )}
                  {(p.draws ?? 0) > 0 && (
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 3,
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {p.draws}E
                    </span>
                  )}
                  {losses > 0 && (
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 3,
                      background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {losses}D
                    </span>
                  )}
                  {p.positions?.[0] && (
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                      · {p.positions[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
