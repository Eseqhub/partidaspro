'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faHandshake, faSquare, faStar, faSatelliteDish } from '@fortawesome/free-solid-svg-icons';

interface Props {
  events: any[];
  homeTeamName: string;
  awayTeamName: string;
}

// minute armazena o tempo do evento em SEGUNDOS → exibe mm:ss
const fmtEventTime = (s?: number | null) => {
  const total = Math.max(0, Math.floor(s ?? 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const META: Record<string, { icon: any; color: string; verb: string }> = {
  'Gol':             { icon: faFutbol,    color: '#ccff00', verb: 'marcou um GOL' },
  'Assistência':     { icon: faHandshake, color: '#00b4ff', verb: 'deu assistência' },
  'Cartão Amarelo':  { icon: faSquare,    color: '#EAB308', verb: 'cartão amarelo' },
  'Cartão Vermelho': { icon: faSquare,    color: '#EF4444', verb: 'cartão vermelho' },
  'Craque':          { icon: faStar,      color: '#FFD700', verb: 'CRAQUE da partida' },
};

export const LiveFeed: React.FC<Props> = ({ events, homeTeamName, awayTeamName }) => {
  const recent = events.slice(0, 8);

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
      {/* Header ao vivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#EF4444', animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.6 }} />
          <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
        </span>
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#fff' }}>Ao Vivo</span>
        <span style={{ marginLeft: 'auto', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
          <FontAwesomeIcon icon={faSatelliteDish} style={{ marginRight: 4 }} />Súmula em tempo real
        </span>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {recent.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '28px 0', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)' }}>
            Aguardando lances...
          </p>
        ) : recent.map((ev, i) => {
          const m = META[ev.type] ?? META['Gol'];
          const teamName = ev.team === 'home' ? homeTeamName : awayTeamName;
          return (
            <div key={ev.id ?? i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              animation: i === 0 ? 'fadeInDown .4s ease-out' : undefined,
              background: i === 0 ? `${m.color}08` : 'transparent',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `${m.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={m.icon} style={{ fontSize: 11, color: m.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.player?.name ?? '—'}
                </p>
                <p style={{ fontSize: 8, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {m.verb} · <span style={{ color: 'rgba(255,255,255,0.35)' }}>{teamName}</span>
                </p>
              </div>
              {ev.minute != null && (
                <span style={{ fontSize: 11, fontWeight: 900, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {fmtEventTime(ev.minute)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes ping { 75%,100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
