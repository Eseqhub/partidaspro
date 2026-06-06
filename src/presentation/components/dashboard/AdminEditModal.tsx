'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFloppyDisk, faSpinner } from '@fortawesome/free-solid-svg-icons';

export interface EditField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  span2?: boolean; // ocupa as 2 colunas
}

interface Props {
  title: string;
  subtitle?: string;
  accent?: string;
  fields: EditField[];
  initial: Record<string, any>;
  onClose: () => void;
  onSave: (updates: Record<string, any>) => Promise<void>;
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12,
  fontWeight: 600, outline: 'none', boxSizing: 'border-box', borderRadius: 6,
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
  letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 5,
};

export const AdminEditModal: React.FC<Props> = ({ title, subtitle, accent = '#ccff00', fields, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Record<string, any>>({ ...initial });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Converte números
      const out: Record<string, any> = {};
      fields.forEach(f => {
        let v = form[f.key];
        if (f.type === 'number') v = v === '' || v === null ? null : Number(v);
        if (typeof v === 'string') v = v.trim() === '' ? null : v.trim();
        out[f.key] = v;
      });
      await onSave(out);
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
        background: 'linear-gradient(160deg,#0a1428,#020810)', border: `1px solid ${accent}25`, borderRadius: 12 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0a1428', zIndex: 1 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: accent }}>{title}</p>
            {subtitle && <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map(f => (
              <div key={f.key} style={{ gridColumn: f.span2 ? '1 / -1' : undefined }}>
                <label style={lbl}>{f.label}</label>
                {f.type === 'select' ? (
                  <select style={{ ...inp, cursor: 'pointer' }} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                    {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input style={inp} type={f.type === 'number' ? 'number' : 'text'} value={form[f.key] ?? ''}
                    placeholder={f.placeholder} onChange={e => set(f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', marginTop: 16, padding: '12px 0', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.2em', border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer',
              background: `linear-gradient(135deg,${accent},${accent}aa)`, color: '#000' }}>
            <FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} spin={saving} style={{ marginRight: 8 }} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
