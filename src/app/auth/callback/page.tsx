'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleAuth() {
      // PKCE flow: ?code=... (magic link, password reset, etc.)
      const code = searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        router.replace('/dashboard');
        return;
      }

      // Hash fragment flow: #access_token=... (magic link legado)
      if (typeof window !== 'undefined' && window.location.hash) {
        // O Supabase JS v2 detecta o hash automaticamente via onAuthStateChange
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace('/dashboard');
          return;
        }
        // Aguarda o cliente processar o hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN') {
            subscription.unsubscribe();
            router.replace('/dashboard');
          }
        });
        return;
      }

      // Sem código nem hash — volta para login
      router.replace('/login');
    }

    handleAuth();
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-white font-black uppercase tracking-widest text-sm">Autenticando...</h1>
      <p className="text-white/40 text-[10px] mt-2 uppercase tracking-widest">Só um segundo</p>
      <Suspense fallback={null}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
