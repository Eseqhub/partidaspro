import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faShuffle, faUsers, faClock, faMapPin, faArrowsRotate, faCalendarDays, faShirt, faStar } from '@fortawesome/free-solid-svg-icons';
import { GameMode } from '@/core/entities/match';
import { CreateMatchConfig, RotationRule } from './types';

interface Props {
  cfg: CreateMatchConfig;
  set: (patch: Partial<CreateMatchConfig>) => void;
  onSubmit: () => void;
  mode?: 'rachao' | 'manual';
}

const inputCls = `w-full bg-black/40 border border-white/10 p-3 text-white text-xs font-bold uppercase tracking-wider outline-none transition-colors placeholder:text-white/20`;
const labelCls = 'block text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1.5';
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const neon = '#ccff00';
const blue = '#00b4ff';

// Colete especial "Uniforme Próprio"
const PROPRIO_COLOR = '#a855f7'; // roxo para diferenciar

// Paleta de coletes
const UNIFORMS: { label: string; hex: string }[] = [
  { label: 'Branco',   hex: '#ffffff' },
  { label: 'Preto',    hex: '#222222' },
  { label: 'Vermelho', hex: '#EF4444' },
  { label: 'Azul',     hex: '#3B82F6' },
  { label: 'Verde',    hex: '#22C55E' },
  { label: 'Amarelo',  hex: '#EAB308' },
  { label: 'Laranja',  hex: '#F97316' },
  { label: 'Roxo',     hex: '#A855F7' },
  { label: 'Rosa',     hex: '#EC4899' },
  { label: 'Cinza',    hex: '#6B7280' },
  { label: 'Ciano',    hex: '#06B6D4' },
  { label: 'Marrom',   hex: '#92400E' },
];

