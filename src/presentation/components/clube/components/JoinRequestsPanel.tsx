'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faUserClock } from '@fortawesome/free-solid-svg-icons';
import { JoinRequest, JoinRequestRepository } from '@/infra/repositories/JoinRequestRepository';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';

interface Props {
  requests: JoinRequest[];
  onChanged: () => void; // refaz o fetch do dashboard
}

const green = '#22c55e';
const red   = '#ef4444';
const gold  = '#d4a017';

export const JoinRequestsPanel: React.FC<Props> = ({ requests, onChanged }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const joinRepo   = new JoinRequestRepository();
  const playerRepo = new PlayerRepository();

  if (!requests.length) return null;

  const approve = async (req: JoinRequest) => {
    setBusy(req.id);
    try {
      await playerRepo.create({
        group_id: req.group_id,
        name: req.name,
        full_name: req.full_name,
        nationality: req.nationality,
        phone: req.phone,
        email: req.email,
        role: (req.role as any) || 'jogador',
        birth_date: req.birth_date,
        preferred_foot: (req.preferred_foot as any) ?? 'R',
        positions: (req.positions && req.positions.length ? req.positions : ['MO']) as any,
        height: req.height,
        weight: req.weight,
        photo_url: req.photo_url,
        rating: 3.0,
        status: 'Ativo',
        is_mensalista: false,
      } as any);
      await joinRepo.delete(req.id);
      onChanged();
    } catch (e: any) {
      alert('Erro ao aprovar: ' + (e?.message ?? ''));
    } finally {
      setBusy(null);
    }
  };

  const reject = async (req: JoinRequest) => {
    if (!confirm(`Recusar a entrada de ${req.name}?`)) return;
    setBusy(req.id);
    try {
      await joinRepo.delete(req.id);
      onChanged();
    } catch (e: any) {
      alert('Erro ao recusar: ' + (e?.message ?? ''));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ marginBottom: 24, border: `1px solid ${gold}33`, background: `${gold}08`, borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${gold}22` }}>
        <FontAwesomeIcon icon={faUserClock} style={{ color: gold, fontSize: 13 }} />
        <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: gold }}>
          Solicitações de Entrada
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 900, color: '#fff',
          background: `${gold}22`, padding: '2px 8px', borderRadius: 10 }}>
          {requests.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {requests.map(req => {
          const initial = req.name?.[0]?.toUpperCase() ?? '?';
          const pos = req.positions?.[0] ?? '';
          return (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, flexShrink: 0, overflow: 'hidden', borderRadius: '50%',
                border: `2px solid ${gold}33`, background: 'rgba(0,0,0,0.5)' }}>
                {req.photo_url
                  ? <img src={req.photo_url} alt={req.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, fontWeight: 900, color: gold }}>{initial}</div>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.name}</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.full_name || '—'}{pos ? ` · ${pos}` : ''}
                </p>
              </div>

              <button onClick={() => approve(req)} disabled={busy === req.id}
                title="Aprovar"
                style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${green}18`, border: `1px solid ${green}40`, color: green, cursor: 'pointer',
                  borderRadius: 4, opacity: busy === req.id ? 0.4 : 1 }}>
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button onClick={() => reject(req)} disabled={busy === req.id}
                title="Recusar"
                style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${red}12`, border: `1px solid ${red}33`, color: red, cursor: 'pointer',
                  borderRadius: 4, opacity: busy === req.id ? 0.4 : 1 }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
