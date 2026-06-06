'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar, faClock, faLocationDot, faFutbol,
  faCheckCircle, faArrowLeft, faArrowRight,
  faCopy, faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { Group } from '@/core/entities/group';
import { Match } from '@/core/entities/match';

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

type FieldType = 'Futsal 5x5' | 'Society 6x6' | 'Society 7x7' | 'Campo 11x11';
type Modality  = 'Rachão' | 'Bolão' | 'Revezamento' | 'Dez ou 2 Gols';

const FIELD_OPTIONS: { value: FieldType; label: string; sub: string; players: number }[] = [
  { value: 'Futsal 5x5',  label: 'FUTSAL',   sub: '5 × 5',   players: 5  },
  { value: 'Society 6x6', label: 'SOCIETY',  sub: '6 × 6',   players: 6  },
  { value: 'Society 7x7', label: 'SOCIETY',  sub: '7 × 7',   players: 7  },
  { value: 'Campo 11x11', label: 'CAMPO',    sub: '11 × 11', players: 11 },
];

const MODALITY_OPTIONS: { value: Modality; label: string; desc: string }[] = [
  { value: 'Rachão',       label: 'RACHÃO',        desc: 'Times fixos, partida longa' },
  { value: 'Bolão',        label: 'BOLÃO',          desc: 'Times mistos, joga quem quiser' },
  { value: 'Revezamento',  label: 'REVEZAMENTO',   desc: '3 times, quem perde sai' },
  { value: 'Dez ou 2 Gols',label: 'DEZ OU 2 GOLS', desc: 'Ganha quem fizer 10 ou vencer por 2' },
];

// ────────────────────────────────────────────────────────────────
// Indicador de passos
// ────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 justify-center mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`h-1 transition-all duration-300 ${i < current ? 'bg-primary flex-1' : i === current ? 'bg-primary flex-[2]' : 'bg-white/10 flex-1'}`} />
        </React.Fragment>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Wizard: Passo 1 — Data, Hora e Local
