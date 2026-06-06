'use client';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFutbol, faHandshake, faSquare, faStar, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { DraftResult } from '@/core/services/DraftService';
import { EventType as CoreEventType } from '@/core/entities/match';

interface Props {
  draftResult: DraftResult;
  homeTeamName: string;
  awayTeamName: string;
  selectedEventType: CoreEventType;
  setSelectedEventType: (type: CoreEventType) => void;
  onAddEvent: (playerId: string, team: 'home' | 'away', type: CoreEventType) => void;
  onClose: () => void;
}

const EVENT_TYPES: { type: CoreEventType; label: string; icon: any; color: string; desc: string }[] = [
  { type: 'Gol',             label: 'Gol',        icon: faFutbol,    color: '#ccff00', desc: 'Bola na rede' },
  { type: 'Assistência',     label: 'Assist.',    icon: faHandshake, color: '#00b4ff', desc: 'Passe do gol' },
  { type: 'Cartão Amarelo',  label: 'Amarelo',    icon: faSquare,    color: '#EAB308', desc: 'Advertência' },
  { type: 'Cartão Vermelho', label: 'Vermelho',   icon: faSquare,    color: '#EF4444', desc: 'Expulsão' },
  { type: 'Craque',          label: 'Craque',     icon: faStar,      color: '#FFD700', desc: 'MVP da partida' },
];

export function EventModal({
  draftResult, homeTeamName, awayTeamName,
  selectedEventType, setSelectedEventType,
  onAddEvent, onClose,
}: Props) {
  // step 1 = escolher evento, step 2 = escolher jogador
  const [step, setStep] = useState<'event' | 'player'>(
    selectedEventType ? 'player' : 'event'
  );

  const currentEvt = EVENT_TYPES.find(e => e.type === selectedEventType) ?? EVENT_TYPES[0];
  const allPlayers = [
    ...draftResult.homeTeam.map(p => ({ ...p, team: 'home' as const })),
    ...draftResult.awayTeam.map(p => ({ ...p, team: 'away' as const })),
  ];

  const handleSelectEvent = (type: CoreEventType) => {
    setSelectedEventType(type);
    setStep('player');
  };

  const handleSelectPlayer = (playerId: string, team: 'home' | 'away') => {
    onAddEvent(playerId, team, selectedEventType);
    // Stay open to allow registering more events
    setStep('event');
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'linear-gradient(160deg,#070f22,#030912)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: '92dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px 12px' }}>
          {step === 'player' && (
            <button onClick={() => setStep('event')}
              style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 14 }} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}>
              {step === 'event' ? 'Qual foi o lance?' : `Lance: ${currentEvt.label} — Qual jogador?`}
            </p>
            {step === 'player' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${currentEvt.color}20`, border: `1px solid ${currentEvt.color}50`,
                }}>
                  <FontAwesomeIcon icon={currentEvt.icon} style={{ fontSize: 10, color: currentEvt.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: currentEvt.color }}>
                  {currentEvt.label}
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>· {currentEvt.desc}</span>
              </div>
            )}
          </div>
          <button onClick={onClose}
            style={{ color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: 12 }} />
          </button>
        </div>

        {/* ── STEP 1: Escolher evento ──────────────────────────────── */}
        {step === 'event' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: '0 16px 20px' }}>
            {EVENT_TYPES.map(e => (
              <button key={e.type} onClick={() => handleSelectEvent(e.type)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 6px 12px', borderRadius: 12, cursor: 'pointer',
                  background: selectedEventType === e.type ? `${e.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${selectedEventType === e.type ? e.color + '60' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.15s',
                }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${e.color}18`,
                }}>
                  <FontAwesomeIcon icon={e.icon} style={{ fontSize: 16, color: e.color }} />
                </div>
                <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: e.color }}>
                  {e.label}
                </span>
                <span style={{ fontSize: 6, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                  {e.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2: Escolher jogador ─────────────────────────────── */}
        {step === 'player' && (
          <div style={{ overflowY: 'auto', padding: '0 16px 20px', flex: 1 }}>
            {/* Time A */}
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
              color: '#ccff0066', marginBottom: 6, marginTop: 2 }}>
              {homeTeamName || 'Time A'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 14 }}>
              {draftResult.homeTeam.map(p => (
                <button key={p.id} onClick={() => handleSelectPlayer(p.id, 'home')}
                  style={{
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.12)',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,255,0,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(204,255,0,0.04)')}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(204,255,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900, color: '#ccff00' }}>
                    {p.name[0]}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Time B */}
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
              color: '#00b4ff66', marginBottom: 6 }}>
              {awayTeamName || 'Time B'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {draftResult.awayTeam.map(p => (
                <button key={p.id} onClick={() => handleSelectPlayer(p.id, 'away')}
                  style={{
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: 'rgba(0,180,255,0.04)', border: '1px solid rgba(0,180,255,0.12)',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,180,255,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,180,255,0.04)')}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,180,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900, color: '#00b4ff' }}>
                    {p.name[0]}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
