import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faLayerGroup, faTag } from '@fortawesome/free-solid-svg-icons';
import { ExportBtn } from './AdminShared';
import { AdminPlayerRow } from './AdminPlayerRow';

interface Props {
  players: any[];
  groupNameById: Map<string, string>;
  playerGroupBy: 'club' | 'flat';
  onGroupByChange: (v: 'club' | 'flat') => void;
  deleting: string | null;
  onEdit: (p: any) => void;
  onDelete: (id: string, name: string) => void;
  onExport: () => void;
}

export function AdminPlayersTab({ players, groupNameById, playerGroupBy, onGroupByChange, deleting, onEdit, onDelete, onExport }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
          {[{ id: 'club', label: 'Por Clube', icon: faLayerGroup }, { id: 'flat', label: 'Lista', icon: faTag }].map(v => (
            <button key={v.id} onClick={() => onGroupByChange(v.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${playerGroupBy === v.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'}`}>
              <FontAwesomeIcon icon={v.icon} />{v.label}
            </button>
          ))}
        </div>
        <ExportBtn onClick={onExport} label="Exportar" />
      </div>

      {players.length === 0 && <p className="text-center py-12 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum jogador</p>}

      {playerGroupBy === 'club' ? (() => {
        const byClub = new Map<string, any[]>();
        players.forEach(p => { const k = p.group_id ?? '__'; if (!byClub.has(k)) byClub.set(k, []); byClub.get(k)!.push(p); });
        return (
          <div className="space-y-3">
            {Array.from(byClub.entries()).map(([gid, grpPlayers]) => (
              <div key={gid} className="border border-white/5 rounded-xl overflow-hidden">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(204,255,0,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#ccff00', fontSize: 12 }} />
                  <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#ccff00' }}>
                    {groupNameById.get(gid) ?? 'Sem clube'}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(204,255,0,0.6)', background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)', padding: '2px 8px', borderRadius: 20 }}>
                    {grpPlayers.length}
                  </span>
                </div>
                {grpPlayers.map(p => (
                  <AdminPlayerRow key={p.id} p={p} deleting={deleting} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            ))}
          </div>
        );
      })() : (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          {players.map(p => (
            <AdminPlayerRow key={p.id} p={p} deleting={deleting} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
