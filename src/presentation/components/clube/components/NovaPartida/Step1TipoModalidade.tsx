import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faDice, faShieldHalved, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { MatchDraft, CAMPOS, MODALIDADES, blue, gold, inp, lbl } from './types';

interface Props {
  draft: MatchDraft;
  set: (key: keyof MatchDraft, val: any) => void;
}

export function Step1TipoModalidade({ draft, set }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Tipo de campo */}
      <div>
        <label style={{ ...lbl, marginBottom: 12 }}>
          <FontAwesomeIcon icon={faFutbol} style={{ marginRight: 6 }} />Tipo de Campo
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CAMPOS.map(c => (
            <button key={c.value} onClick={() => set('tipo_campo', c.value)}
              style={{
                padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
                background: draft.tipo_campo === c.value ? `${blue}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${draft.tipo_campo === c.value ? blue : 'rgba(255,255,255,0.08)'}`,
                transition: 'all .2s',
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
              <p style={{ fontSize: 11, fontWeight: 900, color: draft.tipo_campo === c.value ? blue : '#fff', textTransform: 'uppercase' }}>{c.label}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{c.sub} jogadores</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div>
        <label style={{ ...lbl, marginBottom: 12 }}>
          <FontAwesomeIcon icon={faDice} style={{ marginRight: 6 }} />Modalidade
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODALIDADES.map(m => (
            <button key={m.value} onClick={() => set('modalidade', m.value)}
              style={{
                padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                background: draft.modalidade === m.value ? `${m.color}08` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${draft.modalidade === m.value ? m.color + '44' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all .2s',
              }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: draft.modalidade === m.value ? `${m.color}18` : 'rgba(255,255,255,0.04)',
              }}>
                <FontAwesomeIcon icon={m.icon} style={{ color: draft.modalidade === m.value ? m.color : 'rgba(255,255,255,0.3)', fontSize: 15 }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: draft.modalidade === m.value ? m.color : '#fff', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{m.desc}</p>
              </div>
              {draft.modalidade === m.value && (
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: m.color, fontSize: 14, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Nome do time adversário (só para Desafio) */}
      {draft.modalidade === 'Desafio' && (
        <div style={{ padding: '16px', background: `${gold}06`, border: `1px solid ${gold}22`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: gold }}>
            <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 6 }} />Adversário
          </p>
          <div>
            <label style={lbl}>Nome do time adversário (opcional)</label>
            <input style={inp} value={draft.nome_time_adversario ?? ''} onChange={e => set('nome_time_adversario', e.target.value)} placeholder="EX: GALÁTICOS FC..." />
          </div>
        </div>
      )}
    </div>
  );
}
