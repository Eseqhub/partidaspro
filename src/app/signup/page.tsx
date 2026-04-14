'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { supabase } from '@/infra/supabase/client';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faArrowRight, faShield } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Detectar URL base para redirecionamento
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://partidas-pro.vercel.app';
      const redirectTo = `${origin}/auth/callback`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectTo,
        }
      });

      if (error) throw error;
      alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-6 relative">
                 <FontAwesomeIcon icon={faShield} className="text-primary text-3xl" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Crie seu <span className="text-primary italic">Clube</span></h1>
            <p className="text-white/40 text-sm mt-2 font-bold uppercase tracking-widest">Inicie sua plataforma Partidas Pro hoje</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                E-mail Professional
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: organizador@partidas.pro"
                  className="w-full bg-black/40 border border-white/10 p-4 pl-12 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors outline-none font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                Sua Senha Mestra
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 p-4 pl-12 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors outline-none"
                  required
                />
              </div>
              {error && <p className="text-accent text-[10px] mt-3 font-bold uppercase">{error}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-5 text-slate-950 font-black uppercase tracking-widest text-sm"
              disabled={loading}
            >
              {loading ? 'Inicializando...' : 'Fundar meu Legado Grátis'}
              {!loading && <FontAwesomeIcon icon={faArrowRight} className="ml-3" />}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              Já faz parte da elite?{' '}
              <Link href="/login" className="text-primary hover:underline ml-1">
                Entrar agora
              </Link>
            </p>
          </div>
        </GlassCard>

        <p className="text-center mt-8 text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
          Partidas Pro &copy; 2026 | Gestão de Elite
        </p>
      </div>
    </div>
  );
}
