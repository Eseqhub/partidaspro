'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker para tornar o app instalável (PWA).
 * Não renderiza nada.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* falha silenciosa — PWA é progressivo */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
