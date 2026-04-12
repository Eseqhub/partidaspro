'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Scoreboard } from '@/presentation/components/dashboard/Scoreboard';
import { PlayerCard } from '@/presentation/components/dashboard/PlayerCard';
import { Player } from '@/core/entities/player';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { AttendanceList } from '@/presentation/components/dashboard/AttendanceList';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { DraftService, DraftResult } from '@/core/services/DraftService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, 
  faStopwatch, 
  faUserGroup, 
  faShuffle,
  faCircle,
  faRotateRight,
  faUserSlash
} from '@fortawesome/free-solid-svg-icons';
import { AudioService } from '@/infra/services/AudioService';

export default function MatchPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'match' | 'next' | 'settings'>('attendance');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState<'Em curso' | 'Pausada' | 'Finalizada'>('Pausada');
  
  // Configurações da Partida
  const [config, setConfig] = useState({
    duration: 10, // minutos
    stoppage: 0,
    goalLimit: 0,
    homeColor: 'Branco',
    awayColor: 'Preto'
  });

  const playerRepo = new PlayerRepository();
  const draftService = new DraftService();
  const audioService = new AudioService();
  const groupId = '00000000-0000-0000-0000-000000000001';

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await playerRepo.findAllByGroupId(groupId);
      setAllPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    let interval: any;
    if (status === 'Em curso') {
      interval = setInterval(() => {
        setTimer(prev => {
          const nextValue = prev + 1;
          const limitSeconds = (config.duration + config.stoppage) * 60;
          const remaining = limitSeconds - nextValue;

          // Lógica de Alarmes Sonoros
          if (remaining === 0) {
            audioService.playEndAlarm();
            setStatus('Finalizada');
            return limitSeconds;
          }

          // Bip a cada 10s no último minuto
          if (remaining < 60 && remaining > 10 && remaining % 10 === 0) {
            audioService.playBip(440, 0.1);
          }

          // Bip a cada 1s nos últimos 10s
          if (remaining <= 10 && remaining > 0) {
            audioService.playBip(880, 0.1);
          }

          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, config]);

  const togglePlayerAttendance = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleDraft = () => {
    if (selectedPlayerIds.length < 2) {
      alert('Selecione ao menos 2 jogadores para o sorteio.');
      return;
    }
    const selectedPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
    const result = draftService.balanceTeams(selectedPlayers);
    setDraftResult(result);
    setActiveTab('match');
  };

  const tabs = [
    { id: 'attendance', label: 'Chamada', icon: faListCheck },
    { id: 'match', label: 'Partida', icon: faStopwatch },
    { id: 'next', label: 'Espera', icon: faUserGroup },
    { id: 'settings', label: 'Config', icon: faRotateRight }, // Ícone para configurações
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-24">
      <Scoreboard 
        homeScore={score.home}
        awayScore={score.away}
        homeTeamName="Time A"
        awayTeamName="Time B"
        homeColor={config.homeColor}
        awayColor={config.awayColor}
        timer={timer}
        status={status}
        onToggleTimer={() => setStatus(s => s === 'Em curso' ? 'Pausada' : 'Em curso')}
        onStopMatch={() => setStatus('Pausada')}
        onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
      />

      {/* HUD Tabs */}
      <div className="flex border border-white/10 mb-8 bg-black/20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-3 py-4 transition-all relative ${
              activeTab === tab.id 
                ? 'bg-primary text-black' 
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-sm md:text-base" />
            <span className="font-black uppercase text-[10px] md:text-xs tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
                <div className="absolute -top-1 left-0 right-0 flex justify-center">
                    <div className="w-1 h-1 bg-white" />
                </div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'settings' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faRotateRight} className="text-primary" /> Configurações da Partida
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Duração (Minutos)</label>
                <input 
                  type="number" 
                  value={config.duration}
                  onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Acréscimos (Minutos)</label>
                <input 
                  type="number" 
                  value={config.stoppage}
                  onChange={(e) => setConfig({...config, stoppage: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Limite de Gols (0 = sem limite)</label>
                <input 
                  type="number" 
                  value={config.goalLimit}
                  onChange={(e) => setConfig({...config, goalLimit: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Senha de Acesso ao Grupo</label>
                <input 
                  type="text" 
                  placeholder="GERAR SENHA..."
                  className="w-full bg-black/20 border border-primary/20 p-3 text-primary font-bold focus:border-primary/40 outline-none uppercase"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
               Financeiro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Valor por Pelada (R$)</label>
                <input 
                  type="number" 
                  placeholder="20.00"
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Chave PIX para Recebimento</label>
                <input 
                  type="text" 
                  placeholder="E-MAIL, CPF OU ALEATÓRIA"
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
            </div>
          </GlassCard>
          
          <div className="flex justify-end">
            <Button variant="primary" className="px-8 py-3 uppercase font-black tracking-widest text-xs">
                Salvar Configurações
            </Button>
          </div>
        </div>
      )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.3em]">Lista de Presentes</h2>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">{selectedPlayerIds.length} Atletas selecionados</p>
                </div>
                <Button 
                    onClick={fetchPlayers}
                    className="p-3 bg-white/5 text-white/20 hover:text-white transition-all border-none"
                >
                    <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>
            
            <AttendanceList 
              players={allPlayers} 
              selectedIds={selectedPlayerIds} 
              onToggle={togglePlayerAttendance} 
            />

            <Button 
              onClick={handleDraft}
              disabled={selectedPlayerIds.length === 0}
              className="w-full py-6 font-black uppercase tracking-[0.4em] text-xs bg-primary text-black hover:bg-primary/80 transition-all gap-4 border-none shadow-[0_0_30px_rgba(204,255,0,0.1)]"
            >
              <FontAwesomeIcon icon={faShuffle} /> REALIZAR SORTEIO
            </Button>
          </div>
        )}

        {activeTab === 'match' && (
          <div className="grid grid-cols-1 gap-8">
            {!draftResult ? (
              <GlassCard className="py-24 text-center border-dashed border-white/10">
                <FontAwesomeIcon icon={faShuffle} className="mx-auto mb-6 text-white/10 text-5xl" />
                <p className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-6">Times ainda não sorteados</p>
                <Button 
                    onClick={() => setActiveTab('attendance')}
                    className="mx-auto py-3 px-8 bg-white/5 border border-white/10 text-white/40 hover:border-primary/40 hover:text-primary transition-all text-[10px] font-black uppercase tracking-[0.3em]"
                >
                    IR PARA CHAMADA
                </Button>
              </GlassCard>
            ) : (
              <div className="space-y-12">
                {/* Time A */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-black text-primary uppercase tracking-[0.4em]">TIME ALPHA (HOME)</h3>
                    <span className="text-[10px] font-mono text-white/40">AVG RATING: {draftResult.homeRating.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draftResult.homeTeam.map(player => (
                      <PlayerCard key={player.id} player={player} />
                    ))}
                  </div>
                </div>

                {/* Time B */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-[0.4em]">TIME BRAVO (AWAY)</h3>
                    <span className="text-[10px] font-mono text-white/40">AVG RATING: {draftResult.awayRating.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draftResult.awayTeam.map(player => (
                      <PlayerCard key={player.id} player={player} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'next' && (
           <GlassCard className="py-24 text-center border-dashed border-white/10">
                <FontAwesomeIcon icon={faUserGroup} className="mx-auto mb-6 text-white/10 text-5xl" />
                <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Fila de espera vazia</p>
           </GlassCard>
        )}
      </div>

      {/* Floating Tactical Button - Reset */}
      <button 
        onClick={() => {
            setDraftResult(null);
            setSelectedPlayerIds([]);
            setActiveTab('attendance');
        }}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-16 h-16 bg-white/5 border border-white/10 text-white/20 shadow-xl flex items-center justify-center hover:text-red-500 hover:border-red-500/40 transition-all z-40 group"
        title="Reiniciar Partida"
      >
        <FontAwesomeIcon icon={faUserSlash} className="text-xl" />
      </button>
    </div>
  );
}

