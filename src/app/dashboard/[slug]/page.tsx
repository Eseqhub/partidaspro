'use client';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faFutbol, 
  faChartLine, 
  faCircleDollarToSlot,
  faTowerBroadcast,
  faTerminal
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { GlassCard } from '@/presentation/components/ui/GlassCard';

import { useParams } from 'next/navigation';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { Group } from '@/core/entities/group';

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [group, setGroup] = React.useState<Group | null>(null);
  const groupRepo = new GroupRepository();

  React.useEffect(() => {
    async function load() {
      const data = await groupRepo.findBySlug(slug);
      setGroup(data);
    }
    load();
  }, [slug]);

  const modules = [
    {
      title: 'Atletas',
      description: 'Gestão de elenco, avaliações e mensalistas.',
      icon: faUsers,
      href: `/dashboard/${slug}/players`,
      data: 'Database Sync'
    },
    {
      title: 'Partidas',
      description: 'Controle em tempo real e súmula digital.',
      icon: faFutbol,
      href: `/dashboard/${slug}/matches`,
      data: 'Pronta para Início'
    },
    {
      title: 'Estatísticas',
      description: 'Analytics de performance e rankings.',
      icon: faChartLine,
      href: `/dashboard/${slug}/stats`,
      data: 'Breve'
    },
    {
      title: 'Caixa do Grupo',
      description: 'Fluxo financeiro e mensalidades.',
      icon: faCircleDollarToSlot,
      href: `/dashboard/${slug}/finances`,
      data: 'Breve'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Top System HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-primary/20 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Estação de Comando Ativa</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
            {group?.name || 'PARTIDA'}<span className="text-primary italic text-3xl md:text-5xl ml-2 uppercase">{group ? '.PRO' : 'CONTROLE'}</span>
          </h1>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/5 border border-white/10 p-3 text-right">
                <div className="text-[8px] uppercase text-white/40 font-bold mb-1">Status Rede</div>
                <div className="text-primary font-mono text-[10px] flex items-center justify-end gap-2">
                    <FontAwesomeIcon icon={faTowerBroadcast} className="text-[10px]" />
                    CONNECTED_STABLE
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 text-right">
                <div className="text-[8px] uppercase text-white/40 font-bold mb-1">Slug do Clube</div>
                <div className="text-white font-mono text-[10px] uppercase truncate">/{slug}</div>
            </div>
        </div>
      </div>

      {/* Main Grid Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        {modules.map((module, index) => (
          <Link key={index} href={module.href} className="group">
            <GlassCard className="h-full border-primary/10 hover:border-primary/40 transition-all p-6 bg-black/40">
              <div className="flex justify-between items-start mb-10">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                  <FontAwesomeIcon icon={module.icon} className="text-xl" />
                </div>
                <FontAwesomeIcon icon={faTerminal} className="text-[10px] text-white/20" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">{module.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  {module.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/20 uppercase tracking-widest">Data_Stream</span>
                    <span className="text-primary font-mono">{module.data}</span>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Recruitment & Invite Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-12">
        <GlassCard className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-primary/10" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                            <FontAwesomeIcon icon={faUsers} className="text-primary text-sm" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Recrutamento de Atletas</h2>
                    </div>
                    <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
                        Compartilhe o link abaixo com seus jogadores. Eles poderão criar seus cards personalizados de atleta e confirmar presença nas partidas automaticamente.
                    </p>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-3">
                    <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-none w-full md:w-96">
                        <input 
                            id="invite-link"
                            readOnly 
                            value={`${typeof window !== 'undefined' ? (window.location.origin.includes('localhost') ? 'https://partidas-pro.vercel.app' : window.location.origin) : 'https://partidas-pro.vercel.app'}/${slug}/join`}
                            className="bg-transparent border-none text-[10px] font-mono text-white/40 flex-1 px-4 outline-none"
                        />
                        <button 
                            onClick={() => {
                                const link = (document.getElementById('invite-link') as HTMLInputElement).value;
                                navigator.clipboard.writeText(link);
                                alert('Link de Convite copiado!');
                            }}
                            className="bg-primary text-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                        >
                            COPIAR LINK
                        </button>
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-primary/40 text-right">
                        Sua senha de convite: <span className="text-white ml-1">{group?.invite_password || 'PÚBLICO (SEM SENHA)'}</span>
                    </div>
                </div>
            </div>
        </GlassCard>
      </div>

      {/* Footer Activity Feed (Placeholder Aesthetic) */}
      <div className="mt-12 p-6 border border-white/5 bg-black/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-2 bg-primary/20" />
            <div className="flex items-center gap-4 mb-4 opacity-40">
                <FontAwesomeIcon icon={faTerminal} className="text-[10px]" />
                <span className="text-[8px] uppercase font-black tracking-[0.4em]">Recent_Activity_Log</span>
            </div>
            <div className="space-y-3 font-mono text-[10px] text-white/30">
                <div className="flex gap-4"><span className="text-primary/50">[12:44:09]</span> MATCH_SESSION_STARTED {"{"}ID: #0412{"}"} BY USER_ADMIN</div>
                <div className="flex gap-4"><span className="text-primary/50">[12:45:21]</span> PLAYER_JOINED_MATCH {"{"}PLAYER: DIEGO{"}"} TEAM_B</div>
                <div className="flex gap-4"><span className="text-primary/50">[12:48:12]</span> FINANCIAL_RECORD_LOGGED {"{"}VAL: R$50.00{"}"} CAT: MENSALIDADE</div>
            </div>
      </div>
    </div>
  );
}

