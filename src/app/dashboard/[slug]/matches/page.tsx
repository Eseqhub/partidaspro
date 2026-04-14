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
  faUserSlash,
  faPlus,
  faTimes,
  faAddressCard,
  faMapPin,
  faClock,
  faLocationArrow
} from '@fortawesome/free-solid-svg-icons';
import { AddPlayerModal } from '@/presentation/components/dashboard/AddPlayerModal';
import { AudioService } from '@/infra/services/AudioService';

import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { useParams, useRouter } from 'next/navigation';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [activeTab, setActiveTab] = useState<'attendance' | 'match' | 'next' | 'settings'>('attendance');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [status, setStatus] = useState<'Em curso' | 'Pausada' | 'Finalizada'>('Pausada');
  
  // Jogadores Avulsos (Manuais)
  const [guestPlayers, setGuestPlayers] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');
  
  // Configurações da Partida
  const [config, setConfig] = useState({
    location: '',
    sessionStartTime: '08:00',
    sessionEndTime: '10:00',
    duration: 10, // minutos
    stoppage: 0,
    goalLimit: 0,
    homeColor: 'Branco',
    awayColor: 'Preto',
    playersPerTeam: 7, // Padrão society
    homeTeamName: '',
    awayTeamName: ''
  });

  const playerRepo = new PlayerRepository();
  const groupRepo = new GroupRepository();
  const draftService = new DraftService();
  const audioService = new AudioService();

  const fetchPlayers = async (id: string) => {
    setLoading(true);
    try {
      const data = await playerRepo.findAllByGroupId(id);
      setAllPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
        const group = await groupRepo.findBySlug(slug);
        if (group) {
            setGroupId(group.id);
            fetchPlayers(group.id);
        } else {
            console.error('Clube não encontrado');
            router.push('/dashboard');
        }
    }
    init();
  }, [slug]);

  useEffect(() => {
    let interval: any;
    if (status === 'Em curso' && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const currentTotal = accumulatedTime + elapsed;
        
        const limitSeconds = (config.duration + config.stoppage) * 60;
        const remaining = limitSeconds - currentTotal;

        setTimer(currentTotal);

        // Lógica de Alarmes Sonoros
        if (remaining <= 0) {
          audioService.playEndAlarm();
          setStatus('Finalizada');
          setAccumulatedTime(limitSeconds);
          setStartTime(null);
          return;
        }

        // Bips de alerta (mesmas condições anteriores)
        if (remaining < 60 && remaining > 10 && remaining % 10 === 0) {
          audioService.playBip(440, 0.1);
        }
        if (remaining <= 10 && remaining > 0) {
          audioService.playBip(880, 0.1);
        }
      }, 500); // Check more frequently but logic is timestamp based
    }
    return () => clearInterval(interval);
  }, [status, startTime, accumulatedTime, config.duration, config.stoppage]);

  const toggleTimer = () => {
    const now = Date.now();
    if (status === 'Em curso') {
        const sessionElapsed = Math.floor((now - (startTime || now)) / 1000);
        setAccumulatedTime(prev => prev + sessionElapsed);
        setStartTime(null);
        setStatus('Pausada');
    } else {
        setStartTime(now);
        setStatus('Em curso');
    }
  };

  const togglePlayerAttendance = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleDraft = () => {
    const selectedPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
    
    // Mapear jogadores avulsos (convidados)
    const guests: Player[] = guestPlayers.map((name, i) => ({
      id: `guest-${i}-${name}`,
      name: `${name} (Avulso)`,
      group_id: groupId,
      rating: 3, // Rating padrão para equilibrar
      positions: ['SA'], // Segundo atacante padrão
      status: 'Ativo',
      is_mensalista: false
    } as Player));

    const totalAvailable = [...selectedPlayers, ...guests];

    if (totalAvailable.length < 2) {
      alert('Selecione ou adicione ao menos 2 jogadores para o sorteio.');
      return;
    }
    
    const result = draftService.balanceTeams(totalAvailable, config.playersPerTeam);
    setDraftResult(result);
    setActiveTab('match');
  };

  const addGuest = () => {
    if (!guestInput.trim()) return;
    setGuestPlayers(prev => [...prev, guestInput.trim()]);
    setGuestInput('');
  };

  const removeGuest = (index: number) => {
    setGuestPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickCreatePlayer = async (newPlayerData: Omit<Player, 'id' | 'created_at'>) => {
    try {
      const playerRepo = new PlayerRepository();
      const newPlayer = await playerRepo.create(newPlayerData);
      
      // Atualizar lista e selecionar automaticamente
      if (groupId) await fetchPlayers(groupId);
      setSelectedPlayerIds(prev => [...prev, newPlayer.id]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert('Erro ao criar jogador.');
      console.error(err);
    }
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
        homeTeamName={config.homeTeamName || "Time A"}
        awayTeamName={config.awayTeamName || "Time B"}
        homeColor={config.homeColor}
        awayColor={config.awayColor}
        timer={timer}
        status={status}
        onToggleTimer={toggleTimer}
        onStopMatch={() => {
            setStartTime(null);
            setAccumulatedTime(0);
            setTimer(0);
            setStatus('Pausada');
        }}
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
            {tab.id === 'next' && (draftResult?.waitingList?.length ?? 0) > 0 && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 text-[10px] font-black flex items-center justify-center text-black">
                    {draftResult?.waitingList?.length}
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
              <FontAwesomeIcon icon={faMapPin} className="text-primary" /> Informações do Evento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-8 mb-8">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center justify-between">
                  <span>Local da Partida / Quadra</span>
                  {config.location && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.location)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:text-white transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faLocationArrow} /> ABRIR NO MAPS
                    </a>
                  )}
                </label>
                <input 
                  type="text" 
                  value={config.location}
                  onChange={(e) => setConfig({...config, location: e.target.value})}
                  placeholder="EX: ARENA NACIONAL..."
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} /> Horário de Início
                </label>
                <input 
                  type="time" 
                  value={config.sessionStartTime}
                  onChange={(e) => setConfig({...config, sessionStartTime: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none color-scheme-dark"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                   <FontAwesomeIcon icon={faClock} /> Horário Final (Término)
                </label>
                <input 
                  type="time" 
                  value={config.sessionEndTime}
                  onChange={(e) => setConfig({...config, sessionEndTime: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none color-scheme-dark"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faRotateRight} className="text-primary" /> Regras da Partida Curta
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Duração de cada jogo (Min)</label>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Atletas por Time (5, 7, 11...)</label>
                <select 
                  value={config.playersPerTeam}
                  onChange={(e) => setConfig({...config, playersPerTeam: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none appearance-none"
                >
                    <option value="5" className="bg-slate-900">5 x 5 (Futsal)</option>
                    <option value="6" className="bg-slate-900">6 x 6 (Society)</option>
                    <option value="7" className="bg-slate-900">7 x 7 (Society)</option>
                    <option value="11" className="bg-slate-900">11 x 11 (Campo)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Nome do Time Casa (A)</label>
                <input 
                  type="text" 
                  value={config.homeTeamName}
                  onChange={(e) => setConfig({...config, homeTeamName: e.target.value})}
                  placeholder="EX: AMIGOS DO ZEQUi..."
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Nome do Time Visitante (B)</label>
                <input 
                  type="text" 
                  value={config.awayTeamName}
                  onChange={(e) => setConfig({...config, awayTeamName: e.target.value})}
                  placeholder="EX: SEM COLETE..."
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Botão de Cadastro Completo (Principal) */}
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-6 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                    <div className="w-12 h-12 bg-primary text-black flex items-center justify-center text-xl shadow-[0_0_20px_rgba(204,255,0,0.2)] group-hover:scale-110 transition-transform">
                        <FontAwesomeIcon icon={faPlus} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Registrar Novo Craque</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/20 text-center">Cadastro permanente com posição e nível</span>
                </button>

                {/* Card de Convidado Rápido (Secundário) */}
                <GlassCard className="p-6 border-white/5 bg-white/[0.02] flex flex-col justify-center">
                    <h3 className="text-white/40 font-black uppercase tracking-widest text-[9px] mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faPlus} className="text-white/20" /> Convidado Rápido (Somente Nome)
                    </h3>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={guestInput}
                            onChange={(e) => setGuestInput(e.target.value)}
                            placeholder="NOME..."
                            className="flex-1 bg-black/40 border border-white/10 p-2 text-xs text-white focus:border-white/40 outline-none uppercase font-bold placeholder:text-white/5"
                            onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                        />
                        <Button onClick={addGuest} className="bg-white/10 text-white/40 px-4 font-black uppercase text-[10px] border-none hover:bg-white/20 hover:text-white transition-all">ADD</Button>
                    </div>

                    {guestPlayers.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                            {guestPlayers.map((name, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 px-2 py-1 flex items-center gap-2 transition-all">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{name}</span>
                                    <button onClick={() => removeGuest(index)} className="text-white/10 hover:text-red-500 transition-colors">
                                        <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.3em]">Lista de Presentes</h2>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">
                        {selectedPlayerIds.length + guestPlayers.length} Selecionados ({guestPlayers.length} avulsos)
                    </p>
                </div>
                <Button 
                    onClick={() => groupId && fetchPlayers(groupId)}
                    className="font-black uppercase tracking-widest text-[10px] py-4 px-6 bg-white/5 text-white/40 hover:text-white transition-all border-none"
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
                    <h3 className="text-sm font-black text-primary uppercase tracking-[0.4em]">
                        {config.homeTeamName ? config.homeTeamName : "TIME MANDANTE (A)"}
                    </h3>
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
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-[0.4em]">
                        {config.awayTeamName ? config.awayTeamName : "TIME VISITANTE (B)"}
                    </h3>
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

      <AddPlayerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleQuickCreatePlayer}
        groupId={groupId || ''}
      />
    </div>
  );
}

