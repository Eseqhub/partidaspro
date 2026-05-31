'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faFutbol, faDice, faChevronRight,
  faChevronLeft, faCheckCircle, faCopy, faSpinner,
  faCalendarDays, faMapPin, faClock, faShieldHalved,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/infra/supabase/client';

// ── Tipos ────────────────────────────────────────────────────────────────────
export type TipoCampo = 'Futsal 5x5' | 'Society 6x6' | 'Society 7x7' | 'Campo 11x11';
export type Modalidade = 'Rachão' | 'Desafio';

interface MatchDraft {
  tipo_campo: TipoCampo;
  modalidade: Modalidade;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  duracao_minutos: number;
  nome_time_adversario?: string;
  nome_time_a: string;
  nome_time_b: string;
  cor_time_a: string;
  cor_time_b: string;
  limite_gols: number;
}

interface Props {
  isOpen: boolean;
  groupId: string;
  groupSlug: string;
  onClose: () => void;
  onSuccess: (matchId: string) => void;
}

// ── Paleta ───────────────────────────────────────────────────────────────────
const neon  = '#ccff00';
const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';

// ── Opções de campo ──────────────────────────────────────────────────────────
const CAMPOS: { value: TipoCampo; label: string; sub: string; players: number; emoji: string }[] = [
  { value: 'Futsal 5x5',   label: 'Futsal',     sub: '5 × 5',   players: 5,  emoji: '🏟️' },
  { value: 'Society 6x6',  label: 'Society',    sub: '6 × 6',   players: 6,  emoji: '⚽' },
  { value: 'Society 7x7',  label: 'Society',    sub: '7 × 7',   players: 7,  emoji: '⚽' },
  { value: 'Campo 11x11',  label: 'Campo',      sub: '11 × 11', players: 11, emoji: '🏆' },
];

const MODALIDADES: { value: Modalidade; label: string; desc: string; icon: any; color: string }[] = [
  { value: 'Rachão',   label: 'Rachão / Sorteio', desc: 'Times sorteados automaticamente pelo algoritmo inteligente entre os participantes do seu clube.',    icon: faDice,   color: neon  },
  { value: 'Desafio',  label: 'Desafio de Clube',  desc: 'Partida contra outro clube. Gere um link de desafio e envie para o adversário confirmar.',            icon: faTrophy, color: gold  },
];

// ── Input estilizado ─────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' as any,
  letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginBottom: 6,
};

