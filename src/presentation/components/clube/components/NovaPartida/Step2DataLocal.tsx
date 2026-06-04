import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faClock, faMapPin, faShirt, faStar } from '@fortawesome/free-solid-svg-icons';
import { parseDias, serializeDias, labelDias, WEEKDAY_NAMES } from '@/core/services/RecurrenceService';
import { MatchDraft, Recorrencia, SHIRT_COLORS, blue, inp, lbl } from './types';

interface Props {
  draft: MatchDraft;
  modColor: string;
  set: (key: keyof MatchDraft, val: any) => void;
}

export function Step2DataLocal({ draft, modColor, set }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={lbl}><FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 6 }} />Data da partida</label>
        <input type="date" style={{ ...inp, colorScheme: 'dark' }} value={draft.data} onChange={e => set('data', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}><FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />Início</label>
          <input type="time" style={{ ...inp, colorScheme: 'dark' }} value={draft.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} />
        </div>
        <div>
          <label style={lbl}><FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />Término</label>
          <input type="time" style={{ ...inp, colorScheme: 'dark' }} value={draft.hora_fim} onChange={e => set('hora_fim', e.target.value)} />
        </div>
      </div>

      <div>
        <label style={lbl}><FontAwesomeIcon icon={faMapPin} style={{ marginRight: 6 }} />Local / Quadra</label>
        <input style={inp} value={draft.local} onChange={e => set('local', e.target.value)} placeholder="EX: ARENA GALÁCTICOS, QUADRA 3..." />
      </div>

      <div>
        <label style={lbl}>Duração de cada game (minutos)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[7, 10, 12, 15, 20].map(d => (
            <button key={d} onClick={() => set('duracao_minutos', d)}
              style={{
                padding: '8px 16px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                background: draft.duracao_minutos === d ? `${blue}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${draft.duracao_minutos === d ? blue : 'rgba(255,255,255,0.1)'}`,
                color: draft.duracao_minutos === d ? blue : 'rgba(255,255,255,0.5)', transition: 'all .2s',
              }}>
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Nomes + Cores dos times */}
      {(draft.modalidade === 'Rachão' || draft.modalidade === 'Manual' || draft.modalidade === 'Bolão') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TeamColorPicker
            label="Time A"
            name={draft.nome_time_a}
            color={draft.cor_time_a}
            onNameChange={v => set('nome_time_a', v)}
            onColorChange={v => set('cor_time_a', v)}
            namePlaceholder="TIME CASA..."
          />
          <TeamColorPicker
            label={draft.modalidade === 'Bolão' ? 'Prefixo Times' : 'Time B'}
            name={draft.nome_time_b}
            color={draft.cor_time_b}
            onNameChange={v => set('nome_time_b', v)}
            onColorChange={v => set('cor_time_b', v)}
            namePlaceholder={draft.modalidade === 'Bolão' ? 'TIME...' : 'VISITANTE...'}
          />
        </div>
      )}

      {/* Recorrência */}
      <RecorrenciaSelector draft={draft} set={set} />

      {/* Resumo */}
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>Campo</p>
          <p style={{ fontSize: 11, fontWeight: 900, color: blue }}>{draft.tipo_campo}</p>
        </div>
        <div>
          <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>Modalidade</p>
          <p style={{ fontSize: 11, fontWeight: 900, color: modColor }}>{draft.modalidade}</p>
        </div>
      </div>
    </div>
  );
}

const PROPRIO = '#a855f7';

