import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faFlagCheckered } from '@fortawesome/free-solid-svg-icons';
import { Chip, ExportBtn, STATUS_COLOR } from './AdminShared';

interface Props {
  matches: any[];
  groupNameById: Map<string, string>;
  deleting: string | null;
  onEdit: (m: any) => void;
  onDelete: (id: string, label: string) => void;
  onFinalize: (id: string) => void;
  onFinalizeAll: () => void;
  onExport: () => void;
}

export function AdminMatchesTab({ matches, groupNameById, deleting, onEdit, onDelete, onFinalize, onFinalizeAll, onExport }: Props) {
  const openCount = matches.filter(m => m.status !== 'Finalizada').length;
  return (
    <div>
      <div className="flex justify-between items-center mb-2 gap-2">
        {openCount > 0 ? (
          <button onClick={onFinalizeAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-black uppercase tracking-widest rounded hover:bg-green-500/20 transition-all">
            <FontAwesomeIcon icon={faFlagCheckered} /> Finalizar {openCount} em aberto
          </button>
        ) : <span />}
        <ExportBtn onClick={onExport} label="Exportar" />
      </div>
      <div className="border border-white/5 rounded-xl overflow-hidden">
        {matches.length === 0 && <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhuma partida</p>}
        {matches.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[m.status] ?? '#fff' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.home_team_name || 'A'} <span style={{ color: 'rgba(255,255,255,0.5)' }}>{m.home_score}–{m.away_score}</span> {m.away_team_name || 'B'}
              </p>
              <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                {groupNameById.get(m.group_id) ?? ''}{m.date ? ` · ${new Date(m.date).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
            <Chip label={m.status} color={STATUS_COLOR[m.status]} />
            {m.status !== 'Finalizada' && (
              <button onClick={() => onFinalize(m.id)} title="Finalizar partida" style={{
                padding: '4px 8px', fontSize: 9, background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 4, cursor: 'pointer',
              }}>
                <FontAwesomeIcon icon={faFlagCheckered} />
              </button>
            )}
            <button onClick={() => onEdit(m)} style={{
              padding: '4px 8px', fontSize: 9, background: 'rgba(204,255,0,0.08)',
              border: '1px solid rgba(204,255,0,0.2)', color: '#ccff00', borderRadius: 4, cursor: 'pointer',
            }}>
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button disabled={deleting === m.id} onClick={() => onDelete(m.id, `${m.home_team_name} vs ${m.away_team_name}`)} style={{
              padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.4)', borderRadius: 4, cursor: 'pointer',
            }}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
