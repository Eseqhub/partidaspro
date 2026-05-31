'use client';

import React from 'react';
import { Player } from '@/core/entities/player';

interface Props {
  player: Player;
  index: number;
  accentColor?: string;
}

const POS_COLOR: Record<string, string> = {
  G:   '#EAB308',
  LD: '#22C55E', LE: '#22C55E',
  ZAG: '#16A34A', ZGD: '#16A34A', ZGE: '#16A34A',
  VOL: '#2563EB', MC: '#3B82F6', MD: '#3B82F6', ME: '#3B82F6',
  MO:  '#8B5CF6',
  PD:  '#F97316', PE: '#F97316',
  SA:  '#ccff00', CA: '#EF4444',
};

export const PlayerRow: React.FC<Props> = ({ player, index, accentColor = '#ccff00' }) => {
  const pos   = player.positions?.[0] ?? 'MC';
  const posClr = POS_COLOR[pos] ?? '#6B7280';
  const lvl   = player.skill_level ?? Math.round((player.rating ?? 3) * 2);
  const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 10px',
      background: index % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      transition: 'background .15s',
    }}>
      {/* Número */}
      <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.2)', minWidth: 14, textAlign: 'right' }}>
        {index + 1}
      </span>

      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        border: `1.5px solid ${accentColor}30`,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 9, fontWeight: 900, color: accentColor }}>{initials}</span>
        }
      </div>

      {/* Nome */}
      <span style={{
        flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: '#fff',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {player.name.split(' ')[0]}
        {player.name.split(' ').length > 1 && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            {' '}{player.name.split(' ').slice(1).join(' ')}
          </span>
        )}
      </span>

      {/* Posição */}
      <span style={{
        fontSize: 7, fontWeight: 900, padding: '1px 5px',
        background: `${posClr}18`, border: `1px solid ${posClr}40`,
        color: posClr, borderRadius: 3, flexShrink: 0,
      }}>
        {pos}
      </span>

      {/* Nível */}
      <span style={{
        fontSize: 11, fontWeight: 900, minWidth: 18, textAlign: 'center',
        color: lvl >= 8 ? accentColor : lvl >= 6 ? '#60A5FA' : 'rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}>
        {lvl}
      </span>
    </div>
  );
};
