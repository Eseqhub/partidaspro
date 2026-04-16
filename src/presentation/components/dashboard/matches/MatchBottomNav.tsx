import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, 
  faStopwatch, 
  faFutbol, 
  faUserGroup, 
  faGear 
} from '@fortawesome/free-solid-svg-icons';

export interface Tab {
  id: string;
  label: string;
  icon: any;
  hidden?: boolean;
}

interface MatchBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  tabs: Tab[];
  waitingCount?: number;
}

export const MatchBottomNav: React.FC<MatchBottomNavProps> = ({ 
  activeTab, 
  setActiveTab, 
  tabs,
  waitingCount = 0
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:relative md:bottom-auto md:z-0">
      {/* Container com Blur e Gradiente */}
      <div className="bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 px-2 pb-safe pt-2 md:bg-transparent md:backdrop-blur-none md:border-none md:p-0">
        <div className="flex items-center justify-around max-w-4xl mx-auto md:justify-start md:gap-1 md:border md:border-white/10 md:bg-black/20 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-1 py-2 px-3 transition-all relative flex-1 min-w-[64px]
                md:flex-row md:py-3 md:px-6 md:min-w-0 md:hover:bg-white/5
                ${activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-white/40 hover:text-white/60'
                }
              `}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-xl transition-all
                md:w-auto md:h-auto md:rounded-none
                ${activeTab === tab.id ? 'bg-primary/10 md:bg-transparent shadow-[0_0_15px_rgba(204,255,0,0.1)]' : ''}
              `}>
                <FontAwesomeIcon icon={tab.icon} className="text-sm md:text-xs" />
              </div>
              
              <span className="text-[9px] font-black uppercase tracking-widest md:text-[10px]">
                {tab.label}
              </span>

              {/* Indicador de Tab Ativa (Desktop) */}
              {activeTab === tab.id && (
                <div className="hidden md:block absolute -top-px left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
              )}
              
              {/* Badge para Espera */}
              {tab.id === 'next' && waitingCount > 0 && (
                <div className="absolute top-1 right-2 md:top-2 md:right-2 w-4 h-4 bg-orange-500 text-[9px] font-black flex items-center justify-center text-black rounded-full shadow-lg">
                  {waitingCount}
                </div>
              )}

              {/* Efeito de Gradiente na Tab Ativa (Mobile) */}
              {activeTab === tab.id && (
                <div className="md:hidden absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full blur-[2px]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
