'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faUserPlus, faUserMinus, faWarning, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Player } from '@/core/entities/player';

interface NextTeamModalProps {
  /** Time que sai (perdedor ou que jogou 2x) */
  outgoingTeamName: string;
  /** Time que vai entrar (da fila) */
  incomingTeam: Player[];
  /** Time vencedor (permanece) */
  winnerTeam: Player[];
  winnerTeamName: string;
  /** Jogadores disponíveis não escalados */
  availablePlayers: Player[];
  playersPerTeam: number;
  onConfirm: (incomingTeam: Player[]) => void;
  onCancel: () => void;
}

export const NextTeamModal: React.FC<NextTeamModalProps> = ({
  outgoingTeamName,
  incomingTeam: initialIncoming,
  winnerTeam,
  winnerTeamName,
  availablePlayers,
  playersPerTeam,
  onConfirm,
  onCancel,
}) => {
  const [team, setTeam] = useState<Player[]>(initialIncoming);

  const add = (p: Player) => {
    if (team.find(t => t.id === p.id)) return;
    setTeam(prev => [...prev, p]);
  };

  const remove = (id: string) => setTeam(prev => prev.filter(p => p.id !== id));

  const missing = playersPerTeam - team.length;
  const tooFew  = missing > 0;

  // Jogadores que ainda não estão no time e não estão no time vencedor
  const winnerIds   = new Set(winnerTeam.map(p => p.id));
  const teamIds     = new Set(team.map(p => p.id));
  const pool        = availablePlayers.filter(p => !winnerIds.has(p.id) && !teamIds.has(p.id));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 520, maxHeight: '90dvh', overflowY: 'auto',
        background: 'linear-gradient(160deg,#050e1f,#020810)',
        border: '1px solid rgba(0,180,255,0.15)', borderRadius: 12,
        boxShadow: '0 0 60px rgba(0,180,255,0.08)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#00b4ff', marginBottom: 3 }}>
            PRÓXIMA RODADA
          </p>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
            Confirmar Time Entrante
          </h2>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 700 }}>
            <span style={{ color: '#ccff00' }}>{winnerTeamName}</span> permanece em campo · <span style={{ color: '#EF4444' }}>{outgoingTeamName}</span> sai
          </p>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Aviso de jogadores insuficientes */}
          {tooFew && (
            <div style={{
              padding: '10px 14px', background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <FontAwesomeIcon icon={faWarning} style={{ color: '#F97316', fontSize: 14, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 9, fontWeight: 900, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {missing === 1 ? 'Falta 1 jogador' : `Faltam ${missing} jogadores`} para completar o time
                </p>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 700 }}>
                  Adicione jogadores abaixo ou confirme assim mesmo para jogar com {team.length} vs {playersPerTeam}.
                </p>
              </div>
            </div>
          )}

          {/* Time entrante atual */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: 5 }} />
                Time Entrante ({team.length}/{playersPerTeam})
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {team.length === 0 ? (
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', padding: '8px 0', fontWeight: 700, textAlign: 'center' }}>
                  Nenhum jogador selecionado
                </p>
              ) : team.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  background: 'rgba(0,180,255,0.05)', border: '1px solid rgba(0,180,255,0.12)',
                  borderRadius: 6,
                }}>
                  <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                    {p.positions?.[0] ?? '—'} · Nv {p.skill_level ?? Math.round((p.rating ?? 3) * 2)}
                  </span>
                  <button onClick={() => remove(p.id)} style={{
                    padding: '2px 6px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.5)',
                    borderRadius: 4, cursor: 'pointer',
                  }}>
                    <FontAwesomeIcon icon={faUserMinus} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pool de jogadores disponíveis */}
          {pool.length > 0 && (
            <div>
              <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                Disponíveis para adicionar ({pool.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 180, overflowY: 'auto' }}>
                {pool.map(p => (
                  <button key={p.id} onClick={() => add(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(204,255,0,0.2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                    <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 9, color: '#ccff00', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                      {p.positions?.[0] ?? '—'} · Nv {p.skill_level ?? Math.round((p.rating ?? 3) * 2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {pool.length === 0 && team.length < playersPerTeam && (
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textAlign: 'center' }}>
              Não há mais jogadores disponíveis para adicionar.
            </p>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onCancel} style={{
              flex: 1, padding: '11px 0', fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.2em', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer',
            }}>
              CANCELAR
            </button>
            <button onClick={() => onConfirm(team)} style={{
              flex: 2, padding: '11px 0', fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.2em', border: 'none', cursor: 'pointer', borderRadius: 8,
              background: team.length > 0
                ? 'linear-gradient(135deg,#ccff00,#aadd00)'
                : 'rgba(255,255,255,0.05)',
              color: team.length > 0 ? '#000' : 'rgba(255,255,255,0.2)',
              boxShadow: team.length > 0 ? '0 0 20px rgba(204,255,0,0.2)' : 'none',
              transition: 'all .2s',
            }} disabled={team.length === 0}>
              <FontAwesomeIcon icon={faPlay} style={{ marginRight: 8 }} />
              {tooFew ? `JOGAR COM ${team.length} JOGADORES` : 'CONFIRMAR E INICIAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
