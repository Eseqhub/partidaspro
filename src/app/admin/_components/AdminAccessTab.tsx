import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faPlus, faCrown, faShieldHalved, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Chip } from './AdminShared';

interface Props {
  admins: any[];
  newAdminEmail: string;
  onEmailChange: (v: string) => void;
  onAddAdmin: () => void;
  onRemoveAdmin: (email: string) => void;
}

export function AdminAccessTab({ admins, newAdminEmail, onEmailChange, onAddAdmin, onRemoveAdmin }: Props) {
  return (
    <div className="space-y-4">
      <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
          <FontAwesomeIcon icon={faKey} className="text-primary" /> Conceder acesso de admin
        </h3>
        <p className="text-[8px] text-white/30 font-bold mb-3 uppercase tracking-wide">Quem você adicionar terá acesso total a este painel.</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={newAdminEmail}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] text-white outline-none focus:border-primary/30"
          />
          <button onClick={onAddAdmin} className="px-4 py-2.5 bg-primary text-black font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> Add
          </button>
        </div>
      </div>

      <div className="border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Administradores ({admins.length})</h3>
        </div>
        {admins.map((a, i) => (
          <div key={a.email} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <FontAwesomeIcon icon={a.owner ? faCrown : faShieldHalved} style={{ color: a.owner ? '#FFD700' : 'rgba(255,255,255,0.3)', fontSize: 12, width: 16 }} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</span>
            {a.owner ? <Chip label="Owner" color="#FFD700" /> : (
              <button onClick={() => onRemoveAdmin(a.email)} style={{
                padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.5)', borderRadius: 4, cursor: 'pointer',
              }}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border border-amber-500/15 bg-amber-500/[0.04] rounded-xl">
        <p className="text-[9px] text-amber-300/70 font-bold leading-relaxed">
          ⚠️ Para a delegação funcionar, a tabela <code className="text-amber-300">super_admins</code> precisa existir no Supabase.
          Se ainda não criou, rode o SQL que o desenvolvedor te passou. Você (owner) sempre terá acesso, com ou sem a tabela.
        </p>
      </div>
    </div>
  );
}
