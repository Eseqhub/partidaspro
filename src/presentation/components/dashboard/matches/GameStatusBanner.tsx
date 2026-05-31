'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faHourglassHalf, faBullhorn } from '@fortawesome/free-solid-svg-icons';

interface Props {
  confirmed: number;
  playersPerTeam: number;
}

/**
 * "Vai dar jogo?" — mostra se há gente suficiente pra fechar os times.
 */
export const GameStatusBanner: React.FC<Props> = ({ confirmed, playersPerTeam }) => {
  const needed = playersPerTeam * 2;            // mínimo p/ 2 times
  const missing = Math.max(0, needed - confirmed);
  const teamsPossible = Math.floor(confirmed / playersPerTeam);
  const pct = Math.min(100, Math.round((confirmed / needed) * 100));

  let state: 'go' | 'close' | 'low';
  if (confirmed >= needed) state = 'go';
  else if (missing <= 3) state = 'close';
  else state = 'low';

  const cfg = {
    go:    { color: '#22C55E', icon: faCircleCheck,    title: 'Vai dar jogo!',        sub: `${confirmed} confirmados · ${teamsPossible} ${teamsPossible === 1 ? 'time' : 'times'} de ${playersPerTeam}` },
    close: { color: '#EAB308', icon: faHourglassHalf,  title: 'Quase lá!',             sub: `Faltam ${missing} pra fechar ${playersPerTeam} × ${playersPerTeam}` },
    low:   { color: '#00b4ff', icon: faBullhorn,       title: 'Chamando a galera',     sub: `${confirmed}/${needed} · faltam ${missing} pra ${playersPerTeam} × ${playersPerTeam}` },
  }[state];

  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12,
      background: `${cfg.color}0c`, border: `1px solid ${cfg.color}35`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${cfg.color}1a`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={cfg.icon} style={{ color: cfg.color, fontSize: 16 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: cfg.color, letterSpacing: '0.05em' }}>
            {cfg.title}
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
            {cfg.sub}
          </p>
        </div>
        <span style={{ fontSize: 22, fontWeight: 900, color: cfg.color, flexShrink: 0 }}>{confirmed}</span>
      </div>
      {/* Barra de progresso */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 2, transition: 'width .4s ease-out' }} />
      </div>
    </div>
  );
};
