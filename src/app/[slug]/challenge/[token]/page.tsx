'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, faCheckCircle, faTimesCircle, 
  faCalendarDay, faClock, faMapPin, faShieldHalved,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { Match } from '@/core/entities/match';
import { Group } from '@/core/entities/group';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';

const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';

export default function ChallengeAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [hostGroup, setHostGroup] = useState<Group | null>(null);
  const [awayTeamName, setAwayTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  const matchRepo = new MatchRepository();
  const groupRepo = new GroupRepository();

  useEffect(() => {
    async function loadChallenge() {
      try {
        const foundMatch = await matchRepo.findByToken(token);
        if (!foundMatch) {
          setErrorObj('Desafio não encontrado ou token inválido.');
          return;
        }
        
        const group = await groupRepo.findBySlug(slug);
        if (!group || group.id !== foundMatch.group_id) {
          setErrorObj('Inconsistência nos dados do clube desafiante.');
          return;
        }

        setMatch(foundMatch);
        setHostGroup(group);
      } catch (err) {
        setErrorObj('Erro ao carregar os dados do desafio.');
      } finally {
        setLoading(false);
      }
    }
    loadChallenge();
  }, [slug, token]);

  const handleAccept = async () => {
    if (!awayTeamName.trim()) {
      alert('Por favor, informe o nome do seu time!');
      return;
    }
    setSubmitting(true);
    try {
      const updatedMatch = await matchRepo.acceptChallenge(token, awayTeamName);
      if (updatedMatch) {
        setMatch(updatedMatch);
      } else {
        alert('Falha ao confirmar o desafio. Pode já ter sico preenchido.');
      }
    } catch (err) {
      alert('Erro inesperado ao aceitar o jogo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-inter">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary" />
      </div>
    );
  }

  if (errorObj || !match || !hostGroup) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-inter">
        <FontAwesomeIcon icon={faTimesCircle} className="text-6xl text-red-500 mb-6" />
        <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-2 text-center">Desafio Inválido</h1>
        <p className="text-sm font-bold text-white/40 text-center max-w-sm">{errorObj || 'Não conseguimos localizar este convite.'}</p>
      </div>
    );
  }

  // Se o desafio já foi aceito
  if (match.challenge_status === 'aceito') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-inter">
        <GlassCard className="w-full max-w-md p-8 sm:p-12 text-center border-primary/20">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary border-dashed flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(204,255,0,0.2)]">
            <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-primary" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-4 italic">Desafio Fechado!</h1>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-8">
            O desafio proposto pelo <strong className="text-white">{hostGroup.name}</strong> já foi aceito pelo time <strong className="text-primary">{match.away_team_name}</strong>. A partida já está agendada!
          </p>
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-left">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Detalhes do Jogo</h3>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white"><FontAwesomeIcon icon={faCalendarDay} className="text-white/20 w-4 mr-2" /> {new Date(match.date).toLocaleDateString('pt-BR')} ({(match as any).start_time} - {(match as any).end_time})</p>
              <p className="text-[11px] font-bold text-white"><FontAwesomeIcon icon={faMapPin} className="text-white/20 w-4 mr-2" /> {(match as any).location || 'Local a definir'}</p>
              <p className="text-[11px] font-bold text-white"><FontAwesomeIcon icon={faShieldHalved} className="text-white/20 w-4 mr-2" /> {match.home_team_name} vs {match.away_team_name}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Tela principal: Pendente
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-8 font-inter relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#d4a017] opacity-10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary opacity-5 blur-[100px] rounded-full" />
      </div>

      <GlassCard className="w-full max-w-lg p-1 sm:p-2 border-primary/20 z-10 relative shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        <div className="bg-slate-950/80 p-6 sm:p-10 rounded-[20px]">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-full mb-6">
              <FontAwesomeIcon icon={faTrophy} className="text-3xl text-amber-400" />
            </div>
            <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] mb-2">Convite Oficial</h3>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">
              Você foi desafiado!
            </h1>
          </div>

          {/* Info do Mandante */}
          <div className="mb-10 text-center">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">O CLUBE</p>
            <div className="flex items-center justify-center gap-4">
              {hostGroup.logo_url ? (
                <img src={hostGroup.logo_url} alt="Logo" className="w-12 h-12 rounded-full border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-white/20" />
                </div>
              )}
              <h2 className="text-xl font-black text-white uppercase tracking-widest">{hostGroup.name}</h2>
            </div>
            <p className="text-[10px] uppercase font-bold text-white/40 mt-3 tracking-widest">
              convocou a sua equipe para um duelo amistoso.
            </p>
          </div>

          {/* Detalhes da Partida */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] mb-2"><FontAwesomeIcon icon={faCalendarDay} /> Data</p>
              <p className="text-sm font-black text-white">{new Date(match.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] mb-2"><FontAwesomeIcon icon={faClock} /> Horário</p>
              <p className="text-sm font-black text-white">{(match as any).start_time} - {(match as any).end_time}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl col-span-2">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] mb-2"><FontAwesomeIcon icon={faMapPin} /> Local & Campo</p>
              <p className="text-sm font-black text-white">{(match as any).location}</p>
              <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest">{match.field_type ?? match.sport_type}</p>
            </div>
          </div>

          {/* Form de Aceite */}
          <div className="border-t border-white/10 pt-8 mt-4">
            <label className="block text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-4">
              Qual o nome da sua equipe?
            </label>
            <input 
              type="text"
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              placeholder="Ex: Real Madrid Amadores..."
              className="w-full bg-black/50 border border-white/10 p-5 text-sm text-white font-black uppercase tracking-widest outline-none focus:border-primary/50 transition-colors mb-6 rounded-xl"
            />

            <Button 
              onClick={handleAccept}
              disabled={submitting || !awayTeamName.trim()}
              className="w-full py-6 text-sm font-black uppercase tracking-[0.3em] bg-gradient-to-r from-amber-500 to-amber-300 text-black border-none hover:scale-[1.02] transition-transform rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'ACEITAR DESAFIO PRO'}
            </Button>
            <p className="text-center text-[9px] font-bold text-white/30 uppercase tracking-widest mt-4">
              Ao aceitar, o duelo será confirmado no sistema do mandante.
            </p>
          </div>

        </div>
      </GlassCard>
    </div>
  );
}