// ── Componente principal ─────────────────────────────────────────────────────
export function NovaPartidaModal({ isOpen, groupId, groupSlug, onClose, onSuccess }: Props) {
  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [matchId, setMatchId] = useState('');
  const [challengeLink, setChallengeLink] = useState('');
  const [copied,  setCopied]  = useState(false);

  const [draft, setDraft] = useState<MatchDraft>({
    tipo_campo:      'Society 7x7',
    modalidade:      'Rachão',
    data:            new Date().toISOString().split('T')[0],
    hora_inicio:     '08:00',
    hora_fim:        '10:00',
    local:           '',
    duracao_minutos: 10,
    nome_time_a:     'Time Casa',
    nome_time_b:     'Visitante',
    cor_time_a:      'Branco',
    cor_time_b:      'Preto',
    limite_gols:     0,
  });

  const set = (key: keyof MatchDraft, val: any) => setDraft(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    setSaving(true);
    try {
      // 1. Criar partida na tabela matches
      const { data: match, error: mErr } = await supabase
        .from('matches')
        .insert({
          group_id:   groupId,
          date:       draft.data,
          status:     'Agendada',
          field_type: draft.tipo_campo,
          modality:   draft.modalidade,
          start_time: draft.hora_inicio,
          end_time:   draft.hora_fim,
          home_team_name: draft.modalidade === 'Rachão' ? draft.nome_time_a : 'Meu Clube',
          away_team_name: draft.modalidade === 'Rachão' ? draft.nome_time_b : (draft.nome_time_adversario || 'Adversário'),
          home_color: draft.modalidade === 'Rachão' ? draft.cor_time_a : 'Branco',
          away_color: draft.modalidade === 'Rachão' ? draft.cor_time_b : 'Preto',
          goal_limit: draft.limite_gols,
        })
        .select('id')
        .single();

      if (mErr) throw mErr;

      // 2. Criar configuração na match_configs
      await supabase.from('match_configs').insert({
        match_id:       match.id,
        group_id:       groupId,
        tipo_campo:     draft.tipo_campo,
        modalidade:     draft.modalidade,
        local:          draft.local || null,
        hora_inicio:    draft.hora_inicio || null,
        hora_fim:       draft.hora_fim || null,
        duracao_minutos: draft.duracao_minutos,
      });

      // 3. Se for Desafio, gerar challenge token
      if (draft.modalidade === 'Desafio') {
        const token = Math.random().toString(36).substring(2, 18);
        const base  = typeof window !== 'undefined' ? window.location.origin : 'https://partidas-pro.vercel.app';
        await supabase.from('matches').update({ challenge_token: token }).eq('id', match.id);
        setChallengeLink(`${base}/${groupSlug}/challenge/${token}`);
      }

      setMatchId(match.id);
      setStep(draft.modalidade === 'Desafio' ? 4 : 3);
    } catch (err: any) {
      alert(`Erro ao criar partida: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(challengeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  };

  const modal: React.CSSProperties = {
    width: '100%', maxWidth: 560, maxHeight: '90dvh',
    background: 'linear-gradient(160deg,#050e1f,#020810)',
    border: `1px solid ${blue}22`,
    boxShadow: `0 0 80px ${blue}12`,
    overflowY: 'auto', position: 'relative',
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#050e1f', zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: blue, marginBottom: 2 }}>
              NOVA PARTIDA · PASSO {step} DE {draft.modalidade === 'Desafio' ? 4 : 3}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              {step === 1 ? 'Tipo & Modalidade' : step === 2 ? 'Data, Local & Horário' : step === 3 ? 'Partida Criada!' : 'Link de Desafio'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: 8 }}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${blue},${neon})`,
            width: `${(step / (draft.modalidade === 'Desafio' ? 4 : 3)) * 100}%`, transition: 'width .4s' }} />
        </div>

        <div style={{ padding: '28px 24px' }}>

          {/* ── STEP 1: Tipo de Campo + Modalidade ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Tipo de campo */}
              <div>
                <label style={{ ...lbl, marginBottom: 12 }}>
                  <FontAwesomeIcon icon={faFutbol} style={{ marginRight: 6 }} />Tipo de Campo
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {CAMPOS.map(c => (
                    <button key={c.value} onClick={() => set('tipo_campo', c.value)}
                      style={{
                        padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
                        background: draft.tipo_campo === c.value ? `${blue}12` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${draft.tipo_campo === c.value ? blue : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all .2s',
                      }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
                      <p style={{ fontSize: 11, fontWeight: 900, color: draft.tipo_campo === c.value ? blue : '#fff', textTransform: 'uppercase' }}>{c.label}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{c.sub} jogadores</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modalidade */}
              <div>
                <label style={{ ...lbl, marginBottom: 12 }}>
                  <FontAwesomeIcon icon={faDice} style={{ marginRight: 6 }} />Modalidade
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MODALIDADES.map(m => (
                    <button key={m.value} onClick={() => set('modalidade', m.value)}
                      style={{
                        padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                        background: draft.modalidade === m.value ? `${m.color}08` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${draft.modalidade === m.value ? m.color + '44' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
                      }}>
                      <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: draft.modalidade === m.value ? `${m.color}18` : 'rgba(255,255,255,0.04)' }}>
                        <FontAwesomeIcon icon={m.icon} style={{ color: draft.modalidade === m.value ? m.color : 'rgba(255,255,255,0.3)', fontSize: 16 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 900, color: draft.modalidade === m.value ? m.color : '#fff', textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{m.desc}</p>
                      </div>
                      {draft.modalidade === m.value && (
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: m.color, fontSize: 14, marginLeft: 'auto', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome do time adversário (só para Desafio) */}
              {draft.modalidade === 'Desafio' && (
                <div style={{ padding: '16px', background: `${gold}06`, border: `1px solid ${gold}22`, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn .3s' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: gold }}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 6 }} />
                    Adversário
                  </p>
                  <div>
                    <label style={lbl}>Nome do time adversário (opcional)</label>
                    <input style={inp} value={draft.nome_time_adversario ?? ''} onChange={e => set('nome_time_adversario', e.target.value)} placeholder="EX: GALÁTICOS FC..." />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Data, Local & Horário ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 6 }} />Data da partida</label>
                <input type="date" style={{ ...inp, colorScheme: 'dark' }} value={draft.data} onChange={e => set('data', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}><FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />Início</label>
                  <input type="time" style={{ ...inp, colorScheme: 'dark' }} value={draft.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}><FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />Término</label>
                  <input type="time" style={{ ...inp, colorScheme: 'dark' }} value={draft.hora_fim} onChange={e => set('hora_fim', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={lbl}><FontAwesomeIcon icon={faMapPin} style={{ marginRight: 6 }} />Local / Quadra</label>
                <input style={inp} value={draft.local} onChange={e => set('local', e.target.value)} placeholder="EX: ARENA GALÁCTICOS, QUADRA 3..." />
              </div>

              <div>
                <label style={lbl}>Duração de cada game (minutos)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[7, 10, 12, 15, 20].map(d => (
                    <button key={d} onClick={() => set('duracao_minutos', d)}
                      style={{ padding: '8px 16px', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                        background: draft.duracao_minutos === d ? `${blue}18` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${draft.duracao_minutos === d ? blue : 'rgba(255,255,255,0.1)'}`,
                        color: draft.duracao_minutos === d ? blue : 'rgba(255,255,255,0.5)', transition: 'all .2s' }}>
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>Campo</p>
                  <p style={{ fontSize: 11, fontWeight: 900, color: blue }}>{draft.tipo_campo}</p>
                </div>
                <div>
                  <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>Modalidade</p>
                  <p style={{ fontSize: 11, fontWeight: 900, color: draft.modalidade === 'Rachão' ? neon : gold }}>{draft.modalidade}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Sucesso (Rachão) ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${green}12`, border: `2px solid ${green}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: green }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>Partida Criada!</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
                {draft.tipo_campo} · {draft.modalidade}<br />
                {draft.data ? new Date(draft.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}{draft.local ? ` · ${draft.local}` : ''}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => onSuccess(matchId)} style={{ padding: '12px 24px', background: `linear-gradient(135deg,${neon},#aadd00)`, color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faFutbol} style={{ marginRight: 8 }} />IR PARA A PARTIDA
                </button>
                <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer' }}>
                  FECHAR
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Link de Desafio ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center', paddingBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${gold}12`, border: `2px solid ${gold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>
                  <FontAwesomeIcon icon={faTrophy} style={{ color: gold }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 6 }}>Link de Desafio Gerado!</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Envie este link para o clube adversário. Quando eles clicarem e aceitarem, a partida será vinculada automaticamente.
                </p>
              </div>

              {/* Link box */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${gold}33`, fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {challengeLink}
                </div>
                <button onClick={handleCopyLink} style={{ padding: '12px 18px', background: copied ? `${green}20` : `${gold}18`, border: `1px solid ${copied ? green : gold}44`, color: copied ? green : gold, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0, transition: 'all .2s' }}>
                  <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} style={{ marginRight: 6 }} />
                  {copied ? 'COPIADO!' : 'COPIAR'}
                </button>
              </div>

              <div style={{ padding: '12px 16px', background: `${gold}06`, border: `1px solid ${gold}15` }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  ✅ Partida <strong style={{ color: '#fff' }}>{draft.tipo_campo}</strong> criada para <strong>{draft.data ? new Date(draft.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</strong>
                  {draft.hora_inicio ? ` às ${draft.hora_inicio}` : ''}
                  {draft.local ? ` · ${draft.local}` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => onSuccess(matchId)} style={{ padding: '12px 24px', background: `linear-gradient(135deg,${neon},#aadd00)`, color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
                  IR PARA A PARTIDA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer de navegação */}
        {step < 3 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, background: '#050e1f' }}>
            <button onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faChevronLeft} />
              {step === 1 ? 'CANCELAR' : 'VOLTAR'}
            </button>

            {step === 1 && (
              <button onClick={() => setStep(2)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: `linear-gradient(135deg,${blue},#0066cc)`, color: '#fff', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: 'pointer' }}>
                PRÓXIMO <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}

            {step === 2 && (
              <button onClick={handleCreate} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: saving ? 'rgba(204,255,0,0.2)' : `linear-gradient(135deg,${neon},#aadd00)`, color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                {saving ? 'CRIANDO...' : draft.modalidade === 'Desafio' ? 'CRIAR & GERAR LINK' : 'CRIAR PARTIDA'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