function ShirtPicker({ label, teamName, onNameChange, namePlaceholder, color, onColorChange, exclude }: {
  label: string; teamName: string; color: string;
  onNameChange: (v: string) => void; onColorChange: (v: string) => void;
  namePlaceholder: string; exclude?: string;
}) {
  const isProprio = color === 'Uniforme Próprio';
  const hex = isProprio ? PROPRIO_COLOR : (UNIFORMS.find(u => u.label === color)?.hex ?? '#fff');
  const border = hex === '#ffffff' ? 'rgba(255,255,255,0.4)' : hex;

  return (
    <div style={{ padding: '14px', background: `${border}0c`, border: `1px solid ${border}25`, borderRadius: 10 }}>
      <label style={{ display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
        letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
        {label}
      </label>
      <input
        value={teamName} onChange={e => onNameChange(e.target.value)} placeholder={namePlaceholder}
        style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12,
          fontWeight: 700, outline: 'none', marginBottom: 10, boxSizing: 'border-box' as const, borderRadius: 6 }}
      />

      {/* Label seção coletes */}
      <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Colete</p>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {UNIFORMS.filter(u => u.label !== exclude).map(u => {
          const selected = color === u.label;
          return (
            <button key={u.label} type="button" title={u.label} onClick={() => onColorChange(u.label)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selected ? `${u.hex}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${selected ? u.hex : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: selected ? `0 0 10px ${u.hex}66` : 'none',
              }}>
              <FontAwesomeIcon icon={faShirt} style={{ fontSize: 18, color: u.hex,
                filter: selected ? `drop-shadow(0 0 4px ${u.hex})` : 'none' }} />
            </button>
          );
        })}
      </div>

      {/* Uniforme Próprio */}
      <button type="button" onClick={() => onColorChange('Uniforme Próprio')}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          background: isProprio ? `${PROPRIO_COLOR}18` : 'rgba(255,255,255,0.03)',
          border: `2px solid ${isProprio ? PROPRIO_COLOR : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: isProprio ? `0 0 12px ${PROPRIO_COLOR}44` : 'none' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: isProprio ? `${PROPRIO_COLOR}25` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isProprio ? PROPRIO_COLOR : 'rgba(255,255,255,0.12)'}` }}>
          <FontAwesomeIcon icon={faStar} style={{ fontSize: 14, color: isProprio ? PROPRIO_COLOR : 'rgba(255,255,255,0.3)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            color: isProprio ? PROPRIO_COLOR : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: 1 }}>
            Uniforme Próprio
          </p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
            O time joga com seu próprio kit
          </p>
        </div>
        {isProprio && (
          <FontAwesomeIcon icon={faShirt} style={{ fontSize: 16, color: PROPRIO_COLOR, flexShrink: 0 }} />
        )}
      </button>

      {/* Label selecionado */}
      {color && (
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 8,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FontAwesomeIcon icon={isProprio ? faStar : faShirt} style={{ color: hex, fontSize: 10 }} />
          {color}
        </p>
      )}
    </div>
  );
}

// campo → sport_type + playersPerTeam
const FIELD_MAP: Record<string, { sport: 'Futsal' | 'Society' | 'Campo'; ppt: number }> = {
  'Futsal 5x5':  { sport: 'Futsal',   ppt: 5  },
  'Society 6x6': { sport: 'Society',  ppt: 6  },
  'Society 7x7': { sport: 'Society',  ppt: 7  },
  'Campo 11x11': { sport: 'Campo',    ppt: 11 },
};

function currentFieldType(cfg: CreateMatchConfig): string {
  if (cfg.sport_type === 'Futsal') return 'Futsal 5x5';
  if (cfg.sport_type === 'Campo')  return 'Campo 11x11';
  return cfg.playersPerTeam <= 6 ? 'Society 6x6' : 'Society 7x7';
}

export const RachaoForm: React.FC<Props> = ({ cfg, set, onSubmit, mode = 'rachao' }) => {
  const accent = mode === 'rachao' ? neon : blue;

  const handleFieldChange = (fieldType: string) => {
    const m = FIELD_MAP[fieldType];
    if (m) set({ sport_type: m.sport, playersPerTeam: m.ppt });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        <div>
          <label className={labelCls}><FontAwesomeIcon icon={faFutbol} className="mr-1" /> Modalidade</label>
          <select className={selectCls} value={currentFieldType(cfg)}
            onChange={e => handleFieldChange(e.target.value)}>
            <option value="Futsal 5x5"  className="bg-slate-900">Futsal (5x5)</option>
            <option value="Society 6x6" className="bg-slate-900">Society (6x6)</option>
            <option value="Society 7x7" className="bg-slate-900">Society (7x7)</option>
            <option value="Campo 11x11" className="bg-slate-900">Campo (11x11)</option>
          </select>
        </div>

        {mode === 'rachao' && (
          <div>
            <label className={labelCls}>Modo do Jogo</label>
            <select className={selectCls} value={cfg.game_mode}
              onChange={e => set({ game_mode: e.target.value as GameMode })}>
              <option value="Rachão"      className="bg-slate-900">Rachão (Vencedor Fica)</option>
              <option value="Revezamento" className="bg-slate-900">Revezamento Dinâmico</option>
              <option value="Dois ou Dez" className="bg-slate-900">Dois ou Dez</option>
              <option value="Vira-Acaba"  className="bg-slate-900">Vira-Acaba</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>Atletas por Time</label>
          <input type="number" className={inputCls} value={cfg.playersPerTeam} min={2} max={11}
            onChange={e => set({ playersPerTeam: +e.target.value })} />
        </div>

        {/* Horário da sessão */}
        <div>
          <label className={labelCls}><FontAwesomeIcon icon={faCalendarDays} className="mr-1" /> Início da sessão</label>
          <input type="time" className={inputCls} value={cfg.sessionStartTime}
            onChange={e => set({ sessionStartTime: e.target.value })}
            style={{ colorScheme: 'dark' }} />
        </div>

        <div>
          <label className={labelCls}><FontAwesomeIcon icon={faCalendarDays} className="mr-1" /> Fim da sessão</label>
          <input type="time" className={inputCls} value={cfg.sessionEndTime}
            onChange={e => set({ sessionEndTime: e.target.value })}
            style={{ colorScheme: 'dark' }} />
          {cfg.sessionStartTime && cfg.sessionEndTime && (() => {
            const [sh, sm] = cfg.sessionStartTime.split(':').map(Number);
            const [eh, em] = cfg.sessionEndTime.split(':').map(Number);
            const total = (eh * 60 + em) - (sh * 60 + sm);
            if (total > 0) return (
              <p style={{ fontSize: 8, color: neon, fontWeight: 900, marginTop: 4 }}>
                {total} min de sessão total
              </p>
            );
            return null;
          })()}
        </div>

        {/* Duração de cada jogo */}
        <div className="sm:col-span-2">
          <label className={labelCls}><FontAwesomeIcon icon={faClock} className="mr-1" /> Duração de cada jogo (min)</label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
            {[10, 15, 20, 30, 45].map(t => (
              <button key={t} type="button" onClick={() => set({ duration: t })}
                style={{
                  flex: '0 0 auto', padding: '4px 10px', fontSize: 9, fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                  background: cfg.duration === t ? `${neon}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${cfg.duration === t ? neon + '44' : 'rgba(255,255,255,0.1)'}`,
                  color: cfg.duration === t ? neon : 'rgba(255,255,255,0.4)',
                }}>
                {t}min
              </button>
            ))}
          </div>
          <input type="number" className={inputCls} value={cfg.duration} min={1}
            onChange={e => set({ duration: +e.target.value })} />
        </div>

        <div>
          <label className={labelCls}>Limite Gols (0=sem limite)</label>
          <input type="number" className={inputCls} value={cfg.goalLimit} min={0}
            onChange={e => set({ goalLimit: +e.target.value })} />
        </div>

        <div>
          <label className={labelCls}>Acréscimos (min)</label>
          <input type="number" className={inputCls} value={cfg.stoppage} min={0}
            onChange={e => set({ stoppage: +e.target.value })} />
        </div>

      </div>

      {/* Uniformes dos times */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ShirtPicker
          label="Time A — Nome &amp; Colete" teamName={cfg.home_team_name} color={cfg.home_color}
          onNameChange={v => set({ home_team_name: v })} onColorChange={v => set({ home_color: v })}
          namePlaceholder="TIME A..." exclude={cfg.away_color}
        />
        <ShirtPicker
          label="Time B — Nome &amp; Colete" teamName={cfg.away_team_name} color={cfg.away_color}
          onNameChange={v => set({ away_team_name: v })} onColorChange={v => set({ away_color: v })}
          namePlaceholder="VISITANTE..." exclude={cfg.home_color}
        />
      </div>

      <div>
        <label className={labelCls}><FontAwesomeIcon icon={faMapPin} className="mr-1" /> Local / Quadra</label>
        <input type="text" className={inputCls} value={cfg.location}
          placeholder="EX: ARENA NACIONAL..." onChange={e => set({ location: e.target.value })} />
      </div>

      {/* Regra de Rotação */}
      {mode === 'rachao' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className={labelCls}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1" /> Regra de Rotação</label>
            <select className={selectCls} value={cfg.rotation_rule}
              onChange={e => set({ rotation_rule: e.target.value as RotationRule })}>
              <option value="winner_stays"  className="bg-slate-900">Ganhador Fica (sempre)</option>
              <option value="two_and_out"   className="bg-slate-900">Jogou 2 Sai</option>
              <option value="goal_diff"     className="bg-slate-900">Diferença de Gols</option>
            </select>
          </div>
          {cfg.rotation_rule === 'goal_diff' && (
            <div>
              <label className={labelCls}>Diferença Mín. p/ Ficar</label>
              <input type="number" className={inputCls} value={cfg.rotation_goal_diff} min={1} max={10}
                onChange={e => set({ rotation_goal_diff: +e.target.value })} />
            </div>
          )}
        </div>
      )}

      {/* Botão sticky — sempre visível no rodapé mesmo em telas pequenas */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'linear-gradient(to top, rgba(3,9,18,0.98) 70%, transparent)',
        padding: '12px 0 4px', marginTop: 4,
      }}>
        <button
          onClick={onSubmit}
          style={{
            width: '100%', padding: '16px 0', fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
            letterSpacing: '0.25em', border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${accent},${mode === 'rachao' ? '#aadd00' : '#0090cc'})`,
            color: '#000',
            boxShadow: `0 0 30px ${accent}44`,
            borderRadius: 4,
          }}
        >
          <FontAwesomeIcon icon={mode === 'rachao' ? faShuffle : faUsers} style={{ marginRight: 10 }} />
          {mode === 'rachao' ? 'CRIAR E IR PARA CHAMADA' : 'CRIAR E ESCALAR TIMES'}
        </button>
      </div>
    </div>
  );
};
