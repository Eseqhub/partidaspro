'use client';

import React from 'react';
import { MonthlyPoint } from '@/infra/repositories/AdminRepository';

interface Props {
  data: MonthlyPoint[];
}

const SERIES = [
  { key: 'matches' as const, label: 'Partidas',  color: '#00b4ff' },
  { key: 'players' as const, label: 'Jogadores', color: '#ccff00' },
  { key: 'goals'   as const, label: 'Gols',      color: '#F97316' },
];

export const ActivityChart: React.FC<Props> = ({ data }) => {
  const W = 600, H = 200;
  const padX = 28, padY = 20, padBottom = 28;
  const plotW = W - padX * 2;
  const plotH = H - padY - padBottom;

  const maxVal = Math.max(1, ...data.flatMap(d => [d.matches, d.players, d.goals]));
  const groupW = plotW / Math.max(data.length, 1);
  const barW = Math.min(14, (groupW - 8) / SERIES.length);

  // Linhas de grade (4 níveis)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: padY + plotH * (1 - t),
    val: Math.round(maxVal * t),
  }));

  return (
    <div style={{ width: '100%' }}>
      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        {SERIES.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grade */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padX} y1={g.y} x2={W - padX} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={padX - 6} y={g.y + 3} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.25)" fontWeight={700}>{g.val}</text>
          </g>
        ))}

        {/* Barras */}
        {data.map((d, gi) => {
          const gx = padX + groupW * gi + (groupW - barW * SERIES.length) / 2;
          return (
            <g key={gi}>
              {SERIES.map((s, si) => {
                const val = d[s.key];
                const h = (val / maxVal) * plotH;
                const x = gx + si * barW;
                const y = padY + plotH - h;
                return (
                  <rect key={s.key} x={x} y={y} width={barW - 2} height={Math.max(h, val > 0 ? 2 : 0)}
                    rx={2} fill={s.color} opacity={0.9}>
                    <title>{s.label}: {val}</title>
                  </rect>
                );
              })}
              {/* Rótulo do mês */}
              <text x={padX + groupW * gi + groupW / 2} y={H - 8} textAnchor="middle" fontSize={8}
                fill="rgba(255,255,255,0.4)" fontWeight={900}>{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
