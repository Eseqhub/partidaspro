'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faChevronRight, faChevronLeft, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/infra/supabase/client';

import { MatchDraft, MATCH_DRAFT_INITIAL, MODALIDADES, blue, totalSteps } from './NovaPartida/types';
import { Step1TipoModalidade } from './NovaPartida/Step1TipoModalidade';
import { Step2DataLocal } from './NovaPartida/Step2DataLocal';
import { StepSuccess } from './NovaPartida/StepSuccess';
import { StepChallenge } from './NovaPartida/StepChallenge';

export type { TipoCampo, Modalidade, Recorrencia } from './NovaPartida/types';

interface Props {
  isOpen:    boolean;
  groupId:   string;
  groupSlug: string;
  onClose:   () => void;
  onSuccess: (matchId: string) => void;
}

export function NovaPartidaModal({ isOpen, groupId, groupSlug, onClose, onSuccess }: Props) {
  const [step,          setStep]          = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [matchId,       setMatchId]       = useState('');
  const [challengeLink, setChallengeLink] = useState('');
  const [copied,        setCopied]        = useState(false);
  const [draft,         setDraft]         = useState<MatchDraft>(MATCH_DRAFT_INITIAL);

  const set = (key: keyof MatchDraft, val: any) =>
    setDraft(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) { alert('Sua sessão expirou. Faça login novamente.'); setSaving(false); return; }
      }

      const sportFromCampo = (c: string) =>
        c.startsWith('Futsal') ? 'Futsal' : c.startsWith('Campo') ? 'Campo' : 'Society';

      const basePayload: Record<string, any> = {
        group_id:         groupId,
        date:             draft.data,
        status:           'Agendada',
        field_type:       draft.tipo_campo,
        sport_type:       sportFromCampo(draft.tipo_campo),
        modality:         draft.modalidade,
        match_type:       draft.modalidade === 'Desafio' ? 'desafio' : draft.modalidade === 'Manual' ? 'manual' : 'rachao',
        start_time:       draft.hora_inicio,
        end_time:         draft.hora_fim,
        home_team_name:   draft.nome_time_a || 'Time Casa',
        away_team_name:   draft.modalidade === 'Desafio' ? (draft.nome_time_adversario || 'Adversário') : draft.nome_time_b || 'Visitante',
        home_color:       draft.cor_time_a,
        away_color:       draft.cor_time_b,
        goal_limit:       draft.limite_gols,
        duration_minutes: draft.duracao_minutos,
        home_score:       0,
        away_score:       0,
        timer_seconds:    0,
        stoppage_minutes: 0,
        match_fee:        0,
      };

      const recPayload = draft.recorrencia !== 'nao'
        ? { recorrencia: draft.recorrencia, recorrencia_dia: draft.recorrencia_dia }
        : {};

      let match: any, mErr: any;
      ({ data: match, error: mErr } = await supabase
        .from('matches').insert({ ...basePayload, ...recPayload }).select('id').single());

      if (mErr && /recorrencia/i.test(mErr.message ?? '')) {
        ({ data: match, error: mErr } = await supabase
          .from('matches').insert(basePayload).select('id').single());
      }

      if (mErr) throw mErr;

      try {
        await supabase.from('match_configs').insert({
          match_id: match.id, group_id: groupId, tipo_campo: draft.tipo_campo,
          modalidade: draft.modalidade, local: draft.local || null,
          hora_inicio: draft.hora_inicio || null, hora_fim: draft.hora_fim || null,
          duracao_minutos: draft.duracao_minutos,
        });
      } catch { /* tabela pode não existir */ }

      if (draft.recorrencia !== 'nao') {
        try {
          const { data: players } = await supabase
            .from('players').select('id').eq('group_id', groupId).eq('status', 'Ativo');
          if (players && players.length > 0) {
            for (const p of players) {
              await supabase.from('match_presence').upsert(
                { match_id: match.id, player_id: p.id, status: 'Confirmado', team: null },
                { onConflict: 'match_id,player_id' }
              );
            }
          }
        } catch { /* ignorar se falhar */ }
      }

      if (draft.modalidade === 'Desafio') {
        const token = Math.random().toString(36).substring(2, 18);
        const base  = typeof window !== 'undefined' ? window.location.origin : '';
        await supabase.from('matches').update({ challenge_token: token }).eq('id', match.id);
        setChallengeLink(`${base}/${groupSlug}/challenge/${token}`);
        setMatchId(match.id);
        setStep(4);
      } else {
        setMatchId(match.id);
        setStep(3);
      }
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

  const handleClose = () => {
    setStep(1); setSaving(false); setMatchId(''); setChallengeLink(''); setCopied(false);
    setDraft(MATCH_DRAFT_INITIAL);
    onClose();
  };

  if (!isOpen) return null;

  const steps    = totalSteps(draft.modalidade);
  const modColor = MODALIDADES.find(m => m.value === draft.modalidade)?.color ?? blue;
  const stepLabel = step === 1 ? 'Tipo & Modalidade' : step === 2 ? 'Data, Local & Horário' : step === 3 ? 'Partida Criada!' : 'Link de Desafio';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '90dvh', background: 'linear-gradient(160deg,#050e1f,#020810)', border: '1px solid rgba(0,180,255,0.13)', boxShadow: '0 0 80px rgba(0,180,255,0.07)', overflowY: 'auto', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#050e1f', zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: blue, marginBottom: 2 }}>
              NOVA PARTIDA · PASSO {step} DE {steps}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              {stepLabel}
            </h2>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: 8 }}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${blue},${modColor})`, width: `${(step / steps) * 100}%`, transition: 'width .4s' }} />
        </div>

        <div style={{ padding: '28px 24px' }}>
          {step === 1 && <Step1TipoModalidade draft={draft} set={set} />}
          {step === 2 && <Step2DataLocal draft={draft} modColor={modColor} set={set} />}
          {step === 3 && <StepSuccess draft={draft} matchId={matchId} modColor={modColor} onGo={onSuccess} onClose={handleClose} />}
          {step === 4 && <StepChallenge challengeLink={challengeLink} copied={copied} matchId={matchId} onCopy={handleCopyLink} onGo={onSuccess} />}
        </div>

        {/* Footer de navegação */}
        {step < 3 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, background: '#050e1f' }}>
            <button onClick={() => step === 1 ? handleClose() : setStep(s => s - 1)}
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
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: saving ? 'rgba(204,255,0,0.2)' : `linear-gradient(135deg,${modColor},${modColor}88)`, color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: saving ? 'wait' : 'pointer' }}>
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
