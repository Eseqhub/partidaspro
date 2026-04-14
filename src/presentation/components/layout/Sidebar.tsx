'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGaugeHigh, 
  faFutbol, 
  faUsers, 
  faWallet, 
  faChartSimple,
  faGear
} from '@fortawesome/free-solid-svg-icons';

export function Sidebar() {
  const pathname = usePathname();
  // Extrair o slug da URL: /dashboard/[slug]/...
  const pathParts = pathname.split('/');
  const isInsideGroup = pathParts[1] === 'dashboard' && pathParts[2] && pathParts[2] !== 'finances' && pathParts[2] !== 'matches' && pathParts[2] !== 'players' && pathParts[2] !== 'stats';
  const slug = isInsideGroup ? pathParts[2] : '';

  const navItems = isInsideGroup ? [
    { label: 'Visão Geral', icon: faGaugeHigh, href: `/dashboard/${slug}` },
    { label: 'Partidas', icon: faFutbol, href: `/dashboard/${slug}/matches` },
    { label: 'Jogadores', icon: faUsers, href: `/dashboard/${slug}/players` },
    { label: 'Finanças', icon: faWallet, href: `/dashboard/${slug}/finances` },
    { label: 'Estatísticas', icon: faChartSimple, href: `/dashboard/${slug}/stats` },
  ] : [
    { label: 'Meus Clubes', icon: faGaugeHigh, href: '/dashboard' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0A0A0A] border-r border-[#222222] min-h-screen sticky top-0">
      <div className="p-8 border-b border-[#222222]">
        <h1 className="text-xl font-black tracking-tighter text-white uppercase">
          PARTIDAS<span className="text-primary italic">.PRO</span>
        </h1>
      </div>

      <nav className="flex-1 py-10 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 border border-transparent transition-all group ${
                isActive 
                  ? 'bg-primary/5 border-primary text-primary' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className={`w-5 ${isActive ? 'text-primary' : 'text-white/30 group-hover:text-white/60'}`} />
              <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-4 bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#222222]">
        <button className="flex items-center gap-4 px-4 py-3 text-white/30 hover:text-white transition-colors w-full">
            <FontAwesomeIcon icon={faGear} className="w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Configurações</span>
        </button>
      </div>
    </aside>
  );
}
