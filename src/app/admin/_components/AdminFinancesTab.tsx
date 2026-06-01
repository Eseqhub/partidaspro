import React from 'react';
import { ExportBtn } from './AdminShared';

interface Props {
  finances: any[];
  groupNameById: Map<string, string>;
  onExport: () => void;
}

export function AdminFinancesTab({ finances, groupNameById, onExport }: Props) {
  return (
    <div>
      <div className="flex justify-end mb-2"><ExportBtn onClick={onExport} label="Exportar" /></div>
      <div className="border border-white/5 rounded-xl overflow-hidden">
        {finances.length === 0 && <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum lançamento</p>}
        {finances.map((f, i) => {
          const isReceita = f.type === 'Receita';
          return (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.description ?? f.category}
                </p>
                <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                  {groupNameById.get(f.group_id) ?? ''} · {f.category} · {f.status}
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace', color: isReceita ? '#22c55e' : '#ef4444', flexShrink: 0 }}>
                {isReceita ? '+' : '-'}R${Math.abs(Number(f.amount)).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
