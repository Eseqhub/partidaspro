'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { AdminRepository } from '@/infra/repositories/AdminRepository';
import { supabase } from '@/infra/supabase/client';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCrown, 
  faUsers, 
  faShieldHalved, 
  faFutbol, 
  faArrowLeft,
  faChartPie,
  faNetworkWired
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function AdminPage() {
  const [stats, setStats] = useState({ groupsCount: 0, playersCount: 0, activeMatchesCount: 0 });
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();
  const adminRepo = new AdminRepository();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== 'eseqmotion@gmail.com') {
        setAccessDenied(true);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      const globalStats = await adminRepo.getGlobalStats();
      const allGroups = await adminRepo.getAllGroups();
      
      setStats(globalStats);
      setGroups(allGroups);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <FontAwesomeIcon icon={faShieldHalved} className="text-accent text-5xl mb-6 animate-pulse" />
        <h1 className="text-white font-black uppercase tracking-widest text-sm">Acesso Restrito ao Master Admin</h1>
        <p className="text-white/20 text-[10px] mt-2 uppercase tracking-widest">Redirecionando para área segura...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          Sincronizando Plataforma Global...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-6">
                <Link href="/dashboard">
                    <button className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faCrown} className="text-primary text-[10px]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Master Admin Console</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">PARTIDAS<span className="text-primary italic">.PRO</span></h1>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 px-6 py-4 flex items-center gap-4">
                <div className="w-2 h-2 bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Status: Global Monitoring Active</span>
            </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <GlassCard className="p-8 border-primary/10">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <FontAwesomeIcon icon={faNetworkWired} />
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase">Module: SaaS_Groups</span>
                </div>
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Total de Clubes</h3>
                <p className="text-5xl font-black text-white mt-2">{stats.groupsCount}</p>
            </GlassCard>

            <GlassCard className="p-8 border-primary/10">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase">Module: Database_Players</span>
                </div>
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Atletas Registrados</h3>
                <p className="text-5xl font-black text-white mt-2">{stats.playersCount}</p>
            </GlassCard>

            <GlassCard className="p-8 border-accent/10">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-accent/10 flex items-center justify-center border border-accent/20 text-accent">
                        <FontAwesomeIcon icon={faFutbol} />
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase">Module: Realtime_Live</span>
                </div>
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Partidas em Curso</h3>
                <p className="text-5xl font-black text-white mt-2">{stats.activeMatchesCount}</p>
            </GlassCard>
        </div>

        {/* Global Groups List */}
        <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
             <FontAwesomeIcon icon={faChartPie} className="text-primary text-sm" /> Clubes na Malha
        </h2>
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 bg-white/5">
                        <th className="p-4 text-left">Escudo</th>
                        <th className="p-4 text-left">Nome do Clube</th>
                        <th className="p-4 text-left">URL (Slug)</th>
                        <th className="p-4 text-left">Organizador</th>
                        <th className="p-4 text-left">Fundação</th>
                        <th className="p-4 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {groups.map((group) => (
                        <tr key={group.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4">
                                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {group.logo_url ? (
                                        <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <FontAwesomeIcon icon={faShieldHalved} className="text-white/10" />
                                    )}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-bold uppercase tracking-tight text-white">{group.name}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-[10px] font-mono text-primary italic">/{group.slug}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-[10px] font-bold text-white/40 uppercase">{group.owner_id.substring(0, 8)}...</div>
                            </td>
                            <td className="p-4">
                                <div className="text-[10px] font-bold text-white/20 uppercase">{new Date(group.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="p-4 text-right">
                                <Link href={`/dashboard/${group.slug}`}>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all">VISUALIZAR</button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
