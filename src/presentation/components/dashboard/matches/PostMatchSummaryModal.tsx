'use client';

import React, { useState, useMemo } from 'react';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol, faMagicWandSparkles, faShield, faHandFist,
  faStar, faXmark, faFloppyDisk, faForward,
} from '@fortawesome/free-solid-svg-icons';
import { MatchStatsRepository, PlayerStatEntry } from '@/infra/repositories/MatchStatsRepository';

interface Props {
  matchId: string;
  groupId: string;
  players: Player[];                       // todos que participaram
  events: any[];                           // eventos da partida (para pré-preencher gols/assists)
  teamOf: (playerId: string) => string;    // 'home' | 'away' | 'waiting'
  onSave: () => void;                      // chamado após salvar → encerra a sessão
  onSkip: () => void;                      // pular sem salvar → encerra a sessão
}

const green  = '#22c55e';
const neon   = '#ccff00';
const blue   = '#00b4ff';
const gold   = '#d4a017';
const purple = '#8b5cf6';
const red    = '#ef4444';

const POS_COLOR: Record<string, string> = {
  G: '#EAB308', ZAG: green, ZGD: green, ZGE: green, LD: green, LE: green,
  VOL: blue, MC: blue, MD: blue, ME: blue, MO: purple,
  PD: '#F97316', PE: '#F97316', SA: neon, CA: red,
};

function StatCounter({ icon, color, label, value, onChange }: {
  icon: any; color: string; label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: 9, color }} />
        <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${color}bb` }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          −
        </button>
        <span style={{ width: 22, textAlign: 'center', fontSize: 14, fontWeight: 900, color: value > 0 ? color : 'rgba(255,255,255,0.2)' }}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          style={{ width: 22, height: 22, background: `${color}18`, border: `1px solid ${color}40`,
            color, fontSize: 15, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          +
        </button>
      </div>
    </div>
  );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: n <= value ? gold : 'rgba(255,255,255,0.08)',
            fontSize: 7, fontWeight: 900, color: n <= value ? '#000' : 'rgba(255,255,255,0.2)',
            transition: 'all .15s' }}>
          {n}
        </button>
      ))}
    </div>
  );
}

export function PostMatchSummaryModal({ matchId, groupId, players, events, teamOf, onSave, onSkip }: Props) {
  const statsRepo = new MatchStatsRepository();

  // Pré-preenche gols e assistências a partir dos eventos
  const initial = useMemo(() => {
    const map: Record<string, PlayerStatEntry> = {};
    players.forEach(p => {
      map[p.id] = { player_id: p.id, team: teamOf(p.id), goals: 0, assists: 0, tackles: 0, saves: 0, rating: undefined };
    });
    events.forEach(e => {
      if (!map[e.player_id]) return;
      if (e.type === 'Gol')        map[e.player_id].goals++;
      if (e.type === 'Assistência') map[e.player_id].assists++;
    });
    return map;
  }, [players, events]);

  const [stats, setStats] = useState<Record<string, PlayerStatEntry>>(initial);
  const [saving, setSaving] = useState(false);

  const update = (playerId: string, field: keyof PlayerStatEntry, value: number) => {
    setStats(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.values(stats);
      await statsRepo.saveAll(matchId, groupId, entries);
      onSave();
    } catch (err: any) {
      alert('Erro ao salvar resumo: ' + (err?.message ?? ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* Header fixo */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#020810',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: neon, marginBottom: 2 }}>
            SESSÃO ENCERRADA
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: '#fff', letterSpacing: '-0.02em' }}>
            Resumo Pós-Jogo
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onSkip}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faForward} /> Pular
          </button>
        </div>
      </div>

      {/* Lista de jogadores — scrollável */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {players.map(p => {
          const s = stats[p.id] ?? { goals: 0, assists: 0, tackles: 0, saves: 0 };
          const pos = (p.posicao_principal ?? p.positions?.[0] ?? 'SA').toUpperCase();
          const posColor = POS_COLOR[pos] ?? blue;
          const team = teamOf(p.id);

          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: team === 'home' ? 'rgba(0,180,255,0.04)' : team === 'away' ? 'rgba(204,255,0,0.04)' : 'transparent',
            }}>
              {/* Avatar + nome */}
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${posColor}55`, background: '#0a1628', overflow: 'hidden' }}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900, color: posColor }}>{p.name[0]}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 8, fontWeight: 700, color: posColor, margin: 0 }}>{pos}</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <StatCounter icon={faFutbol}           color={neon}   label="Gol"   value={s.goals}   onChange={v => update(p.id, 'goals',   v)} />
                <StatCounter icon={faMagicWandSparkles} color={blue}  label="Ass."  value={s.assists}  onChange={v => update(p.id, 'assists',  v)} />
                <StatCounter icon={faHandFist}          color={green}  label="Des."  value={s.tackles}  onChange={v => update(p.id, 'tackles',  v)} />
                <StatCounter icon={faShield}            color={purple} label="Def."  value={s.saves}    onChange={v => update(p.id, 'saves',    v)} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: `${gold}bb` }}>Nota</span>
                  <RatingPicker value={s.rating ?? 0} onChange={v => update(p.id, 'rating', v)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer fixo com botão salvar */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#020810',
        flexShrink: 0,
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '16px', fontWeight: 900, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.3em', border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            background: `linear-gradient(135deg,${neon},#aadd00)`,
            color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? 'SALVANDO...' : 'SALVAR RESUMO E ENCERRAR'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 8, color: 'rgba(255,255,255,0.15)',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Os dados ficam salvos no histórico de cada atleta
        </p>
      </div>
    </div>
  );
}
