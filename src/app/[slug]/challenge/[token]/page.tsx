'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { Match } from '@/core/entities/match';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy, faFutbol, faMapPin, faClock, faCheck, faTimes,
  faShieldHalved, faSpinner,
} from '@fortawesome/free-solid-svg-icons';

const gold = '#d4a017';
const blue = '#00b4ff';
const neon = '#ccff00';

type PageState = 'loading' | 'pending' | 'accepting' | 'accepted' | 'declined' | 'invalid';

const SPORT_LABELS: Record<string, string> = {
  Futsal: '5 × 5 — Futsal',
  Society: '7 × 7 — Society',
  Campo: '11 × 11 — Campo',
};

export default function ChallengePage() {
  const params = useParams();
  const token  = params.token as string;
  const slug   = params.slug  as string;

  const [state, setState]   = useState<PageState>('loading');
  const [match, setMatch]   = useState<Match | null>(null);
  const [teamName, setTeamName] = useState('');
  const [error, setError]   = useState('');

  const matchRepo = new MatchRepository();

  useEffect(() => {
    async function load() {
      const data = await matchRepo.findByToken(token);
      if (!data) { setState('invalid'); return; }
      setMatch(data);
      // Se já foi respondido, mostra o status diretamente
      if (data.challenge_status === 'aceito')   { setState('accepted');  return; }
      if (data.challenge_status === 'recusado') { setState('declined');  return; }
      setState('pending');
    }
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!teamName.trim()) { setError('Informe o nome do seu time para aceitar o desafio.'); return; }
    setState('accepting');
    const updated = await matchRepo.acceptChallenge(token, teamName.trim());
    if (updated) { setMatch(updated); setState('accepted'); }
    else { setState('pending'); setError('Erro ao aceitar. Tente novamente.'); }
  };

  const handleDecline = async () => {
    if (!confirm('Tem certeza que deseja RECUSAR este desafio?')) return;
    await matchRepo.declineChallenge(token);
    setState('declined');
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg,#050e1f 0%,#020810 60%,#040a18 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: 'inherit',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 40% at 50% 0%,${gold}0a 0%,transparent 70%)`,
      }} />

      {/* WATERMARK */}
      <div style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em',
        color: 'rgba(255,255,255,0.12)', whiteSpace: 'nowrap',
      }}>
        ⚽ PELADEIROS PRO · CHALLENGE MODE
      </div>

      <div style={{ maxWidth: 480, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* ── LOADING ────────────────────────────────────────────── */}
        {state === 'loading' && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, marginBottom: 16 }} />
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Carregando desafio...</div>
          </div>
        )}

        {/* ── INVALID ────────────────────────────────────────────── */}
        {state === 'invalid' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
              Link Inválido
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Este link de desafio não existe ou já expirou.
            </div>
          </div>
        )}

        {/* ── PENDING / ACCEPTING ────────────────────────────────── */}
        {(state === 'pending' || state === 'accepting') && match && (
          <div>
            {/* Header do desafio */}
            <div style={{
              textAlign: 'center', marginBottom: 32,
              padding: '24px 20px 20px',
              background: `linear-gradient(160deg,${gold}0e,transparent)`,
              border: `1px solid ${gold}25`,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: `${gold}18`, border: `2px solid ${gold}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: gold,
              }}>
                <FontAwesomeIcon icon={faTrophy} />
              </div>
              <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: gold, marginBottom: 6 }}>
                VOCÊ FOI DESAFIADO!
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {match.home_team_name || 'TIME DESAFIANTE'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                te desafia para uma partida de
              </div>
            </div>

            {/* Detalhes do jogo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
              {[
                { icon: faFutbol,    label: 'Modalidade', value: SPORT_LABELS[match.sport_type || 'Society'] },
                { icon: faClock,     label: 'Duração',    value: `${match.duration_minutes} minutos` },
                { icon: faMapPin,    label: 'Local',      value: match.location || 'A confirmar' },
                { icon: faClock,     label: 'Data',       value: formatDate(match.date) },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${blue}33`,
                }}>
                  <FontAwesomeIcon icon={icon} style={{ color: blue, fontSize: 12, flexShrink: 0, width: 14 }} />
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 1 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Campo: nome do time */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 6 }} />
                Nome do SEU TIME para aceitar
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => { setTeamName(e.target.value); setError(''); }}
                placeholder="EX: OS CRIAS DO BAIRRO..."
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${error ? '#ef4444' : gold + '40'}`,
                  padding: '14px 16px', color: '#fff', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color .2s',
                }}
                onFocus={e => (e.target.style.borderColor = gold)}
                onBlur={e => (e.target.style.borderColor = error ? '#ef4444' : `${gold}40`)}
              />
              {error && (
                <div style={{ fontSize: 10, color: '#ef4444', marginTop: 6, fontWeight: 700 }}>{error}</div>
              )}
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleAccept}
                disabled={state === 'accepting'}
                style={{
                  padding: '16px 0', fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
                  letterSpacing: '0.3em', border: 'none', cursor: 'pointer',
                  background: state === 'accepting' ? `${gold}66` : `linear-gradient(135deg,${gold},#f5d060)`,
                  color: '#000', boxShadow: `0 0 30px ${gold}33`, transition: 'all .2s',
                }}
              >
                {state === 'accepting'
                  ? <><FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 8 }} />ACEITANDO...</>
                  : <><FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />✅ ACEITAR DESAFIO</>
                }
              </button>
              <button
                onClick={handleDecline}
                disabled={state === 'accepting'}
                style={{
                  padding: '12px 0', fontWeight: 900, fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.2em', border: `1px solid rgba(239,68,68,0.3)`,
                  background: 'transparent', color: 'rgba(239,68,68,0.6)', cursor: 'pointer',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ marginRight: 6 }} />
                Recusar Desafio
              </button>
            </div>
          </div>
        )}

        {/* ── ACCEPTED ───────────────────────────────────────────── */}
        {state === 'accepted' && match && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: '#22c55e18', border: '2px solid #22c55e44',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, color: '#22c55e',
            }}>✅</div>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#22c55e', marginBottom: 8 }}>
              DESAFIO ACEITO!
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 12 }}>
              {match.away_group_name || 'Seu Time'} vs {match.home_team_name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 28 }}>
              O organizador foi notificado e a partida está confirmada!<br />
              Apareçam no horário combinado. Boa sorte! ⚽
            </div>
            <div style={{
              padding: '16px 24px', background: `${gold}0e`, border: `1px solid ${gold}30`,
              fontSize: 10, color: gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
            }}>
              📅 {formatDate(match.date)} · {match.location || 'Local a confirmar'}
            </div>
          </div>
        )}

        {/* ── DECLINED ───────────────────────────────────────────── */}
        {state === 'declined' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
              Desafio Recusado
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Tudo bem, talvez numa próxima! O organizador foi notificado.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
