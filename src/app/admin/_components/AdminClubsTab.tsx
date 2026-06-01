import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faPen, faEye, faTrash, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Chip, ExportBtn, STATUS_COLOR } from './AdminShared';

interface Props {
  groups: any[];
  groupDetails: Record<string, any>;
  expandedGroup: string | null;
  deleting: string | null;
  onExpand: (id: string) => void;
  onEdit: (g: any) => void;
  onDelete: (id: string, name: string) => void;
  onExport: () => void;
}

export function AdminClubsTab({ groups, groupDetails, expandedGroup, deleting, onExpand, onEdit, onDelete, onExport }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-1"><ExportBtn onClick={onExport} label="Exportar" /></div>
      {groups.length === 0 && <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum clube</p>}
      {groups.map((g, i) => {
        const expanded = expandedGroup === g.id;
        const details = groupDetails[g.id];
        return (
          <div key={g.id} className="border border-white/5 rounded-xl overflow-hidden">
            <div onClick={() => onExpand(g.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
              background: expanded ? 'rgba(204,255,0,0.03)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: expanded ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}>
                {g.logo_url
                  ? <img src={g.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <FontAwesomeIcon icon={faShieldHalved} style={{ color: expanded ? '#ccff00' : 'rgba(255,255,255,0.15)', fontSize: 14 }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{g.name}</p>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>/{g.slug} · {g.sport_type_default || 'Society'}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onEdit(g); }} style={{
                padding: '4px 8px', fontSize: 9, background: 'rgba(204,255,0,0.08)',
                border: '1px solid rgba(204,255,0,0.2)', color: '#ccff00', borderRadius: 4, cursor: 'pointer',
              }}>
                <FontAwesomeIcon icon={faPen} />
              </button>
              <Link href={`/dashboard/${g.slug}`} onClick={e => e.stopPropagation()}>
                <button style={{
                  padding: '4px 10px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                  background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)',
                  color: '#00b4ff', borderRadius: 4, cursor: 'pointer',
                }}>
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </Link>
              <button disabled={deleting === g.id} onClick={e => { e.stopPropagation(); onDelete(g.id, g.name); }} style={{
                padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.5)', borderRadius: 4, cursor: 'pointer',
              }}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
              <FontAwesomeIcon icon={faChevronRight} style={{
                fontSize: 10, color: 'rgba(255,255,255,0.2)',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s',
              }} />
            </div>

            {expanded && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', background: 'rgba(0,0,0,0.3)' }}>
                {!details ? <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                        Elenco ({details.players.length})
                      </p>
                      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                        {details.players.map((p: any) => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>{p.positions?.[0]}</span>
                            <span style={{ fontSize: 9, fontWeight: 900, color: '#ccff00', minWidth: 16, textAlign: 'right' }}>{p.skill_level ?? Math.round((p.rating ?? 3) * 2)}</span>
                          </div>
                        ))}
                        {details.players.length === 0 && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Sem jogadores</p>}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                        Partidas ({details.matchCount})
                      </p>
                      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                        {details.matches.map((m: any) => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[m.status] ?? '#fff', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 8, fontWeight: 700, color: '#fff' }}>{m.home_score}–{m.away_score}</span>
                            <Chip label={m.status} color={STATUS_COLOR[m.status]} />
                          </div>
                        ))}
                        {details.matches.length === 0 && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Sem partidas</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
