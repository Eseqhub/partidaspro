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

          {/* Escolha do modo — grid compacto, cabe na tela sem rolar */}
          {step === 'choose' && (
            <div style={{ padding: '4px 0 8px' }}>
              <p style={{ textAlign: 'center', fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>
                Escolha o formato
              </p>
              {/* Rachão — destaque em cima */}
              <button
                onClick={() => { set({ match_type: 'rachao' }); setStep('rachao'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 18px', marginBottom: 10, cursor: 'pointer',
                  background: `linear-gradient(135deg,${neon}0e,transparent)`,
                  border: `1px solid ${neon}35`, borderRadius: 12, textAlign: 'left',
                  transition: 'border-color .15s' }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 14, background: `${neon}18`,
                  border: `1px solid ${neon}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, color: neon }}>
                  <FontAwesomeIcon icon={faShuffle} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase',
                    letterSpacing: '-0.01em', marginBottom: 3 }}>⚡ Rachão / Pelada</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 6 }}>
                    Sorteio inteligente por habilidade, posição e idade.
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {['Sorteio', 'Chamada', 'Placar'].map(t => (
                      <span key={t} style={{ fontSize: 7, fontWeight: 900, padding: '2px 7px',
                        background: `${neon}12`, border: `1px solid ${neon}25`, color: neon,
                        textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 4 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </button>

              {/* Grid 2 colunas: Time vs Time + Desafio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { mode: 'manual' as const, icon: faUsers,   accent: blue,     emoji: '🛡️',
                    title: 'Time vs Time', desc: 'Escale cada jogador manualmente.',
                    tags: ['Manual', 'Titulares'] },
                  { mode: 'desafio' as const, icon: faTrophy, accent: '#d4a017', emoji: '⚔️',
                    title: 'Desafio',     desc: 'Convide outro clube para jogar.',
                    tags: ['Link', 'Clube'] },
                ].map(({ mode, icon, accent, emoji, title, desc, tags }) => (
                  <button key={mode}
                    onClick={() => { set({ match_type: mode === 'desafio' ? 'rachao' : mode }); setStep(mode); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                      padding: '16px 12px', cursor: 'pointer', textAlign: 'center',
                      background: `linear-gradient(135deg,${accent}0c,transparent)`,
                      border: `1px solid ${accent}35`, borderRadius: 12, transition: 'border-color .15s' }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: `${accent}18`,
                      border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 20, color: accent }}>
                      <FontAwesomeIcon icon={icon} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase',
                        letterSpacing: '-0.01em', marginBottom: 4 }}>{emoji} {title}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, marginBottom: 6 }}>{desc}</p>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {tags.map(t => (
                          <span key={t} style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px',
                            background: `${accent}12`, border: `1px solid ${accent}25`, color: accent,
                            textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 4 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de configuração */}
          {(step === 'rachao' || step === 'manual' || step === 'desafio') && (
            <RachaoForm
              cfg={cfg}
              set={set}
              onSubmit={handleSubmit}
              mode={step === 'manual' ? 'manual' : 'rachao'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
