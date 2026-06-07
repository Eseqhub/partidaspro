import React from 'react';
import { Player } from '@/core/entities/player';

const BLUE = '#00b4ff';

const POS_COLOR: Record<string, string> = {
  G:   '#EAB308',
  ZAG: '#22C55E', ZGD: '#22C55E', ZGE: '#22C55E', LD: '#22C55E', LE: '#22C55E',
  VOL: '#3B82F6', MC: '#3B82F6', MD: '#3B82F6', ME: '#3B82F6', MO: '#8B5CF6',
  PD:  '#F97316', PE: '#F97316', SA: '#ccff00', CA: '#EF4444',
};

interface PlayerNodeProps {
  player: Player;
  x: number;
  y: number;
  num: number;
  scale?: number;
}

export const PlayerNode: React.FC<PlayerNodeProps> = ({ player, x, y, num, scale = 1 }) => {
  const name     = player.name.split(' ')[0].substring(0, 9).toUpperCase();
  const pos      = (player.posicao_principal ?? player.positions?.[0] ?? 'SA').toUpperCase();
  const posColor = POS_COLOR[pos] ?? BLUE;
  const skill    = player.skill_level ?? Math.round((player.rating ?? 3) * 2);
  const sz       = Math.round(28 * scale); // menor: 28 em vez de 34

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20"
      style={{ left: `${x}%`, top: `${y}%`, transition: 'all 0.7s cubic-bezier(.34,1.56,.64,1)' }}
    >
      {/* Glow no chão */}
      <div style={{ position: 'absolute', width: sz + 8, height: sz + 8, borderRadius: '50%',
        background: `radial-gradient(circle,${posColor}20 0%,transparent 70%)`,
        filter: 'blur(4px)', transform: 'translateY(2px)' }} />

      {/* Avatar */}
      <div style={{ position: 'relative', width: sz, height: sz, borderRadius: '50%',
        border: `2px solid ${posColor}`, boxShadow: `0 0 8px ${posColor}55`,
        overflow: 'hidden', background: '#0a1628', flexShrink: 0 }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg,#0a2040,#071428)' }}>
            <div style={{ width: sz * .38, height: sz * .38, borderRadius: '50%',
              background: `${posColor}33`, marginBottom: 1 }} />
            <div style={{ width: sz * .55, height: sz * .25, borderRadius: '40% 40% 0 0',
              background: `${posColor}22` }} />
          </div>
        )}
        {/* Nº */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, fontSize: 5, fontWeight: 900,
          background: '#0057b8', color: '#fff', padding: '0 2px', borderTopLeftRadius: 2 }}>
          {num}
        </div>
      </div>

      {/* Badge único: nome + pos·skill abaixo */}
      <div style={{ marginTop: 1, padding: '1px 3px', background: 'rgba(0,0,0,0.90)',
        border: `1px solid ${posColor}33`, borderRadius: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <span style={{ fontSize: 5, fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '0.04em', color: '#fff', lineHeight: 1.3 }}>
          {name}
        </span>
        <span style={{ fontSize: 4.5, fontWeight: 900, color: posColor, lineHeight: 1.2 }}>
          {pos}·{skill}
        </span>
      </div>
    </div>
  );
};
