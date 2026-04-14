'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { supabase } from '@/infra/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faShieldHalved, faFutbol } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check current session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-black transition-all">
            <FontAwesomeIcon icon={faFutbol} className="text-xl" />
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">
            Partidas<span className="text-primary group-hover:text-white transition-colors">.Pro</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">Clubes</Link>
          <Link href="/#faq" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">Suporte</Link>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">Acesso Ativo</span>
                    <span className="text-[10px] font-bold text-white/60 lowercase">{user.email}</span>
                </div>
                <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />
                <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center w-10 h-10 border border-white/10 bg-white/5 text-white/40 hover:text-accent hover:border-accent/40 transition-all"
                    title="Sair da Conta"
                >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Entrar</Link>
                <Button 
                    href="/signup" 
                    variant="primary"
                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-950"
                >
                    Começar Agora
                </Button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
