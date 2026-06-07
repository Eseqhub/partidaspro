'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShieldHalved, faArrowRight, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { Group } from '@/core/entities/group';

export default function JoinGroupPage() {
  const [password, setPassword] = useState('');
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const groupRepo = new GroupRepository();

  useEffect(() => {
    async function loadGroup() {
      const groupData = await groupRepo.findBySlug(slug);
      if (!groupData) {
        router.push('/404');
        return;
      }

      // Se não tiver senha nem regras → pula direto para o registro
      if (!groupData.invite_password && !groupData.rules_text) {
        sessionStorage.setItem(`access_${groupData.id}`, 'true');
        router.push(`/${slug}/register`);
        return;
      }

      setGroup(groupData);
    }
    loadGroup();
  }, [slug, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasRules = !!group?.rules_text;
    if (hasRules && !acceptedRules) {
      setError('Você precisa aceitar as regras do clube para continuar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const matchId = new URLSearchParams(window.location.search).get('matchId');
      const nextStep = `/${slug}/register${matchId ? `?matchId=${matchId}` : ''}`;

      if (group?.invite_password) {
        const isValid = await groupRepo.verifyPassword(slug, password);
        if (isValid && group) {
          sessionStorage.setItem(`access_${group.id}`, 'true');
          router.push(nextStep);
        } else {
          setError('Senha de convite incorreta.');
        }
      } else if (group) {
        sessionStorage.setItem(`access_${group.id}`, 'true');
        router.push(nextStep);
      }
    } catch {
      setError('Erro ao verificar acesso.');
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Estação...</div>
      </div>
    );
  }

  const hasRules = !!(group.rules_text || group.estatuto_regras);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="max-w-xl w-full relative z-10">

        {/* Topo: escudo + nome (esquerda) | regras (direita) */}
        <div className="flex gap-4 mb-5 items-stretch">

          {/* Coluna esquerda: escudo + nome */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3 justify-center" style={{ minWidth: 90 }}>
            <div className="w-20 h-20 border border-primary/20 bg-black/40 p-1 flex items-center justify-center">
              {group.logo_url ? (
                <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-3xl" />
              )}
            </div>
            <div className="text-center">
              <p className="text-white font-black uppercase tracking-tight text-sm leading-tight">{group.name}</p>
              {group.founded_year && (
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Desde {group.founded_year}</span>
              )}
              <p className="text-[8px] font-bold text-primary/60 uppercase tracking-widest mt-1">.PRO</p>
            </div>
          </div>

          {/* Coluna direita: regras (sempre visíveis) */}
          {group.rules_text && (
            <div className="flex-1 min-w-0 bg-black/40 border border-white/8 p-4 flex flex-col gap-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 flex-shrink-0">
                <FontAwesomeIcon icon={faFileLines} className="text-[8px]" />
                Regras da Pelada
              </h3>
              <div
                className="text-white/50 text-[10px] font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto pr-1 flex-1"
                style={{ maxHeight: 180, scrollbarWidth: 'thin' }}
              >
                {group.rules_text}
              </div>
            </div>
          )}

          {/* Sem regras: só o nome centralizado */}
          {!group.rules_text && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Acesso Restrito ao Elenco</p>
            </div>
          )}
        </div>

        {/* Formulário */}
        <GlassCard className="p-6 border-primary/10">
          <form onSubmit={handleVerify} className="space-y-5">

            {/* Aceite das regras */}
            {hasRules && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={e => setAcceptedRules(e.target.checked)}
                  className="mt-0.5 w-4 h-4 flex-shrink-0 bg-black/40 border border-white/20 checked:bg-primary outline-none cursor-pointer"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors leading-relaxed">
                  Li e aceito o estatuto e as regras do {group.name}
                </span>
              </label>
            )}

            {/* Senha */}
            {group.invite_password && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  Senha de Convite
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="DIGITE A SENHA..."
                    className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors outline-none font-bold"
                    required
                  />
                </div>
              </div>
            )}

            {error && <p className="text-accent text-[10px] font-bold uppercase">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-5 text-slate-950 font-black uppercase tracking-widest text-sm"
              disabled={loading}
            >
              {loading ? 'VALIDANDO...' : 'ENTRAR NO TIME'}
              {!loading && <FontAwesomeIcon icon={faArrowRight} className="ml-3" />}
            </Button>
          </form>
        </GlassCard>

        <p className="text-center mt-8 text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">
          Partidas Pro &copy; 2026 | Sistema de Elite
        </p>
      </div>
    </div>
  );
}
