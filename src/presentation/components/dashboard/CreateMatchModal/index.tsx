'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShuffle, faUsers, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { RachaoForm } from './RachaoForm';
import { CreateMatchConfig, Step, STEP_LABELS, DEFAULT_CFG } from './types';

export type { CreateMatchConfig };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatch: (cfg: CreateMatchConfig) => void;
  // kept for backwards compat – not used in current UI
  onCreateDesafio?: (cfg: CreateMatchConfig) => Promise<string>;
}

const neon = '#ccff00';
const blue = '#00b4ff';

export function CreateMatchModal({ isOpen, onClose, onCreateMatch }: Props) {
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
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md">
      <div style={{
        background: 'linear-gradient(160deg,#050e1f 0%,#020810 100%)',
        border: `1px solid ${blue}22`,
        boxShadow: `0 0 60px ${blue}11, 0 24px 80px rgba(0,0,0,0.8)`,
        width: '100%', maxWidth: 560, maxHeight: '94vh', overflowY: 'auto',
        borderTopLeftRadius: 2, borderTopRightRadius: 2,
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

          {/* Escolha do modo — centralizado */}
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
              <p style={{ textAlign: 'center', fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                Escolha o formato
              </p>
              {[
                {
                  mode: 'rachao' as const,
                  icon: faShuffle,
                  accent: neon,
                  title: 'Rachão / Pelada',
                  emoji: '⚡',
                  desc: 'Sorteio inteligente por habilidade, posição e idade.',
                  tags: ['Sorteio', 'Chamada', 'Placar'],
                },
                {
                  mode: 'manual' as const,
                  icon: faUsers,
                  accent: blue,
                  title: 'Time Contra Time',
                  emoji: '🏆',
                  desc: 'Você escala cada jogador. Sem sorteio automático.',
                  tags: ['Manual', 'Titulares', 'Reservas'],
                },
              ].map(({ mode, icon, accent, title, emoji, desc, tags }) => (
                <button key={mode}
                  onClick={() => { set({ match_type: mode }); setStep(mode); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    padding: '24px 20px', textAlign: 'center',
                    background: `linear-gradient(135deg,${accent}0c,transparent)`,
                    border: `1px solid ${accent}35`, cursor: 'pointer', transition: 'all .2s', borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}80`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${accent}35`)}
                >
                  <div style={{
                    width: 64, height: 64, background: `${accent}18`,
                    border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 28, color: accent, borderRadius: 16,
                  }}>
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase',
                      letterSpacing: '-0.01em', marginBottom: 6 }}>
                      {emoji} {title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>{desc}</div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 8, fontWeight: 900, padding: '3px 8px',
                          background: `${accent}12`, border: `1px solid ${accent}25`,
                          color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 4,
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Formulário de configuração (mesmo para rachão e manual) */}
          {(step === 'rachao' || step === 'manual') && (
            <RachaoForm
              cfg={cfg}
              set={set}
              onSubmit={handleSubmit}
              mode={step}
            />
          )}
        </div>
      </div>
    </div>
  );
}
