'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { supabase } from '@/infra/supabase/client';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faArrowRight, faCircleQuestion, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { LogoMark } from '@/presentation/components/ui/Logo';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode]         = useState<'login' | 'reset'>('login');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
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
            Portal do <span className="text-primary">Organizador</span>
          </h1>
          <p className="text-white/40 text-sm mt-2 font-bold uppercase tracking-widest">Partidas Pro</p>
        </div>

        <GlassCard className="p-8">

          {/* ── MODO LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  E-mail
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
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  Senha
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 p-4 pl-12 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors outline-none"
                    required
                  />
                </div>
                {error && <p className="text-red-400 text-[10px] mt-3 font-bold uppercase">{error}</p>}
              </div>

              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); }}
                  className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors"
                >
                  Esqueci minha senha →
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-5 text-slate-950 font-black uppercase tracking-widest text-sm"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
                {!loading && <FontAwesomeIcon icon={faArrowRight} className="ml-3" />}
              </Button>
            </form>
          )}

          {/* ── MODO RESET ── */}
          {mode === 'reset' && (
            resetSent ? (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/30 bg-primary/10 mb-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-3xl" />
                </div>
                <p className="text-white font-black uppercase tracking-wider text-sm">E-mail enviado!</p>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  Verifique <span className="text-white/80">{email}</span> e clique no link para redefinir sua senha.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setResetSent(false); }}
                  className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors"
                >
                  ← Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 leading-relaxed">
                    Digite seu e-mail e enviaremos um link para você criar uma nova senha.
                  </p>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                    E-mail cadastrado
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
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  {!loading && <FontAwesomeIcon icon={faArrowRight} className="ml-3" />}
                </Button>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Voltar ao login
                </button>
              </form>
            )
          )}

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              Ainda não tem conta?{' '}
              <Link href="/signup" className="text-primary hover:underline ml-1">
                Criar agora
              </Link>
            </p>
          </div>
        </GlassCard>

        <div className="text-center mt-8 space-y-3">
          <Link href="/faq" className="inline-block text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
            <FontAwesomeIcon icon={faCircleQuestion} className="mr-2" /> Como funciona?
          </Link>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
            Partidas Pro &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
