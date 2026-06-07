'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { supabase } from '@/infra/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMagicWandSparkles, faCheckCircle, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { LogoMark } from '@/presentation/components/ui/Logo';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/[0.07] border border-primary/20 mb-6">
            <LogoMark size={52} />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Crie seu <span className="text-primary">Clube</span>
          </h1>
          <p className="text-white/40 text-sm mt-2 font-bold uppercase tracking-widest">Partidas Pro — sem senha, sem complicação</p>
        </div>

        <GlassCard className="p-8">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/30 bg-primary/10 mb-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-3xl" />
              </div>
              <p className="text-white font-black uppercase tracking-wider text-sm">Link enviado!</p>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Verifique o e-mail <span className="text-white/80">{email}</span> e clique no link para acessar o app.
              </p>
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest">
                Você já estará logado ao clicar — sem precisar de senha.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors mt-2"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="p-4 border border-primary/20 bg-primary/5 text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Acesso por link mágico</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                  Sem senha. Você recebe um link no e-mail e já entra direto.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  Seu e-mail
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-black/40 border border-white/10 p-4 pl-12 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors outline-none font-bold"
                    required
                  />
                </div>
                {error && <p className="text-red-400 text-[10px] mt-3 font-bold uppercase">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-5 text-slate-950 font-black uppercase tracking-widest text-sm"
                disabled={loading}
              >
                {loading ? 'Enviando link...' : 'Criar conta e receber link'}
                {!loading && <FontAwesomeIcon icon={faMagicWandSparkles} className="ml-3" />}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              Já tem conta?{' '}
              <Link href="/login" className="text-primary hover:underline ml-1">
                Entrar agora
              </Link>
            </p>
          </div>
        </GlassCard>

        <div className="text-center mt-8 space-y-3">
          <Link href="/faq" className="inline-block text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
            <FontAwesomeIcon icon={faCircleQuestion} className="mr-2" /> Como funciona? Central de Ajuda
          </Link>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
            Partidas Pro &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
