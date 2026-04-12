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
  faChartSimple 
} from '@fortawesome/free-solid-svg-icons';

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Início', icon: faGaugeHigh, href: '/dashboard' },
    { label: 'Jogos', icon: faFutbol, href: '/dashboard/matches' },
    { label: 'Atletas', icon: faUsers, href: '/dashboard/players' },
    { label: 'Finanças', icon: faWallet, href: '/dashboard/finances' },
    { label: 'Stats', icon: faChartSimple, href: '/dashboard/stats' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#222222] z-50 px-2 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-white/40'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg" />
              <span className="text-[10px] uppercase font-bold tracking-tighter">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-[2px] bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
