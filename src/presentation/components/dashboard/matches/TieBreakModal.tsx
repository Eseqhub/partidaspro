'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHand, faDice, faFutbol, faChevronLeft, faTrophy, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Props {
  homeTeamName: string;
  awayTeamName: string;
  onResolve: (winner: 'home' | 'away') => void;
  onClose: () => void;
}

type Method = null | 'manual' | 'penalti' | 'parimpar';

const NEON = '#ccff00';
const BLUE = '#00b4ff';

export const TieBreakModal: React.FC<Props> = ({ homeTeamName, awayTeamName, onResolve, onClose }) => {
  const [method, setMethod] = useState<Method>(null);
  const [kicks, setKicks] = useState<1 | 3 | null>(null);

  // Par/Ímpar
  const [homeChoice, setHomeChoice] = useState<'par' | 'impar' | null>(null);
  const [drawn, setDrawn] = useState<{ a: number; b: number; sum: number; winner: 'home' | 'away' } | null>(null);

  const runParImpar = () => {
    if (!homeChoice) return;
    const a = Math.floor(Math.random() * 6); // 0-5 dedos
    const b = Math.floor(Math.random() * 6);
    const sum = a + b;
    const isEven = sum % 2 === 0;
    const homeWins = (homeChoice === 'par' && isEven) || (homeChoice === 'impar' && !isEven);
    setDrawn({ a, b, sum, winner: homeWins ? 'home' : 'away' });
  };

  const card = (icon: any, title: string, desc: string, onClick: () => void, color: string) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', width: '100%', textAlign: 'left',
      background: `${color}0a`, border: `1px solid ${color}30`, borderRadius: 10, cursor: 'pointer',
    }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: 18 }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>{title}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</p>
      </div>
    </button>
  );

  const teamBtn = (side: 'home' | 'away', label: string) => (
    <button onClick={() => onResolve(side)} style={{
      flex: 1, padding: '16px 0', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
      border: 'none', borderRadius: 10, cursor: 'pointer',
      background: side === 'home' ? `linear-gradient(135deg,${NEON},#aadd00)` : `linear-gradient(135deg,${BLUE},#0088cc)`,
      color: side === 'home' ? '#000' : '#fff',
    }}>
      <FontAwesomeIcon icon={faTrophy} style={{ marginRight: 8 }} />
      {label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'linear-gradient(160deg,#0a1428,#020810)',
        border: `1px solid ${NEON}20`, borderRadius: 14, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {method && <button onClick={() => { setMethod(null); setKicks(null); setDrawn(null); setHomeChoice(null); }} style={{ background: 'none', border: 'none', color: `${BLUE}99`, cursor: 'pointer' }}><FontAwesomeIcon icon={faChevronLeft} /></button>}
            <div>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#F97316' }}>Empate</p>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Critério de Desempate</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}><FontAwesomeIcon icon={faTimes} /></button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Times */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: NEON, textTransform: 'uppercase' }}>{homeTeamName}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>X</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: BLUE, textTransform: 'uppercase' }}>{awayTeamName}</span>
          </div>

          {/* Escolha do método */}
          {!method && (
            <>
              {card(faHand, 'Escolher manualmente', 'Você decide qual time permanece em campo.', () => setMethod('manual'), '#fff')}
              {card(faFutbol, 'Disputa de Pênaltis', 'Defina 1 ou 3 cobranças e registre o vencedor.', () => setMethod('penalti'), NEON)}
              {card(faDice, 'Par ou Ímpar', 'O app sorteia. Escolha par/ímpar para um dos times.', () => setMethod('parimpar'), BLUE)}
            </>
          )}

          {/* Manual */}
          {method === 'manual' && (
            <>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Qual time permanece?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {teamBtn('home', homeTeamName)}
                {teamBtn('away', awayTeamName)}
              </div>
            </>
          )}

          {/* Pênalti */}
          {method === 'penalti' && (
            <>
              {!kicks ? (
                <>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quantas cobranças?</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[1, 3].map(k => (
                      <button key={k} onClick={() => setKicks(k as 1 | 3)} style={{
                        flex: 1, padding: '20px 0', fontWeight: 900, fontSize: 22, border: `1px solid ${NEON}40`,
                        background: `${NEON}10`, color: NEON, borderRadius: 10, cursor: 'pointer' }}>
                        {k}<span style={{ fontSize: 9, display: 'block', color: 'rgba(255,255,255,0.4)' }}>{k === 1 ? 'COBRANÇA' : 'COBRANÇAS'}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {kicks} cobrança{kicks > 1 ? 's' : ''} · registre quem venceu
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {teamBtn('home', homeTeamName)}
                    {teamBtn('away', awayTeamName)}
                  </div>
                </>
              )}
            </>
          )}

          {/* Par ou Ímpar */}
          {method === 'parimpar' && (
            <>
              {!drawn ? (
                <>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {homeTeamName} fica com:
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['par', 'impar'] as const).map(c => (
                      <button key={c} onClick={() => setHomeChoice(c)} style={{
                        flex: 1, padding: '14px 0', fontWeight: 900, fontSize: 13, textTransform: 'uppercase',
                        border: `1px solid ${homeChoice === c ? NEON : 'rgba(255,255,255,0.15)'}`,
                        background: homeChoice === c ? `${NEON}18` : 'rgba(255,255,255,0.03)',
                        color: homeChoice === c ? NEON : 'rgba(255,255,255,0.5)', borderRadius: 10, cursor: 'pointer' }}>
                        {c === 'par' ? 'PAR' : 'ÍMPAR'}
                      </button>
                    ))}
                  </div>
                  {homeChoice && (
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                      {awayTeamName} fica com <strong style={{ color: BLUE }}>{homeChoice === 'par' ? 'ÍMPAR' : 'PAR'}</strong>
                    </p>
                  )}
                  <button onClick={runParImpar} disabled={!homeChoice} style={{
                    padding: '14px 0', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em',
                    border: 'none', borderRadius: 10, cursor: homeChoice ? 'pointer' : 'not-allowed',
                    background: homeChoice ? `linear-gradient(135deg,${BLUE},#0088cc)` : 'rgba(255,255,255,0.05)',
                    color: homeChoice ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                    <FontAwesomeIcon icon={faDice} style={{ marginRight: 8 }} /> Sortear
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '8px 0 14px' }}>
                    {[drawn.a, drawn.b].map((n, i) => (
                      <div key={i} style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff' }}>{n}</div>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                    Soma = <strong style={{ color: '#fff' }}>{drawn.sum}</strong> · {drawn.sum % 2 === 0 ? 'PAR' : 'ÍMPAR'}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', marginBottom: 14 }}>
                    🏆 {drawn.winner === 'home' ? homeTeamName : awayTeamName} venceu!
                  </p>
                  <button onClick={() => onResolve(drawn.winner)} style={{
                    width: '100%', padding: '14px 0', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em',
                    border: 'none', borderRadius: 10, cursor: 'pointer', background: `linear-gradient(135deg,${NEON},#aadd00)`, color: '#000' }}>
                    Confirmar — Vencedor Permanece
                  </button>
                  <button onClick={() => { setDrawn(null); setHomeChoice(null); }} style={{
                    width: '100%', marginTop: 8, padding: '8px 0', background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
                    Sortear de novo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
