'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faFutbol, faTrophy, faShuffle, faClock,
  faMapPin, faChevronLeft, faLink, faCopy, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { SportType, GameMode, MatchType } from '@/core/entities/match';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateMatchConfig {
  match_type: MatchType;
  sport_type: SportType;
  game_mode: GameMode;
  home_team_name: string;
  away_team_name: string;
  home_color: string;
  away_color: string;
  playersPerTeam: number;
  duration: number;
  stoppage: number;
  goalLimit: number;
  location: string;
  date: string;
  sessionStartTime: string;
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado quando o modo Rachão é confirmado */
  onCreateRachao: (cfg: CreateMatchConfig) => void;
  /** Chamado quando o modo Desafio é criado — retorna o challengeLink gerado */
  onCreateDesafio: (cfg: CreateMatchConfig) => Promise<string>;
}

type Step = 'choose' | 'rachao' | 'desafio' | 'link';

// ─── Constantes visuais ───────────────────────────────────────────────────────

const gold = '#d4a017';
const blue = '#00b4ff';
const neon = '#ccff00';

// ─── Componente ───────────────────────────────────────────────────────────────

export function CreateMatchModal({
  isOpen, onClose, onCreateRachao, onCreateDesafio,
}: CreateMatchModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [challengeLink, setChallengeLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [cfg, setCfg] = useState<CreateMatchConfig>({
    match_type: 'rachao',
    sport_type: 'Society',
    game_mode: 'Rachão',
    home_team_name: '',
    away_team_name: '',
    home_color: 'Branco',
    away_color: 'Preto',
    playersPerTeam: 7,
    duration: 10,
    stoppage: 0,
    goalLimit: 0,
    location: '',
    date: new Date().toISOString().slice(0, 10),
    sessionStartTime: '08:00',
  });

  const set = (patch: Partial<CreateMatchConfig>) =>
    setCfg(prev => ({ ...prev, ...patch }));

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('choose');
    setChallengeLink('');
    setCopied(false);
    onClose();
  };

  const handleRachaoSubmit = () => {
    onCreateRachao({ ...cfg, match_type: 'rachao' });
    handleClose();
  };

  const handleDesafioSubmit = async () => {
    setLoading(true);
    try {
      const link = await onCreateDesafio({ ...cfg, match_type: 'desafio' });
      setChallengeLink(link);
      setStep('link');
    } catch (e) {
      alert('Erro ao gerar o desafio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(challengeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Estilos compartilhados ──────────────────────────────────────────────

  const inputCls = `
    w-full bg-black/40 border border-white/10 p-3 text-white text-xs font-bold
    uppercase tracking-wider outline-none
    transition-colors placeholder:text-white/20
  `;
  const labelCls = 'block text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1.5';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  // ── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md">
      {/* Painel principal */}
      <div
        style={{
          background: 'linear-gradient(160deg,#050e1f 0%,#020810 100%)',
          border: `1px solid ${blue}22`,
          boxShadow: `0 0 60px ${blue}11, 0 24px 80px rgba(0,0,0,0.8)`,
          width: '100%',
          maxWidth: 560,
          maxHeight: '94vh',
          overflowY: 'auto',
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: `1px solid ${blue}18`,
          background: `linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,12,30,0.9),rgba(0,0,0,0.9))`,
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step !== 'choose' && (
              <button
                onClick={() => setStep('choose')}
                style={{ color: `${blue}88`, marginRight: 4, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}
            <div>
              <div style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: blue, lineHeight: 1.2 }}>
                {step === 'choose' && 'NOVA SESSÃO'}
                {step === 'rachao' && 'CONFIGURAR RACHÃO'}
                {step === 'desafio' && 'CONFIGURAR DESAFIO'}
                {step === 'link' && 'DESAFIO CRIADO'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {step === 'choose' && 'Que tipo de jogo?'}
                {step === 'rachao' && 'Pelada Interna'}
                {step === 'desafio' && 'VS Outro Time'}
                {step === 'link' && 'Envie o link pro adversário!'}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Keyframes e responsividade mobile */}
          <style>{`
            .cmm-grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            @media (max-width: 420px) { .cmm-grid-2col { grid-template-columns: 1fr; } }
          `}</style>

          {/* ── STEP: CHOOSE ─────────────────────────────────────────── */}
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Card Rachão */}
              <button
                onClick={() => { set({ match_type: 'rachao' }); setStep('rachao'); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 20, padding: '22px 20px',
                  background: `linear-gradient(135deg,${neon}0a,transparent)`,
                  border: `1px solid ${neon}30`,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${neon}80`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${neon}30`)}
              >
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  background: `${neon}18`, border: `1px solid ${neon}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: neon,
                }}>
                  <FontAwesomeIcon icon={faShuffle} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 4 }}>
                    ⚡ Rachão / Pelada
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                    Sorteio inteligente de times com seus atletas cadastrados.
                    Suporte a Rachão, Revezamento, Dois ou Dez e Vira-Acaba.
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    {['Sorteio Automático', 'Chamada', 'Placar ao vivo'].map(tag => (
                      <span key={tag} style={{
                        fontSize: 7, fontWeight: 900, padding: '2px 6px',
                        background: `${neon}12`, border: `1px solid ${neon}25`,
                        color: neon, textTransform: 'uppercase', letterSpacing: '0.1em',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </button>

              {/* Card Desafio */}
              <button
                onClick={() => { set({ match_type: 'desafio' }); setStep('desafio'); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 20, padding: '22px 20px',
                  background: `linear-gradient(135deg,${gold}0a,transparent)`,
                  border: `1px solid ${gold}30`,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${gold}80`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${gold}30`)}
              >
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  background: `${gold}18`, border: `1px solid ${gold}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: gold,
                }}>
                  <FontAwesomeIcon icon={faTrophy} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 4 }}>
                    🏆 Desafio — VS Outro Time
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                    Gera um link de convite para o time adversário aceitar.
                    Sem sorteio — cada time traz seus próprios atletas.
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    {['Link de Convite', 'Sem Sorteio', 'Tempo real'].map(tag => (
                      <span key={tag} style={{
                        fontSize: 7, fontWeight: 900, padding: '2px 6px',
                        background: `${gold}12`, border: `1px solid ${gold}25`,
                        color: gold, textTransform: 'uppercase', letterSpacing: '0.1em',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* ── STEP: RACHÃO CONFIG ───────────────────────────────────── */}
          {step === 'rachao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Esporte */}
                <div>
                  <label className={labelCls}><FontAwesomeIcon icon={faFutbol} className="mr-1" /> Esporte</label>
                  <select className={selectCls} value={cfg.sport_type} onChange={e => set({ sport_type: e.target.value as SportType })}>
                    <option value="Society" className="bg-slate-900">Society (7x7)</option>
                    <option value="Futsal" className="bg-slate-900">Futsal (5x5)</option>
                    <option value="Campo" className="bg-slate-900">Campo (11x11)</option>
                  </select>
                </div>
                {/* Modo de jogo */}
                <div>
                  <label className={labelCls}>Modo do Jogo</label>
                  <select className={selectCls} value={cfg.game_mode} onChange={e => set({ game_mode: e.target.value as GameMode })}>
                    <option value="Rachão" className="bg-slate-900">Rachão (Vencedor Fica)</option>
                    <option value="Revezamento" className="bg-slate-900">Revezamento Dinâmico</option>
                    <option value="Dois ou Dez" className="bg-slate-900">Dois ou Dez</option>
                    <option value="Vira-Acaba" className="bg-slate-900">Vira-Acaba</option>
                  </select>
                </div>
                {/* Jogadores/time */}
                <div>
                  <label className={labelCls}>Atletas por Time</label>
                  <input type="number" className={inputCls} value={cfg.playersPerTeam} min={2} max={11}
                    onChange={e => set({ playersPerTeam: +e.target.value })} />
                </div>
                {/* Duração */}
                <div>
                  <label className={labelCls}><FontAwesomeIcon icon={faClock} className="mr-1" /> Duração (min)</label>
                  <input type="number" className={inputCls} value={cfg.duration} min={1}
                    onChange={e => set({ duration: +e.target.value })} />
                </div>
                {/* Limite de gols */}
                <div>
                  <label className={labelCls}>Limite Gols (0=sem limite)</label>
                  <input type="number" className={inputCls} value={cfg.goalLimit} min={0}
                    onChange={e => set({ goalLimit: +e.target.value })} />
                </div>
                {/* Acréscimos */}
                <div>
                  <label className={labelCls}>Acréscimos (min)</label>
                  <input type="number" className={inputCls} value={cfg.stoppage} min={0}
                    onChange={e => set({ stoppage: +e.target.value })} />
                </div>
                {/* Nome Time A */}
                <div>
                  <label className={labelCls}>Nome Time A (Casa)</label>
                  <input type="text" className={inputCls} value={cfg.home_team_name}
                    placeholder="TIME CASA..." onChange={e => set({ home_team_name: e.target.value })} />
                </div>
                {/* Nome Time B */}
                <div>
                  <label className={labelCls}>Nome Time B (Visita)</label>
                  <input type="text" className={inputCls} value={cfg.away_team_name}
                    placeholder="TIME VISITA..." onChange={e => set({ away_team_name: e.target.value })} />
                </div>
                {/* Cor Time A */}
                <div>
                  <label className={labelCls}>Cor Time A</label>
                  <input type="text" className={inputCls} value={cfg.home_color}
                    placeholder="BRANCO..." onChange={e => set({ home_color: e.target.value })} />
                </div>
                {/* Cor Time B */}
                <div>
                  <label className={labelCls}>Cor Time B</label>
                  <input type="text" className={inputCls} value={cfg.away_color}
                    placeholder="PRETO..." onChange={e => set({ away_color: e.target.value })} />
                </div>
              </div>

              {/* Local */}
              <div>
                <label className={labelCls}><FontAwesomeIcon icon={faMapPin} className="mr-1" /> Local / Quadra</label>
                <input type="text" className={inputCls} value={cfg.location}
                  placeholder="EX: ARENA NACIONAL..." onChange={e => set({ location: e.target.value })} />
              </div>

              {/* Botão */}
              <button
                onClick={handleRachaoSubmit}
                style={{
                  padding: '14px 0', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.3em', border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg,${neon},#aadd00)`, color: '#000',
                  boxShadow: `0 0 30px ${neon}33`,
                }}
              >
                <FontAwesomeIcon icon={faShuffle} style={{ marginRight: 8 }} />
                CRIAR E IR PARA CHAMADA
              </button>
            </div>
          )}

          {/* ── STEP: DESAFIO CONFIG ──────────────────────────────────── */}
          {step === 'desafio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Esporte */}
                <div>
                  <label className={labelCls}><FontAwesomeIcon icon={faFutbol} className="mr-1" /> Esporte</label>
                  <select className={selectCls} value={cfg.sport_type} onChange={e => set({ sport_type: e.target.value as SportType })}>
                    <option value="Society" className="bg-slate-900">Society (7x7)</option>
                    <option value="Futsal" className="bg-slate-900">Futsal (5x5)</option>
                    <option value="Campo" className="bg-slate-900">Campo (11x11)</option>
                  </select>
                </div>
                {/* Jogadores/time */}
                <div>
                  <label className={labelCls}>Atletas por Time</label>
                  <input type="number" className={inputCls} value={cfg.playersPerTeam} min={2} max={11}
                    onChange={e => set({ playersPerTeam: +e.target.value })} />
                </div>
                {/* Nome do seu time */}
                <div>
                  <label className={labelCls}>Nome do SEU Time</label>
                  <input type="text" className={inputCls} value={cfg.home_team_name}
                    placeholder="EX: GAROTOS DO ZEQUI..." onChange={e => set({ home_team_name: e.target.value })} />
                </div>
                {/* Nome adversário (opcional) */}
                <div>
                  <label className={labelCls}>Time Adversário (opcional)</label>
                  <input type="text" className={inputCls} value={cfg.away_team_name}
                    placeholder="SERA DEFINIDO POR ELES..." onChange={e => set({ away_team_name: e.target.value })} />
                </div>
                {/* Data */}
                <div>
                  <label className={labelCls}>Data do Jogo</label>
                  <input type="date" className={inputCls} value={cfg.date}
                    style={{ colorScheme: 'dark' }} onChange={e => set({ date: e.target.value })} />
                </div>
                {/* Horário */}
                <div>
                  <label className={labelCls}><FontAwesomeIcon icon={faClock} className="mr-1" /> Horário</label>
                  <input type="time" className={inputCls} value={cfg.sessionStartTime}
                    style={{ colorScheme: 'dark' }} onChange={e => set({ sessionStartTime: e.target.value })} />
                </div>
                {/* Duração */}
                <div>
                  <label className={labelCls}>Duração (min)</label>
                  <input type="number" className={inputCls} value={cfg.duration} min={1}
                    onChange={e => set({ duration: +e.target.value })} />
                </div>
                {/* Cor do seu time */}
                <div>
                  <label className={labelCls}>Cor do Seu Time</label>
                  <input type="text" className={inputCls} value={cfg.home_color}
                    placeholder="BRANCO..." onChange={e => set({ home_color: e.target.value })} />
                </div>
              </div>

              {/* Local */}
              <div>
                <label className={labelCls}><FontAwesomeIcon icon={faMapPin} className="mr-1" /> Local / Quadra</label>
                <input type="text" className={inputCls} value={cfg.location}
                  placeholder="EX: ARENA NACIONAL..." onChange={e => set({ location: e.target.value })} />
              </div>

              {/* Info box */}
              <div style={{
                padding: '12px 16px', background: `${gold}0a`, border: `1px solid ${gold}25`,
                fontSize: 10, color: `${gold}cc`, lineHeight: 1.6,
              }}>
                <strong>Como funciona:</strong> Após criar, você receberá um link exclusivo.
                O time adversário abre o link, vê os detalhes do jogo e confirma a presença.
                Quando aceitarem, você recebe a notificação aqui.
              </div>

              {/* Botão */}
              <button
                onClick={handleDesafioSubmit}
                disabled={loading || !cfg.home_team_name}
                style={{
                  padding: '14px 0', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.3em', border: 'none', cursor: loading ? 'wait' : 'pointer',
                  background: loading || !cfg.home_team_name
                    ? 'rgba(100,80,0,0.4)'
                    : `linear-gradient(135deg,${gold},#f5d060)`,
                  color: '#000',
                  opacity: !cfg.home_team_name ? 0.5 : 1,
                  boxShadow: `0 0 30px ${gold}22`,
                }}
              >
                <FontAwesomeIcon icon={faLink} style={{ marginRight: 8 }} />
                {loading ? 'GERANDO LINK...' : 'GERAR LINK DE DESAFIO'}
              </button>
            </div>
          )}

          {/* ── STEP: LINK GERADO ─────────────────────────────────────── */}
          {step === 'link' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', textAlign: 'center' }}>
              {/* Ícone de sucesso */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: `${gold}18`, border: `2px solid ${gold}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: gold,
              }}>
                <FontAwesomeIcon icon={faTrophy} />
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 6 }}>
                  Desafio Criado!
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  Envie o link abaixo para o time adversário.<br />
                  Quando eles aceitarem, a partida aparecerá aqui como <strong style={{ color: gold }}>ATIVA</strong>.
                </div>
              </div>

              {/* Link */}
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                  LINK DE CONVITE
                </div>
                <div style={{
                  display: 'flex', gap: 8, background: 'rgba(0,0,0,0.5)', border: `1px solid ${gold}30`, padding: 4,
                }}>
                  <input
                    readOnly
                    value={challengeLink}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: gold, fontSize: 10, fontFamily: 'monospace', padding: '8px 12px', minWidth: 0,
                    }}
                  />
                  <button
                    onClick={handleCopy}
                    style={{
                      padding: '8px 16px', fontWeight: 900, fontSize: 9, textTransform: 'uppercase',
                      letterSpacing: '0.15em', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: copied ? '#22c55e' : gold, color: '#000', transition: 'all .2s',
                    }}
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ marginRight: 4 }} />
                    {copied ? 'COPIADO!' : 'COPIAR'}
                  </button>
                </div>
              </div>

              {/* Botões de share */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🏆 Você foi DESAFIADO para um jogo!\n\nAcesse o link para aceitar:\n${challengeLink}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, padding: '12px 0', textAlign: 'center', fontWeight: 900, fontSize: 9,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    background: '#25D366', color: '#000', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  📱 ENVIAR NO WHATSAPP
                </a>
                <button
                  onClick={handleClose}
                  style={{
                    flex: 1, padding: '12px 0', fontWeight: 900, fontSize: 9,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.1)`,
                    color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  }}
                >
                  VER PAINEL DA PARTIDA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyframes animações */}
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.95) translateY(20px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
