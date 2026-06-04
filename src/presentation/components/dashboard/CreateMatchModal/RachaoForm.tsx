import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faShuffle, faUsers, faClock, faMapPin, faArrowsRotate, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
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

        <div>
          <label className={labelCls}>Nome Time A</label>
          <input type="text" className={inputCls} value={cfg.home_team_name}
            placeholder="TIME A..." onChange={e => set({ home_team_name: e.target.value })} />
        </div>

        <div>
          <label className={labelCls}>Nome Time B</label>
          <input type="text" className={inputCls} value={cfg.away_team_name}
            placeholder="TIME B..." onChange={e => set({ away_team_name: e.target.value })} />
        </div>

        <div>
          <label className={labelCls}>Cor Time A</label>
          <input type="text" className={inputCls} value={cfg.home_color}
            placeholder="BRANCO..." onChange={e => set({ home_color: e.target.value })} />
        </div>

        <div>
          <label className={labelCls}>Cor Time B</label>
          <input type="text" className={inputCls} value={cfg.away_color}
            placeholder="PRETO..." onChange={e => set({ away_color: e.target.value })} />
        </div>
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

      <button
        onClick={onSubmit}
        style={{
          padding: '14px 0', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
          letterSpacing: '0.3em', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${accent},${mode === 'rachao' ? '#aadd00' : '#0090cc'})`,
          color: '#000',
          boxShadow: `0 0 30px ${accent}33`,
        }}
      >
        <FontAwesomeIcon icon={mode === 'rachao' ? faShuffle : faUsers} style={{ marginRight: 8 }} />
        {mode === 'rachao' ? 'CRIAR E IR PARA CHAMADA' : 'CRIAR E ESCALAR TIMES'}
      </button>
    </div>
  );
};
