import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { POS_CLR } from './AdminShared';

interface Props {
  p: any;
  deleting: string | null;
  onEdit: (p: any) => void;
  onDelete: (id: string, name: string) => void;
}

export function AdminPlayerRow({ p, deleting, onEdit, onDelete }: Props) {
  const lvl = p.skill_level ?? Math.round((p.rating ?? 3) * 2);
  const initials = p.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>{initials}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
        {p.phone && <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>📞 {p.phone}</p>}
      </div>
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {(p.positions ?? []).slice(0, 2).map((pos: string) => (
          <span key={pos} style={{
            fontSize: 6, fontWeight: 900, padding: '1px 4px', borderRadius: 3,
            background: `${POS_CLR[pos] ?? '#6B7280'}18`, border: `1px solid ${POS_CLR[pos] ?? '#6B7280'}35`,
            color: POS_CLR[pos] ?? '#6B7280',
          }}>{pos}</span>
        ))}
      </div>
      <span style={{
        fontSize: 12, fontWeight: 900, minWidth: 18, textAlign: 'right', flexShrink: 0,
        color: lvl >= 8 ? '#ccff00' : lvl >= 6 ? '#00b4ff' : 'rgba(255,255,255,0.3)',
      }}>{lvl}</span>
      <button onClick={() => onEdit(p)} style={{
        padding: '3px 7px', fontSize: 9, background: 'rgba(204,255,0,0.08)',
        border: '1px solid rgba(204,255,0,0.2)', color: '#ccff00', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
      }}>
        <FontAwesomeIcon icon={faPen} />
      </button>
      <button disabled={deleting === p.id} onClick={() => onDelete(p.id, p.name)} style={{
        padding: '3px 7px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.5)', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
      }}>
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  );
}
