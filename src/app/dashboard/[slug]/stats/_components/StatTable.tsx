import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal } from '@fortawesome/free-solid-svg-icons';

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
  mvps: number;
  score: number;
}

const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

interface Props {
  players: PlayerStat[];
  statKey: keyof PlayerStat;
}

export function StatTable({ players, statKey }: Props) {
  if (!players.length) return (
    <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">Sem dados ainda</p>
  );
  const max = Number(players[0][statKey]) || 1;
  return (
    <div className="space-y-1">
      {players.map((p, i) => {
        const val = Number(p[statKey]);
        const pct = (val / max) * 100;
        const initials = p.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            background: i === 0 ? 'rgba(204,255,0,0.04)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            borderRadius: 6,
          }}>
            <div style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>
              {i < 3
                ? <FontAwesomeIcon icon={faMedal} style={{ color: medals[i], fontSize: 12 }} />
                : <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
              }
            </div>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: i === 0 ? '1.5px solid rgba(204,255,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              {p.photo_url
                ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? '#ccff00' : 'rgba(255,255,255,0.4)' }}>{initials}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: i === 0 ? '#ccff00' : '#fff', marginLeft: 8, flexShrink: 0 }}>{val}</span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 1, background: i === 0 ? 'linear-gradient(90deg,#ccff00,#aadd00)' : 'rgba(255,255,255,0.2)' }} />
              </div>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                {p.matches}J · {p.wins}V · {p.positions?.[0] ?? '—'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
