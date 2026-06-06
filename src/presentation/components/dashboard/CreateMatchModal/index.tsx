'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShuffle, faUsers, faChevronLeft, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { RachaoForm } from './RachaoForm';
import { CreateMatchConfig, Step, STEP_LABELS, DEFAULT_CFG } from './types';

export type { CreateMatchConfig };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatch: (cfg: CreateMatchConfig) => void;
  groupId?: string;
  // kept for backwards compat – not used in current UI
  onCreateDesafio?: (cfg: CreateMatchConfig) => Promise<string>;
}

const neon = '#ccff00';
const blue = '#00b4ff';

export function CreateMatchModal({ isOpen, onClose, onCreateMatch, groupId }: Props) {
  const [step, setStep] = useState<Step>('choose');
  const [cfg, setCfg] = useState<CreateMatchConfig>(DEFAULT_CFG);

  const set = (patch: Partial<CreateMatchConfig>) => setCfg(prev => ({ ...prev, ...patch }));

  if (!isOpen) return null;

  const handleClose = () => { setStep('choose'); onClose(); };

  const handleSubmit = () => {
    onCreateMatch({ ...cfg, match_type: step === 'manual' ? 'manual' : 'rachao' });
    handleClose();
  };

  const labels = STEP_LABELS[step];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      /* paddingBottom: 76px = 64px nav + 12px margem — garante que o modal não vai atrás do nav */
      padding: '16px 16px 76px 16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div style={{
        background: 'linear-gradient(160deg,#050e1f 0%,#020810 100%)',
        border: `1px solid ${blue}22`,
        boxShadow: `0 0 60px ${blue}11, 0 24px 80px rgba(0,0,0,0.8)`,
        width: '100%', maxWidth: 520,
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        borderRadius: 16,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: `1px solid ${blue}18`,
          background: 'linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,12,30,0.9),rgba(0,0,0,0.9))',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step !== 'choose' && (
              <button onClick={() => setStep('choose')}
                style={{ color: `${blue}88`, marginRight: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}
            <div>
              <div style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: blue, lineHeight: 1.2 }}>
                {labels.sub}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {labels.title}
              </div>
            </div>
          </div>
          <button onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Escolha do modo — 3 opções em lista compacta */}
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { mode: 'rachao'  as const, icon: faShuffle, accent: neon,      emoji: '⚡',
                  title: 'Rachão / Pelada',   desc: 'Sorteio automático por habilidade e posição.',
                  tags: ['Sorteio', 'Chamada', 'Placar ao vivo'] },
                { mode: 'manual'  as const, icon: faUsers,   accent: blue,      emoji: '🛡️',
                  title: 'Time vs Time',       desc: 'Escale cada jogador manualmente nos dois times.',
                  tags: ['Manual', 'Titulares', 'Reservas'] },
                { mode: 'desafio' as const, icon: faTrophy,  accent: '#d4a017', emoji: '⚔️',
                  title: 'Desafio de Clube',   desc: 'Gere um link e convide outro clube para jogar.',
                  tags: ['Link de convite', 'Clube adversário'] },
              ].map(({ mode, icon, accent, emoji, title, desc, tags }) => (
                <button key={mode}
                  onClick={() => { set({ match_type: mode === 'desafio' ? 'rachao' : mode }); setStep(mode); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                    background: `${accent}08`,
                    border: `1px solid ${accent}30`, borderRadius: 12,
                    transition: 'all .15s', width: '100%',
                  }}>
                  {/* Ícone */}
                  <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 12,
                    background: `${accent}18`, border: `1px solid ${accent}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: accent }}>
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 900, color: '#fff',
                      textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 2 }}>
                      {emoji} {title}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4, marginBottom: 6 }}>
                      {desc}
                    </p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {tags.map(t => (
                        <span key={t} style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px',
                          background: `${accent}12`, border: `1px solid ${accent}22`,
                          color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 3 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Seta */}
                  <span style={{ color: `${accent}60`, fontSize: 16, flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* Formulário de configuração */}
          {(step === 'rachao' || step === 'manual' || step === 'desafio') && (
            <RachaoForm
              cfg={cfg}
              set={set}
              onSubmit={handleSubmit}
              mode={step === 'manual' ? 'manual' : 'rachao'}
              groupId={groupId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
