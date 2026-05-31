'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotate, faCalendarCheck, faUserGroup, faChevronRight, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/infra/supabase/client';
import { calcNextDate, fmtDate, toInputDate } from '@/core/services/RecurrenceService';

interface Player { id: string; name: string; positions: string[] }

interface Props {
  match: any;           // partida finalizada com recorrencia
  groupId: string;
  groupSlug: string;
  onReactivated: (newMatchId: string) => void;
}

const neon = '#ccff00';
const blue = '#00b4ff';

export const RecurringSessionCard: React.FC<Props> = ({ match, groupId, groupSlug, onReactivated }) => {
  const [expanded, setExpanded]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [players,  setPlayers]    = useState<Player[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [nextDate, setNextDate]   = useState(() => {
    const d = calcNextDate(match.date, match.recorrencia, match.recorrencia_dia);
    return toInputDate(d);
  });
  const [loaded, setLoaded] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !loaded) {
      // Carrega jogadores da última presença dessa partida (o elenco padrão)
      const { data: presence } = await supabase
        .from('match_presence')
        .select('player_id, player:players(id, name, positions)')
        .eq('match_id', match.id);

      const ps: Player[] = (presence ?? [])
        .map((p: any) => p.player)
        .filter(Boolean);

      setPlayers(ps);
      setSelected(new Set(ps.map((p: Player) => p.id)));
      setLoaded(true);
    }
    setExpanded(e => !e);
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      // Cria nova partida com mesma config
      const { data: newMatch, error } = await supabase
        .from('matches')
        .insert({
          group_id:        groupId,
          date:            nextDate,
          status:          'Agendada',
          field_type:      match.field_type,
          modality:        match.modality,
          match_type:      match.match_type ?? 'rachao',
          home_team_name:  match.home_team_name,
          away_team_name:  match.away_team_name,
          home_color:      match.home_color,
          away_color:      match.away_color,
          goal_limit:      match.goal_limit ?? 0,
          duration_minutes: match.duration_minutes ?? 10,
          stoppage_minutes: match.stoppage_minutes ?? 0,
          home_score:      0,
          away_score:      0,
          timer_seconds:   0,
          match_fee:       0,
          recorrencia:     match.recorrencia,
          recorrencia_dia: match.recorrencia_dia,
        })
        .select('id')
        .single();

      if (error || !newMatch) throw error ?? new Error('Falha ao criar sessão');

      // Adiciona jogadores selecionados na presence
      for (const pid of Array.from(selected)) {
        await supabase.from('match_presence').upsert(
          { match_id: newMatch.id, player_id: pid, status: 'Confirmado', team: null },
          { onConflict: 'match_id,player_id' }
        );
      }

      onReactivated(newMatch.id);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextDateDisplay = fmtDate(new Date(nextDate + 'T12:00:00'));

  return (
    <div style={{
      border: `1px solid ${neon}25`,
      background: `linear-gradient(135deg,${neon}06,transparent)`,
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={handleExpand}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${neon}12`, border: `1px solid ${neon}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faRotate} style={{ color: neon, fontSize: 14 }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: neon, marginBottom: 2 }}>
            Sessão Recorrente · {match.recorrencia ?? 'Semanal'}
          </p>
          <p style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
            {match.home_team_name || 'Rachão'} · {match.field_type ?? ''}
          </p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 2 }}>
            <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 4, color: neon }} />
            Próxima: <strong style={{ color: '#fff' }}>{nextDateDisplay}</strong>
            {match.recorrencia_dia && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · toda {match.recorrencia_dia}</span>}
          </p>
        </div>
        <FontAwesomeIcon icon={faChevronRight}
          style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }} />
      </button>

      {/* Expanded: ajuste de jogadores + data */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${neon}15`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Data da próxima sessão */}
          <div>
            <label style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>
              Data da próxima sessão
            </label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', padding: '8px 12px', fontSize: 11, outline: 'none',
                borderRadius: 6, colorScheme: 'dark', width: '100%' }}
            />
          </div>

          {/* Lista de jogadores */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
                <FontAwesomeIcon icon={faUserGroup} style={{ marginRight: 5 }} />
                Elenco pré-selecionado ({selected.size}/{players.length})
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {players.map(p => {
                const sel = selected.has(p.id);
                return (
                  <button key={p.id} onClick={() => toggle(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                      background: sel ? `${neon}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${sel ? neon + '35' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 5, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    }}>
                    <FontAwesomeIcon icon={sel ? faMinus : faPlus}
                      style={{ fontSize: 7, color: sel ? neon : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                      color: sel ? '#fff' : 'rgba(255,255,255,0.3)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', flexShrink: 0 }}>
                      {p.positions?.[0] ?? '—'}
                    </span>
                  </button>
                );
              })}
              {players.length === 0 && (
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', gridColumn: 'span 2', padding: '8px 0' }}>
                  Nenhum jogador salvo nesta sessão.
                </p>
              )}
            </div>
          </div>

          {/* Botão reativar */}
          <button onClick={handleReactivate} disabled={loading || selected.size === 0}
            style={{
              padding: '12px 0', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.25em', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
              background: selected.size > 0
                ? `linear-gradient(135deg,${neon},#aadd00)`
                : 'rgba(255,255,255,0.05)',
              color: selected.size > 0 ? '#000' : 'rgba(255,255,255,0.2)',
              boxShadow: selected.size > 0 ? `0 0 24px ${neon}30` : 'none',
              transition: 'all .2s',
            }}>
            {loading ? 'Criando...' : `REATIVAR COM ${selected.size} JOGADORES`}
          </button>
        </div>
      )}
    </div>
  );
};