// ────────────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2">Passo 1 de 3</p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Quando e Onde?</h2>
        <p className="text-white/30 text-xs mt-1">Defina a logística da partida</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendar} className="text-[9px]" />
          Data da Partida
        </label>
        <input
          type="date" style={{ colorScheme: "dark" }}
          required
          value={data.date}
          onChange={e => onChange({ ...data, date: e.target.value })}
          className="w-full bg-black/40 border border-white/10 p-4 text-white font-bold outline-none focus:border-primary/50 transition-colors appearance-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-[9px]" />
            Início
          </label>
          <input
            type="time"
            value={data.start_time}
            onChange={e => onChange({ ...data, start_time: e.target.value })}
            className="w-full bg-black/40 border border-white/10 p-4 text-white font-bold outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-[9px]" />
            Término
          </label>
          <input
            type="time"
            value={data.end_time}
            onChange={e => onChange({ ...data, end_time: e.target.value })}
            className="w-full bg-black/40 border border-white/10 p-4 text-white font-bold outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
          <FontAwesomeIcon icon={faLocationDot} className="text-[9px]" />
          Local
        </label>
        <input
          type="text"
          placeholder="EX: ARENA DO ZEQUI, QUADRA 3"
          value={data.location}
          onChange={e => onChange({ ...data, location: e.target.value })}
          className="w-full bg-black/40 border border-white/10 p-4 text-white uppercase font-bold outline-none focus:border-primary/50 transition-colors"
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Wizard: Passo 2 — Tipo e Modalidade
// ────────────────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2">Passo 2 de 3</p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Como Vai Rolar?</h2>
        <p className="text-white/30 text-xs mt-1">Tipo de campo e formato da partida</p>
      </div>

      {/* Tipo de Campo */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Tipo de Campo</label>
        <div className="grid grid-cols-2 gap-3">
          {FIELD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...data, field_type: opt.value })}
              className={`relative border p-4 text-left transition-all duration-200 group
                ${data.field_type === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-black/30 hover:border-white/30'}`}
            >
              {data.field_type === opt.value && (
                <div className="absolute top-2 right-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-xs" />
                </div>
              )}
              <p className={`text-xs font-black uppercase tracking-wider ${data.field_type === opt.value ? 'text-primary' : 'text-white'}`}>
                {opt.label}
              </p>
              <p className="text-[20px] font-black text-white/80 my-1">{opt.sub}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase">{opt.players} jogadores</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Modalidade</label>
        <div className="space-y-2">
          {MODALITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...data, modality: opt.value })}
              className={`w-full flex items-center justify-between border p-4 text-left transition-all duration-200
                ${data.modality === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-black/30 hover:border-white/30'}`}
            >
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${data.modality === opt.value ? 'text-primary' : 'text-white'}`}>
                  {opt.label}
                </p>
                <p className="text-[9px] text-white/40 mt-0.5">{opt.desc}</p>
              </div>
              {data.modality === opt.value && (
                <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-sm shrink-0 ml-4" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Wizard: Passo 3 — Confirmação e Link
// ────────────────────────────────────────────────────────────────

function Step3({ data, group, matchId, onCopyLink }: {
  data: any; group: Group | null; matchId: string | null; onCopyLink: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [waCopied, setWaCopied] = useState(false);

  const confirmLink = matchId && group
    ? `${window.location.origin}/${group.slug}/register?matchId=${matchId}`
    : '';

  const waMessage = group
    ? `🟢 *${group.name}* — PARTIDA MARCADA!\n\n📅 ${data.date}\n⏰ ${data.start_time || '—'} às ${data.end_time || '—'}\n📍 ${data.location || 'Local a confirmar'}\n⚽ ${data.field_type} | ${data.modality}\n\nConfirme sua presença: ${confirmLink}`
    : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(confirmLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onCopyLink();
  };

  const shareWhatsApp = async () => {
    await navigator.clipboard.writeText(waMessage);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
    window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-2xl" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2">Passo 3 de 3</p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Partida Criada!</h2>
        <p className="text-white/30 text-xs mt-1">Agora convide os jogadores</p>
      </div>

      {/* Resumo */}
      <div className="border border-white/5 bg-black/30 p-5 space-y-3">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Resumo da Partida</h3>
        {[
          { label: 'Data', value: data.date ? new Date(data.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : '—' },
          { label: 'Horário', value: `${data.start_time || '—'} às ${data.end_time || '—'}` },
          { label: 'Local', value: data.location || '—' },
          { label: 'Formato', value: `${data.field_type} · ${data.modality}` },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[10px] text-white/30 font-bold uppercase">{item.label}</span>
            <span className="text-xs text-white font-bold capitalize">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Link de confirmação */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Link de Confirmação</label>
        <div className="bg-black/40 border border-primary/20 p-4 flex items-center gap-3">
          <span className="text-xs text-white/50 font-mono flex-1 truncate">{confirmLink || 'Gerando link...'}</span>
          <button
            onClick={copyLink}
            disabled={!confirmLink}
            className="text-primary font-black text-[10px] uppercase tracking-wider hover:text-white transition-colors disabled:opacity-30 shrink-0 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} />
            {copied ? 'COPIADO' : 'COPIAR'}
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <button
        onClick={shareWhatsApp}
        disabled={!confirmLink}
        className="w-full flex items-center justify-center gap-3 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-black uppercase text-[11px] tracking-widest py-4 hover:bg-[#25D366]/20 transition-colors disabled:opacity-30"
      >
        <FontAwesomeIcon icon={faWhatsapp} />
        {waCopied ? 'MENSAGEM COPIADA!' : 'Compartilhar no WhatsApp'}
      </button>

      <div className="border border-white/5 bg-black/20 p-4">
        <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider text-center">
          💡 Tip: Após os jogadores confirmarem, acesse a partida e clique em <span className="text-primary">Sortear Times</span>
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Página principal — Wizard
// ────────────────────────────────────────────────────────────────

export default function CreateMatchWizardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [step, setStep] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    field_type: 'Futsal 5x5' as FieldType,
    modality: 'Rachão' as Modality,
  });

  const matchRepo = new MatchRepository();
  const groupRepo = new GroupRepository();

  useEffect(() => {
    async function load() {
      const g = await groupRepo.findBySlug(slug);
      if (!g) { router.push('/404'); return; }
      setGroup(g);
    }
    load();
  }, [slug]);

  const isStep1Valid = Boolean(formData.date);
  const isStep2Valid = Boolean(formData.field_type && formData.modality);

  // Calcula duração em minutos baseado no horário
  const calcDuration = () => {
    if (!formData.start_time || !formData.end_time) return 60;
    const [sh, sm] = formData.start_time.split(':').map(Number);
    const [eh, em] = formData.end_time.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : 60;
  };

  const handleCreateMatch = async () => {
    if (!group) return;
    setSubmitting(true);
    try {
      const fieldPlayerMap: Record<string, number> = {
        'Futsal 5x5': 5, 'Society 6x6': 6, 'Society 7x7': 7, 'Campo 11x11': 11,
      };

      const match = await matchRepo.create({
        group_id: group.id,
        date: formData.date,
        location: formData.location,
        status: 'Agendada',
        home_score: 0,
        away_score: 0,
        timer_seconds: 0,
        match_fee: 0,
        duration_minutes: calcDuration(),
        stoppage_minutes: 0,
        goal_limit: 0,
        field_type: formData.field_type,
        modality: formData.modality,
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_players: fieldPlayerMap[formData.field_type] * 2,
      });

      setCreatedMatchId(match.id);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar partida. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 0 && isStep1Valid) setStep(1);
    else if (step === 1 && isStep2Valid) await handleCreateMatch();
  };

  const handleBack = () => {
    if (step > 0 && step < 2) setStep(s => s - 1);
    else router.back();
  };

  const STEPS = [
    <Step1 key="s1" data={formData} onChange={setFormData} />,
    <Step2 key="s2" data={formData} onChange={setFormData} />,
    <Step3 key="s3" data={formData} group={group} matchId={createdMatchId} onCopyLink={() => {}} />,
  ];

  const canAdvance = step === 0 ? isStep1Valid : step === 1 ? isStep2Valid : false;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/4 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-xl mx-auto px-4 py-10 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="text-white/40 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">
              {group?.name ?? 'Carregando...'}
            </p>
            <h1 className="text-lg font-black uppercase tracking-tighter text-white">Nova Partida</h1>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="flex gap-1 mb-10">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Card do wizard */}
        <div className="border border-white/5 bg-black/30 p-8">
          {STEPS[step]}
        </div>

        {/* Botões de navegação */}
        {step < 2 && (
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest py-4 hover:bg-white/5 transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance || submitting}
              className="flex-[2] flex items-center justify-center gap-2 bg-primary text-slate-950 font-black uppercase text-[11px] tracking-widest py-4 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'CRIANDO...' : step === 1 ? (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  CRIAR PARTIDA
                </>
              ) : (
                <>
                  PRÓXIMO
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Ação final — após criar */}
        {step === 2 && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.push(`/dashboard`)}
              className="flex-1 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest py-4 hover:bg-white/5 transition-colors"
            >
              Ver Dashboard
            </button>
            <button
              onClick={() => router.push(`/clube/${group?.id}`)}
              className="flex-1 bg-primary text-slate-950 font-black uppercase text-[10px] tracking-widest py-4 hover:bg-primary/90 transition-colors"
            >
              Ir ao Clube
            </button>
          </div>
        )}

        <p className="text-center mt-10 text-[9px] text-white/10 font-bold uppercase tracking-[0.5em]">
          PARTIDAS PRO © 2026
        </p>
      </div>
    </div>
  );
}
