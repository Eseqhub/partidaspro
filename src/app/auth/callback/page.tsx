'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleAuth() {
      const code = searchParams.get('code');
      const inviteClub = searchParams.get('invite_club');

      if (code) {
        // Troca o código pela sessão
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error && data.user && inviteClub) {
          // Lógica de convite automático após sucesso
          await supabase.from('group_members').insert({
            group_id: inviteClub,
            user_id: data.user.id,
            role: 'member' // ou 'athlete' dependendo da estrutura
          }).select().maybeSingle();
        }
      }

      // Redireciona de qualquer forma para o dashboard
      router.push('/dashboard');
    }

    handleAuth();
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <h1 className="text-white font-black uppercase tracking-widest text-sm">Autenticando...</h1>
      <p className="text-white/40 text-[10px] mt-2 uppercase">Por favor, aguarde</p>
      
      <Suspense fallback={null}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
