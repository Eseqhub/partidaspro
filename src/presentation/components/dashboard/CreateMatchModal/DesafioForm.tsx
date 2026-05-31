import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faClock, faMapPin, faLink } from '@fortawesome/free-solid-svg-icons';
import { SportType } from '@/core/entities/match';
import { CreateMatchConfig } from './types';

interface Props {
  cfg: CreateMatchConfig;
  set: (patch: Partial<CreateMatchConfig>) => void;
  onSubmit: () => void;
  loading: boolean;
}

const inputCls = `w-full bg-black/40 border border-white/10 p-3 text-white text-xs font-bold uppercase tracking-wider outline-none transition-colors placeholder:text-white/20`;
const labelCls = 'block text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1.5';
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const gold = '#d4a017';

export const DesafioForm: React.FC<Props> = ({ cfg, set, onSubmit, loading }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

      <div>
        <label className={labelCls}><FontAwesomeIcon icon={faFutbol} className="mr-1" /> Esporte</label>
        <select className={selectCls} value={cfg.sport_type} onChange={e => set({ sport_type: e.target.value as SportType })}>
          <option value="Society" className="bg-slate-900">Society (7x7)</option>
          <option value="Futsal" className="bg-slate-900">Futsal (5x5)</option>
          <option value="Campo" className="bg-slate-900">Campo (11x11)</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Atletas por Time</label>
        <input type="number" className={inputCls} value={cfg.playersPerTeam} min={2} max={11}
          onChange={e => set({ playersPerTeam: +e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Nome do SEU Time</label>
        <input type="text" className={inputCls} value={cfg.home_team_name}
          placeholder="EX: GAROTOS DO ZEQUI..." onChange={e => set({ home_team_name: e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Time Adversário (opcional)</label>
        <input type="text" className={inputCls} value={cfg.away_team_name}
          placeholder="SERA DEFINIDO POR ELES..." onChange={e => set({ away_team_name: e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Data do Jogo</label>
        <input type="date" className={inputCls} value={cfg.date}
          style={{ colorScheme: 'dark' }} onChange={e => set({ date: e.target.value })} />
      </div>

      <div>
        <label className={labelCls}><FontAwesomeIcon icon={faClock} className="mr-1" /> Horário</label>
        <input type="time" className={inputCls} value={cfg.sessionStartTime}
          style={{ colorScheme: 'dark' }} onChange={e => set({ sessionStartTime: e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Duração (min)</label>
        <input type="number" className={inputCls} value={cfg.duration} min={1}
          onChange={e => set({ duration: +e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Cor do Seu Time</label>
        <input type="text" className={inputCls} value={cfg.home_color}
          placeholder="BRANCO..." onChange={e => set({ home_color: e.target.value })} />
      </div>
    </div>

    <div>
      <label className={labelCls}><FontAwesomeIcon icon={faMapPin} className="mr-1" /> Local / Quadra</label>
      <input type="text" className={inputCls} value={cfg.location}
        placeholder="EX: ARENA NACIONAL..." onChange={e => set({ location: e.target.value })} />
    </div>

    <div style={{ padding: '12px 16px', background: `${gold}0a`, border: `1px solid ${gold}25`, fontSize: 10, color: `${gold}cc`, lineHeight: 1.6 }}>
      <strong>Como funciona:</strong> Após criar, você receberá um link exclusivo. O time adversário abre o link,
      vê os detalhes do jogo e confirma a presença. Quando aceitarem, você recebe a notificação aqui.
    </div>

    <button
      onClick={onSubmit}
      disabled={loading || !cfg.home_team_name}
      style={{
        padding: '14px 0', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
        letterSpacing: '0.3em', border: 'none', cursor: loading ? 'wait' : 'pointer',
        background: loading || !cfg.home_team_name ? 'rgba(100,80,0,0.4)' : `linear-gradient(135deg,${gold},#f5d060)`,
        color: '#000', opacity: !cfg.home_team_name ? 0.5 : 1,
        boxShadow: `0 0 30px ${gold}22`,
      }}
    >
      <FontAwesomeIcon icon={faLink} style={{ marginRight: 8 }} />
      {loading ? 'GERANDO LINK...' : 'GERAR LINK DE DESAFIO'}
    </button>
  </div>
);
