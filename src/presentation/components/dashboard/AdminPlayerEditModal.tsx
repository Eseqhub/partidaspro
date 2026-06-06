'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFloppyDisk, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Props {
  player: any;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, any>) => Promise<void>;
}

const POSITIONS = ['G','LD','LE','ZAG','ZGD','ZGE','VOL','MC','MD','ME','MO','PE','PD','SA','CA'];

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12,
  fontWeight: 600, outline: 'none', boxSizing: 'border-box', borderRadius: 6,
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
  letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 5,
};

export const AdminPlayerEditModal: React.FC<Props> = ({ player, onClose, onSave }) => {
  const [name, setName]           = useState(player.name ?? '');
  const [fullName, setFullName]   = useState(player.full_name ?? '');
  const [phone, setPhone]         = useState(player.phone ?? '');
  const [positions, setPositions] = useState<string[]>(player.positions ?? []);
  const [skill, setSkill]         = useState<number>(player.skill_level ?? Math.round((player.rating ?? 3) * 2));
  const [status, setStatus]       = useState(player.status ?? 'Ativo');
  const [mensalista, setMensalista] = useState<boolean>(!!player.is_mensalista);
  const [saving, setSaving]       = useState(false);

  const togglePos = (p: string) =>
    setPositions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(player.id, {
        name: name.trim(),
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        positions,
        skill_level: skill,
        rating: Math.max(1, Math.min(5, Math.round(skill / 2))),
        status,
        is_mensalista: mensalista,
      });
      onClose();
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90dvh', overflowY: 'auto',
        background: 'linear-gradient(160deg,#0a1428,#020810)', border: '1px solid rgba(204,255,0,0.15)', borderRadius: 12 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0a1428', zIndex: 1 }}>
          <div>
            <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#ccff00' }}>Editar Jogador</p>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>{player.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Apelido</label>
              <input style={inp} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Telefone</label>
              <input style={inp} value={phone} placeholder="(00) 00000-0000" onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Nome completo</label>
            <input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          {/* Posições */}
          <div>
            <label style={lbl}>Posições</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {POSITIONS.map(p => {
                const active = positions.includes(p);
                return (
                  <button key={p} onClick={() => togglePos(p)}
                    style={{ padding: '4px 8px', fontSize: 9, fontWeight: 900, borderRadius: 5, cursor: 'pointer',
                      background: active ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? '#ccff00' : 'rgba(255,255,255,0.1)'}`,
                      color: active ? '#ccff00' : 'rgba(255,255,255,0.4)' }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skill */}
          <div>
            <label style={lbl}>Nível de habilidade: <span style={{ color: '#ccff00' }}>{skill}/10</span></label>
            <input type="range" min={1} max={10} value={skill}
              onChange={e => setSkill(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#ccff00' }} />
          </div>

          {/* Status + Mensalista */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Status</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Mensalista</label>
              <button onClick={() => setMensalista(m => !m)}
                style={{ ...inp, cursor: 'pointer', textAlign: 'left',
                  color: mensalista ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  borderColor: mensalista ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)' }}>
                {mensalista ? '✓ Sim, é mensalista' : 'Não'}
              </button>
            </div>
          </div>

          {/* Ações */}
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{ padding: '12px 0', marginTop: 4, fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.2em', border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer',
              background: name.trim() ? 'linear-gradient(135deg,#ccff00,#aadd00)' : 'rgba(255,255,255,0.05)',
              color: name.trim() ? '#000' : 'rgba(255,255,255,0.2)' }}>
            <FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} spin={saving} style={{ marginRight: 8 }} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
