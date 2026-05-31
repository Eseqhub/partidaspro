'use client';

import React from 'react';
import { Formation, xSlots } from './TacticalBoardV2/formations';

interface Props {
  formations: Formation[];
  selected: string;          // formation.id
  onSelect: (id: string) => void;
  teamName: string;
  teamColor: string;         // CSS color
}

/** Mini campo SVG mostrando os pontos da formação */
function MiniField({ formation, active, dotColor }: { formation: Formation; active: boolean; dotColor: string }) {
  const W = 42, H = 66;
  const cx = W / 2;
  const gkY = H * 0.88;
  const borderStroke = active ? dotColor : 'rgba(255,255,255,0.15)';

  // GK dot
  const dots: { cx: number; cy: number; isGk: boolean }[] = [
    { cx, cy: gkY, isGk: true },
  ];

  // Outfield dots
  formation.outfieldRows.forEach(row => {
    const slots = xSlots(row.count);
    slots.forEach(x => {
      dots.push({ cx: (x / 100) * W, cy: (row.y / 100) * H, isGk: false });
    });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {/* Campo */}
      <rect x={1} y={1} width={W - 2} height={H - 2}
        fill={active ? 'rgba(0,20,10,0.9)' : 'rgba(0,0,0,0.5)'}
        stroke={borderStroke} strokeWidth={1.2} rx={2}
      />
      {/* Linha de meio */}
      <line x1={1} y1={H / 2} x2={W - 1} y2={H / 2} stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
      {/* Círculo central */}
      <circle cx={cx} cy={H / 2} r={5} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.6} />
      {/* Área (baixo) */}
      <rect x={cx - 8} y={H * 0.84} width={16} height={H * 0.13}
        fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
      {/* Área (cima) */}
      <rect x={cx - 8} y={H * 0.03} width={16} height={H * 0.13}
        fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />

      {/* Jogadores */}
      {dots.map((d, i) => (
        <circle key={i}
          cx={d.cx} cy={d.cy}
          r={d.isGk ? 3.2 : 2.8}
          fill={d.isGk ? 'rgba(255,255,255,0.5)' : (active ? dotColor : 'rgba(255,255,255,0.35)')}
          stroke={active ? 'rgba(255,255,255,0.3)' : 'transparent'}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

export const FormationSelector: React.FC<Props> = ({
  formations, selected, onSelect, teamName, teamColor,
}) => {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: teamColor, flexShrink: 0 }} />
        <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)' }}>
          {teamName} — Formação
        </span>
      </div>

      {/* Grid de opções */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {formations.map(f => {
          const active = f.id === selected;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '6px 8px',
                background: active ? `${teamColor}14` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? teamColor : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', borderRadius: 6, transition: 'all .18s',
              }}
              title={`${f.label} — ${f.name}`}
            >
              <MiniField formation={f} active={active} dotColor={teamColor} />
              <span style={{ fontSize: 9, fontWeight: 900, color: active ? teamColor : 'rgba(255,255,255,0.4)' }}>
                {f.label}
              </span>
              <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {f.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