function TeamColorPicker({ label, name, color, onNameChange, onColorChange, namePlaceholder }: {
  label: string; name: string; color: string;
  onNameChange: (v: string) => void; onColorChange: (v: string) => void;
  namePlaceholder: string;
}) {
  const isProprio = color === 'Uniforme Próprio';
  const colorHex  = isProprio ? PROPRIO : (SHIRT_COLORS.find(c => c.label === color)?.hex ?? '#fff');
  const borderColor = colorHex !== '#111111' ? colorHex : '#fff';
  return (
    <div style={{ padding: '14px 16px', background: `${borderColor}0a`, border: `1px solid ${borderColor}25`, borderRadius: 10 }}>
      <label style={{ ...lbl, marginBottom: 8 }}>{label} — Nome &amp; Colete</label>
      <input style={{ ...inp, marginBottom: 10 }} value={name} onChange={e => onNameChange(e.target.value)} placeholder={namePlaceholder} />

      {/* Coletes */}
      <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Colete</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {SHIRT_COLORS.map(c => (
          <button key={c.hex} onClick={() => onColorChange(c.label)} title={c.label}
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: color === c.label ? `${c.hex}20` : 'rgba(255,255,255,0.04)',
              outline: color === c.label ? `2px solid ${c.hex}` : '2px solid transparent',
              outlineOffset: 1, cursor: 'pointer', flexShrink: 0, border: 'none', transition: 'all .15s',
            }}>
            <FontAwesomeIcon icon={faShirt} style={{
              fontSize: 18, color: c.hex,
              filter: color === c.label ? `drop-shadow(0 0 4px ${c.hex})` : 'none',
            }} />
          </button>
        ))}
      </div>

      {/* Uniforme Próprio */}
      <button onClick={() => onColorChange('Uniforme Próprio')}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          background: isProprio ? `${PROPRIO}15` : 'rgba(255,255,255,0.03)',
          border: `2px solid ${isProprio ? PROPRIO : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: isProprio ? `${PROPRIO}25` : 'rgba(255,255,255,0.06)' }}>
          <FontAwesomeIcon icon={faStar} style={{ fontSize: 13, color: isProprio ? PROPRIO : 'rgba(255,255,255,0.3)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            color: isProprio ? PROPRIO : 'rgba(255,255,255,0.5)', marginBottom: 1 }}>Uniforme Próprio</p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>O time joga com seu próprio kit</p>
        </div>
      </button>

      {color && (
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 8, fontWeight: 700, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 5 }}>
          <FontAwesomeIcon icon={isProprio ? faStar : faShirt} style={{ color: colorHex, fontSize: 9 }} />
          {color}
        </p>
      )}
    </div>
  );
}

function RecorrenciaSelector({ draft, set }: { draft: MatchDraft; set: (key: keyof MatchDraft, val: any) => void }) {
  return (
    <div>
      <label style={{ ...lbl, marginBottom: 10 }}>🔄 Partida Recorrente</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          { id: 'nao', label: 'Única' }, { id: 'semanal', label: 'Semanal' },
          { id: 'quinzenal', label: 'Quinzenal' }, { id: 'mensal', label: 'Mensal' },
        ] as { id: Recorrencia; label: string }[]).map(r => (
          <button key={r.id} onClick={() => set('recorrencia', r.id)}
            style={{
              padding: '6px 12px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
              background: draft.recorrencia === r.id ? `${blue}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${draft.recorrencia === r.id ? blue : 'rgba(255,255,255,0.1)'}`,
              color: draft.recorrencia === r.id ? blue : 'rgba(255,255,255,0.4)',
              borderRadius: 6, transition: 'all .15s',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {draft.recorrencia !== 'nao' && (() => {
        const selectedDias = parseDias(draft.recorrencia_dia);
        const toggleDia = (d: string) => {
          const next = selectedDias.includes(d) ? selectedDias.filter(x => x !== d) : [...selectedDias, d];
          const ordered = WEEKDAY_NAMES.filter(w => next.includes(w));
          set('recorrencia_dia', serializeDias(ordered));
        };
        return (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ ...lbl }}>Dias da semana (pode marcar vários)</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(d => {
                const active = selectedDias.includes(d);
                return (
                  <button key={d} onClick={() => toggleDia(d)}
                    style={{
                      padding: '5px 10px', fontSize: 9, fontWeight: 900, cursor: 'pointer',
                      background: active ? `${blue}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? blue : 'rgba(255,255,255,0.1)'}`,
                      color: active ? blue : 'rgba(255,255,255,0.4)',
                      borderRadius: 5, transition: 'all .15s',
                    }}>
                    {d.substring(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
            {selectedDias.length > 0 ? (
              <p style={{ fontSize: 8, color: `${blue}77`, fontWeight: 700 }}>
                📅 <strong style={{ color: blue }}>{labelDias(draft.recorrencia_dia)}</strong>
                {' · '}{draft.recorrencia}{' · '}{draft.hora_inicio || '—'}
                {' '}— {selectedDias.length === 1 ? '1 dia' : `${selectedDias.length} dias`} por semana · elenco pré-selecionado.
              </p>
            ) : (
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                Selecione ao menos um dia da semana.
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
