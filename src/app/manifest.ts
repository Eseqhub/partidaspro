import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Partidas Pro — Gestão de Peladas',
    short_name: 'Partidas Pro',
    description: 'Sorteio inteligente de times, placar ao vivo, estatísticas e gestão da sua pelada.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020810',
    theme_color: '#050e1f',
    lang: 'pt-BR',
    categories: ['sports', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
