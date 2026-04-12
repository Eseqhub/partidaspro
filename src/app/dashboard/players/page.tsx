'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { PlayerCard } from '@/presentation/components/dashboard/PlayerCard';
import { Player } from '@/core/entities/player';
import { Button } from '@/presentation/components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faMagnifyingGlass, 
  faFilter,
  faAddressCard,
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { AddPlayerModal } from '@/presentation/components/dashboard/AddPlayerModal';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const playerRepo = new PlayerRepository();
  const groupId = '00000000-0000-0000-0000-000000000001'; // ID de teste fixo para bater com o Seed

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await playerRepo.findAllByGroupId(groupId);
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleCreatePlayer = async (newPlayerData: Omit<Player, 'id' | 'created_at'>) => {
    try {
      await playerRepo.create(newPlayerData);
      await fetchPlayers();
      setIsModalOpen(false);
    } catch (err) {
      alert('Erro ao criar jogador. Tente novamente.');
      console.error(err);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FontAwesomeIcon icon={faAddressCard} className="text-primary text-[10px]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Database Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            ATLETAS <span className="text-primary italic opacity-50 text-2xl md:text-3xl ml-2 tracking-normal">[{players.length}]</span>
          </h1>
        </div>
        <div className="flex gap-3">
            <Button 
                onClick={fetchPlayers}
                className="font-black uppercase tracking-widest text-[10px] py-4 px-6 bg-white/5 text-white/40 hover:text-white transition-all border-none"
            >
                <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button 
                onClick={() => setIsModalOpen(true)}
                className="font-black uppercase tracking-widest text-[10px] py-4 px-8 bg-primary text-black hover:bg-primary/80 transition-all gap-3 border-none"
            >
                <FontAwesomeIcon icon={faPlus} /> REGISTRAR NOVO
            </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
            <FontAwesomeIcon icon={faMagnifyingGlass} size="sm" />
          </div>
          <input 
            type="text" 
            placeholder="LOCALIZAR ATLETA..."
            className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all uppercase tracking-widest placeholder:text-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all font-black uppercase text-[10px] tracking-widest">
          <FontAwesomeIcon icon={faFilter} className="text-xs" /> FILTROS AVANÇADOS
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Acessando Database...</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map(player => (
                <PlayerCard key={player.id} player={player} />
                ))}
            </div>

            {filteredPlayers.length === 0 && (
                <GlassCard className="py-24 text-center border-dashed border-white/10">
                    <FontAwesomeIcon icon={faAddressCard} className="mx-auto mb-6 text-white/5 text-5xl" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Nenhum registro encontrado para critério: "{search}"</p>
                </GlassCard>
            )}
        </>
      )}

      {/* FAB Mobile (HUD Version) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all md:hidden z-40"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>

      <AddPlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCreatePlayer}
        groupId={groupId}
      />
    </div>
  );
}

