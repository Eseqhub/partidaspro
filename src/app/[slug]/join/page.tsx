'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShieldHalved, faArrowRight } from '@fortawesome/free-solid-svg-icons';
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
        
        // Se o grupo não tiver senha nem regras, pula direto para o registro
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
    if (group?.rules_text && !acceptedRules) {
        setError('Você precisa aceitar as regras do clube para continuar.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      if (group?.invite_password) {
          const isValid = await groupRepo.verifyPassword(slug, password);
          if (isValid && group) {
            sessionStorage.setItem(`access_${group.id}`, 'true');
            router.push(`/${slug}/register`);
          } else {
            setError('Senha de convite incorreta.');
          }
      } else if (group) {
          // Só tinha estatuto para aceitar
          sessionStorage.setItem(`access_${group.id}`, 'true');
          router.push(`/${slug}/register`);
      }
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-none border border-primary/20 bg-black/40 mb-6 p-1">
                {group.logo_url ? (
                    <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                    <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-3xl" />
                )}
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                {group.name}<span className="text-primary italic">.PRO</span>
            </h1>
            <p className="text-white/40 text-[10px] mt-2 font-bold uppercase tracking-widest">Acesso Restrito ao Elenco</p>
        </div>

        <GlassCard className="p-8 border-primary/10">
          <form onSubmit={handleVerify} className="space-y-6">
            {group.rules_text && (
              <div className="bg-black/40 border border-white/10 p-4 rounded text-left">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faShieldHalved}/> Estatuto e Regras</h3>
                  <div className="text-white/60 text-xs h-32 overflow-y-auto pr-2 mb-4 whitespace-pre-wrap font-mono">
                      {group.rules_text}
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                          type="checkbox" 
                          checked={acceptedRules} 
                          onChange={(e) => setAcceptedRules(e.target.checked)}
                          className="w-4 h-4 bg-black/40 border border-white/20 checked:bg-primary outline-none"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Li e aceito incondicionalmente as regras</span>
                  </label>
              </div>
            )}

            {group.invite_password && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                Senha de Convite do Clube
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="DIGITE A SENHA..."
                  className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors outline-none font-bold"
                  required={!!group.invite_password}
                />
              </div>
              {error && <p className="text-accent text-[10px] mt-3 font-bold uppercase">{error}</p>}
            </div>
            )}

            {!group.invite_password && error && <p className="text-accent text-[10px] mt-3 font-bold uppercase text-center">{error}</p>}

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

        <p className="text-center mt-12 text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">
          Partidas Pro &copy; 2026 | Sistema de Elite
        </p>
      </div>
    </div>
  );
}
