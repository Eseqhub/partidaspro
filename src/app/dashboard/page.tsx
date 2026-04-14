'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { supabase } from '@/infra/supabase/client';
import { Group } from '@/core/entities/group';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShieldHalved, faUsers, faArrowRight, faCrown } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

import { CreateGroupModal } from '@/presentation/components/dashboard/CreateGroupModal';

export default function DashboardLobby() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  
  const router = useRouter();
  const groupRepo = new GroupRepository();

  const loadLobby = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setOwnerId(user.id);
    setUserName(user.email?.split('@')[0] || 'Organizador');
    
    // Checar se é o Super Admin (Você)
    if (user.email === 'eseqmotion@gmail.com') {
      setIsAdmin(true);
    }

    const userGroups = await groupRepo.findAllByOwner(user.id);
    setGroups(userGroups);
    setLoading(false);
  };

  useEffect(() => {
    loadLobby();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-primary text-sm font-black uppercase tracking-widest animate-pulse">
          Carregando seus Clubes...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 border-b border-white/5 pb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
            MEUS<span className="text-primary italic ml-2">CLUBES</span>
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">
            Olá, {userName}. Gerencie seus grupos de elite.
          </p>
        </div>

        <div className="flex gap-4">
            {isAdmin && (
                <Link href="/admin">
                    <Button variant="glass" className="px-6 py-3 border-accent/20 text-accent">
                        <FontAwesomeIcon icon={faCrown} className="mr-2" /> DATA MASTER
                    </Button>
                </Link>
            )}
            <Button variant="primary" className="px-6 py-3" onClick={() => setIsModalOpen(true)}>
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> FUNDAR NOVO CLUBE
            </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <GlassCard className="p-16 text-center bg-black/40 border-white/5">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon icon={faShieldHalved} className="text-white/20 text-3xl" />
            </div>
            <h2 className="text-xl font-black text-white uppercase mb-2">Você ainda não tem clubes</h2>
            <p className="text-white/40 text-sm mb-10 max-w-sm mx-auto">Comece agora mesmo a gerenciar suas partidas profissionais criando seu primeiro grupo.</p>
            <Button variant="primary" className="px-10 py-4 uppercase font-black tracking-widest text-xs" onClick={() => setIsModalOpen(true)}>
                Criar Meu Primeiro Clube
            </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.map((group) => (
                <Link key={group.id} href={`/dashboard/${group.slug}`}>
                    <GlassCard className="group hover:border-primary/40 transition-all p-8 relative overflow-hidden bg-black/60">
                        {/* Club Logo Placeholder */}
                        <div className="flex items-center gap-6 mb-8 relative z-10">
                            <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center rounded-none group-hover:border-primary/50 transition-colors">
                                {group.logo_url ? (
                                    <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
                                ) : (
                                    <FontAwesomeIcon icon={faShieldHalved} className="text-white/20 text-2xl group-hover:text-primary transition-colors" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{group.name}</h3>
                                <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                                    <FontAwesomeIcon icon={faUsers} className="text-[8px]" />
                                    Ativo desde {new Date(group.created_at).getFullYear()}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                            <span>Slug: /{group.slug}</span>
                            <span className="group-hover:text-primary transition-colors">GERENCIAR <FontAwesomeIcon icon={faArrowRight} className="ml-1" /></span>
                        </div>
                        
                        {/* Aesthetic HUD Line */}
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 group-hover:bg-primary/40 transition-all" />
                    </GlassCard>
                </Link>
            ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">
                PARTIDAS.PRO <span className="text-primary/40 italic ml-2">MULTI-TENANT_V3_PLATFORM</span>
            </div>
            <div className="flex gap-4">
                <Button variant="glass" className="text-[8px] px-4 py-2 border-white/5" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
                    SAIR DA CONTA
                </Button>
            </div>
      </div>

      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadLobby}
        ownerId={ownerId}
      />
    </div>
  );
}
