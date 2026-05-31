import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faShuffle, faUsers, faClock, faMapPin } from '@fortawesome/free-solid-svg-icons';
import { SportType, GameMode } from '@/core/entities/match';
import { CreateMatchConfig } from './types';

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

// Mapa sport_type → playersPerTeam padrão
const SPORT_DEFAULTS: Record<string, number> = {
  Futsal: 5,
  Society: 7,
  Campo: 11,
};

export const RachaoForm: React.FC<Props> = ({ cfg, set, onSubmit, mode = 'rachao' }) => {
  const accent = mode === 'rachao' ? neon : blue;

  const handleSportChange = (sport: SportType) => {
    set({ sport_type: sport, playersPerTeam: SPORT_DEFAULTS[sport] ?? 7 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        <div>
          <label className={labelCls}><FontAwesomeIcon icon={faFutbol} className="mr-1" /> Esporte</label>
          <select className={selectCls} value={cfg.sport_type}
            onChange={e => handleSportChange(e.target.value as SportType)}>
            <option value="Society" className="bg-slate-900">Society (7x7)</option>
            <option value="Futsal"  className="bg-slate-900">Futsal (5x5)</option>
            <option value="Campo"   className="bg-slate-900">Campo (11x11)</option>
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

        <div>
          <label className={labelCls}><FontAwesomeIcon icon={faClock} className="mr-1" /> Duração (min)</label>
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
