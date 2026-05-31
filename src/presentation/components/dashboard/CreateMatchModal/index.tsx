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

          {/* Escolha do modo */}
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  mode: 'rachao' as const,
                  icon: faShuffle,
                  accent: neon,
                  title: '⚡ Rachão / Pelada',
                  desc: 'Sorteio inteligente de times equilibrados com base em habilidade, idade e posição.',
                  tags: ['Sorteio Automático', 'Chamada', 'Placar ao vivo'],
                },
                {
                  mode: 'manual' as const,
                  icon: faUsers,
                  accent: blue,
                  title: '🏆 Time Contra Time',
                  desc: 'Você escala os titulares e reservas de cada time. Sem sorteio automático.',
                  tags: ['Escalação Manual', 'Titulares', 'Reservas'],
                },
              ].map(({ mode, icon, accent, title, desc, tags }) => (
                <button key={mode}
                  onClick={() => {
                    set({ match_type: mode });
                    setStep(mode);
                  }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 20, padding: '22px 20px',
                    background: `linear-gradient(135deg,${accent}0a,transparent)`,
                    border: `1px solid ${accent}30`, cursor: 'pointer', textAlign: 'left', transition: 'all .2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}80`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${accent}30`)}
                >
                  <div style={{
                    width: 52, height: 52, flexShrink: 0, background: `${accent}18`,
                    border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, color: accent,
                  }}>
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      {tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 7, fontWeight: 900, padding: '2px 6px',
                          background: `${accent}12`, border: `1px solid ${accent}25`,
                          color: accent, textTransform: 'uppercase', letterSpacing: '0.1em',
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
