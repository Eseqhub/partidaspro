'use client';
export const dynamic = 'force-dynamic';

import { supabase } from '@/infra/supabase/client';

import React, { useState, useEffect } from 'react';
import { Scoreboard } from '@/presentation/components/dashboard/Scoreboard';
import { PlayerCard } from '@/presentation/components/dashboard/PlayerCard';
import { TacticalBoardV2 } from '@/presentation/components/dashboard/TacticalBoardV2';
import { Player } from '@/core/entities/player';
import { Match, SportType, GameMode, MatchStatus, MatchEvent, EventType } from '@/core/entities/match';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { AttendanceList } from '@/presentation/components/dashboard/AttendanceList';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
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
  faLocationArrow,
  faFutbol,
  faList,
  faSquare,
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import { AddPlayerModal } from '@/presentation/components/dashboard/AddPlayerModal';
import { AttendanceSelector } from '@/presentation/components/dashboard/AttendanceSelector';
import { AudioService } from '@/infra/services/AudioService';
import { useParams, useRouter } from 'next/navigation';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [activeTab, setActiveTab] = useState<'attendance' | 'match' | 'stats' | 'next' | 'settings'>('settings');
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
  const [status, setStatus] = useState<MatchStatus>('Pausada');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType>('Gol');
  const [guestPlayers, setGuestPlayers] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
  const [editorInput, setEditorInput] = useState('');
  const [editors, setEditors] = useState<any[]>([]);
  
  // Rotação e Filas
  const [teamsQueue, setTeamsQueue] = useState<Player[][]>([]);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(0);
  const [lastWinnerId, setLastWinnerId] = useState<'home' | 'away' | null>(null);
  
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
    awayTeamName: '',
    sport_type: 'Society' as SportType,
    game_mode: 'Dois ou Dez' as GameMode,
    max_players: 14,
    max_goalkeepers: 2,
    rules_text: '',
    recurrence_day: 'Segunda-feira',
    description: '',
    founded_year: new Date().getFullYear()
  });

  const playerRepo = new PlayerRepository();
  const groupRepo = new GroupRepository();
  const matchRepo = new MatchRepository();
  const draftService = new DraftService();
  const audioService = new AudioService();

  const handleSaveConfig = async () => {
    try {
        setLoading(true);

        
        if (groupId) {
            // Salvar padrões no Grupo
            await groupRepo.update(groupId, {
                rules_text: config.rules_text || '',
                sport_type_default: config.sport_type,
                recurrence_day: config.recurrence_day,
                description: (config as any).description,
                founded_year: (config as any).founded_year
            });
            
            // Se houver uma partida ativa no estado, poderíamos atualizar aqui também
            // Por enquanto, vamos apenas garantir que o estado local foi confirmado
            alert('Configurações salvas com sucesso!');
        }
    } catch (err) {
        console.error("Erro ao salvar config:", err);
        alert('Erro ao salvar as configurações.');
    } finally {
        setLoading(false);
    }
  };

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
        const { data: { user } } = await supabase.auth.getUser();
        const group = await groupRepo.findBySlug(slug);
        
        if (group && user) {
            setGroupId(group.id);
            fetchPlayers(group.id);
            
            // Detectar Role
            if (group.owner_id === user.id) {
                setUserRole('owner');
                // Se for dono, carregar lista de editores
                const { data: roles } = await supabase.from('group_roles').select('*').eq('group_id', group.id);
                setEditors(roles || []);
            } else {
                const isEditor = await groupRepo.isEditor(group.id, user.email || '');
                if (isEditor) setUserRole('editor');
            }

            // Carregar configurações padrão do grupo
            setConfig(prev => ({
                ...prev,
                rules_text: group.rules_text || '',
                sport_type: group.sport_type_default as SportType || 'Society',
                recurrence_day: (group as any).recurrence_day || 'Segunda-feira',
                description: group.description || '',
                founded_year: group.founded_year || new Date().getFullYear()
            }));
            // Tentar recuperar partida live
            const liveMatch = await matchRepo.findLiveMatch(group.id);
            if (liveMatch) {
                setMatchId(liveMatch.id);
                setScore({ home: liveMatch.home_score, away: liveMatch.away_score });
                setAccumulatedTime(liveMatch.timer_seconds);
                setTimer(liveMatch.timer_seconds);
                setStatus(liveMatch.status);
                
                // Carregar eventos da partida
                const matchEvents = await matchRepo.getEvents(liveMatch.id);
                setEvents(matchEvents);
                
                // Se estiver carregando match, preencher nomes se salvos
                if (liveMatch.home_team_name || liveMatch.away_team_name) {
                    setConfig(prev => ({
                        ...prev,
                        homeTeamName: liveMatch.home_team_name || prev.homeTeamName,
                        awayTeamName: liveMatch.away_team_name || prev.awayTeamName
                    }));
                }

                // Recuperar times e lista de presença
                const presence = await matchRepo.getPresence(liveMatch.id);
                if (presence.length > 0) {
                    const homePlayers = presence.filter((p: any) => p.team === 'home').map((p: any) => p.player);
                    const awayPlayers = presence.filter((p: any) => p.team === 'away').map((p: any) => p.player);
                    const waitingPlayers = presence.filter((p: any) => !p.team || p.team === 'waiting').map((p: any) => p.player);
                    
                    if (homePlayers.length > 0 || awayPlayers.length > 0) {
                        setDraftResult({
                            homeTeam: homePlayers,
                            awayTeam: awayPlayers,
                            waitingList: waitingPlayers,
                            homeRating: homePlayers.reduce((acc: number, p: any) => acc + (p.rating || 3), 0),
                            awayRating: awayPlayers.reduce((acc: number, p: any) => acc + (p.rating || 3), 0)
                        });
                        setSelectedPlayerIds(presence.map((p: any) => p.player_id));
                        setActiveTab('match');
                    }
                }
            }
        } else {
            console.error('Clube não encontrado');
            router.push('/dashboard');
        }
    }
    init();
  }, [slug]);

  // Subscrição Realtime
  useEffect(() => {
    if (!matchId) return;

    const sub = matchRepo.subscribeToMatch(matchId, (updated) => {
        // Só atualiza se for mundança externa relevante
        setScore({ home: updated.home_score, away: updated.away_score });
        setStatus(updated.status);
        if (updated.status !== 'Em curso') {
            setAccumulatedTime(updated.timer_seconds);
            setTimer(updated.timer_seconds);
            setStartTime(null);
        }
        
        if (updated.home_team_name || updated.away_team_name) {
            setConfig(prev => ({
                ...prev,
                homeTeamName: updated.home_team_name || prev.homeTeamName,
                awayTeamName: updated.away_team_name || prev.awayTeamName
            }));
        }
    });

    return () => {
        supabase.removeChannel(sub);
    };
  }, [matchId]);

  // Lógica Inteligente de Placares (Inteligência Tática)
  useEffect(() => {
    if (status !== 'Em curso') return;

    if (config.game_mode === 'Dois ou Dez') {
       if (score.home >= 2 || score.away >= 2 || timer >= 10 * 60) {
           setStatus('Finalizada');
           setAccumulatedTime(timer);
           setStartTime(null);
           alert("Dois ou Dez Encerrado! O time vencedor marcou 2 ou bateu 10 minutos.");
       }
    } else if (config.game_mode === 'Vira-Acaba') {
       const totalGols = score.home + score.away;
       if (totalGols === 1 && !sessionStorage.getItem(`vira_acaba_${slug}`)) {
           sessionStorage.setItem(`vira_acaba_${slug}`, 'true');
           alert("VIRAMOS! Um time marcou, troquem de lado!");
       }
       if (score.home >= 2 || score.away >= 2) {
           setStatus('Finalizada');
           setAccumulatedTime(timer);
           setStartTime(null);
           sessionStorage.removeItem(`vira_acaba_${slug}`);
           alert("Vira-acaba Encerrado! Jogo Finalizado.");
       }
    }
  }, [score, timer, status, config.game_mode, slug]);

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

   const toggleTimer = async () => {
    const now = Date.now();
    let newStatus: MatchStatus = 'Pausada';
    let newAccumulated = accumulatedTime;

    if (status === 'Em curso') {
        const sessionElapsed = Math.floor((now - (startTime || now)) / 1000);
        newAccumulated = accumulatedTime + sessionElapsed;
        setAccumulatedTime(newAccumulated);
        setStartTime(null);
        newStatus = 'Pausada';
    } else {
        setStartTime(now);
        newStatus = 'Em curso';
    }
    
    setStatus(newStatus);
    
    if (matchId) {
        await matchRepo.update(matchId, { 
            status: newStatus, 
            timer_seconds: newAccumulated 
        });
    }
  };

  const handleAddEvent = async (playerId: string, team: 'home' | 'away', type: EventType) => {
    if (!matchId) return;

    try {
        const newEvent = await matchRepo.addEvent({
            match_id: matchId,
            player_id: playerId,
            type,
            team,
            minute: Math.floor(timer / 60)
        });

        setEvents(prev => [newEvent, ...prev]);
        
        // Atualizar placar automaticamente se for gol
        if (type === 'Gol') {
            const newScore = {
                home: team === 'home' ? score.home + 1 : score.home,
                away: team === 'away' ? score.away + 1 : score.away
            };
            setScore(newScore);
            await matchRepo.update(matchId, { 
                home_score: newScore.home, 
                away_score: newScore.away 
            });
        }
        
        setIsEventModalOpen(false);
    } catch (error) {
        console.error('Erro ao registrar evento:', error);
    }
  };

  const togglePlayerAttendance = async (id: string) => {
    const isPresent = selectedPlayerIds.includes(id);
    setSelectedPlayerIds(prev => 
      isPresent ? prev.filter(pId => pId !== id) : [...prev, id]
    );

    if (matchId) {
        await matchRepo.setPlayerPresence(matchId, id, !isPresent);
    }
  };

  const handleDraft = async () => {
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
    
    // Se for modo de revezamento/rachão e houver gente pra mais de 2 times
    if (config.game_mode === 'Revezamento' || config.game_mode === 'Rachão') {
        const teams = draftService.balanceMultipleTeams(totalAvailable, config.playersPerTeam);
        if (teams.length >= 2) {
            setDraftResult({
                homeTeam: teams[0],
                awayTeam: teams[1],
                waitingList: [],
                homeRating: 0,
                awayRating: 0
            });
            setTeamsQueue(teams.slice(2));
            setConsecutiveWins(0);
            setActiveTab('match');
            return;
        }
    }

    const result = draftService.balanceTeams(totalAvailable, config.playersPerTeam);
    setDraftResult(result);
    setTeamsQueue([]);
    setConsecutiveWins(0);
    setActiveTab('match');

    // Persistir início da partida no banco
    if (groupId) {
        const newMatch = await matchRepo.create({
            group_id: groupId,
            date: new Date().toISOString(),
            status: 'Agendada',
            home_score: 0,
            away_score: 0,
            home_team_name: config.homeTeamName || 'Time Casa',
            away_team_name: config.awayTeamName || 'Time Visitante',
            timer_seconds: 0,
            duration_minutes: config.duration,
            stoppage_minutes: config.stoppage,
            goal_limit: config.goalLimit,
            home_color: config.homeColor,
            away_color: config.awayColor,
            sport_type: config.sport_type,
            game_mode: config.game_mode,
            max_players: config.max_players,
            max_goalkeepers: config.max_goalkeepers,
            match_fee: 0
        });
        setMatchId(newMatch.id);

        // Salvar presença e times no banco
        const presencePayload = [
            ...result.homeTeam.map(p => ({ player_id: p.id, team: 'home' })),
            ...result.awayTeam.map(p => ({ player_id: p.id, team: 'away' })),
            ...result.waitingList.map(p => ({ player_id: p.id, team: 'waiting' }))
        ];
        await matchRepo.savePresenceBatch(newMatch.id, presencePayload);
    }
  };

  const handleNextMatch = (winner: 'home' | 'away' | 'draw') => {
      if (!draftResult) return;

      const newQueue = [...teamsQueue];
      let nextHome = draftResult.homeTeam;
      let nextAway = draftResult.awayTeam;
      let newConsecutive = winner === lastWinnerId ? consecutiveWins + 1 : 1;

      // Regra de Ouro: Perdedor vai pro fim da fila
      if (winner === 'home') {
          // Time B sai
          newQueue.push(draftResult.awayTeam);
          // Time C entra
          if (newQueue.length > 0) {
              nextAway = newQueue.shift()!;
          }

          // Se ganhou 2 seguidas, o GANHADOR sai (Regra de Rotatividade do Estatuto)
          if (newConsecutive >= 2) {
              newQueue.push(nextHome);
              if (newQueue.length > 0) {
                  nextHome = newQueue.shift()!;
              }
              newConsecutive = 0;
          }
          setLastWinnerId('home');
      } else if (winner === 'away') {
          // Time A sai
          newQueue.push(draftResult.homeTeam);
          // Time C entra
          if (newQueue.length > 0) {
              nextHome = newQueue.shift()!;
          }

          if (newConsecutive >= 2) {
              newQueue.push(nextAway);
              if (newQueue.length > 0) {
                  nextAway = newQueue.shift()!;
              }
              newConsecutive = 0;
          }
          setLastWinnerId('away');
      } else {
          // Empate: Ambos saem ou regra da casa? Geralmente o vencedor anterior fica.
          // Vamos fazer: Ambos pro fim da fila se houver fila.
          newQueue.push(draftResult.homeTeam);
          newQueue.push(draftResult.awayTeam);
          nextHome = newQueue.shift()!;
          nextAway = newQueue.shift()!;
          newConsecutive = 0;
          setLastWinnerId(null);
      }

      setDraftResult({
          ...draftResult,
          homeTeam: nextHome,
          awayTeam: nextAway
      });
      setTeamsQueue(newQueue);
      setConsecutiveWins(newConsecutive);
      setScore({ home: 0, away: 0 });
      setTimer(0);
      setAccumulatedTime(0);
      setStartTime(null);
      setStatus('Pausada');
  };

  const handleNewMatch = () => {
      setDraftResult(null);
      setTeamsQueue([]);
      setConsecutiveWins(0);
      setLastWinnerId(null);
      setScore({ home: 0, away: 0 });
      setTimer(0);
      setAccumulatedTime(0);
      setStartTime(null);
      setStatus('Pausada');
      setMatchId(null);
      setEvents([]);
      setActiveTab('attendance');
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
    { id: 'settings', label: 'Config', icon: faRotateRight },
    { id: 'attendance', label: 'Chamada', icon: faListCheck },
    { id: 'match', label: 'Partida', icon: faStopwatch },
    { id: 'stats', label: 'Súmula', icon: faFutbol },
    { id: 'next', label: 'Espera', icon: faUserGroup },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-24 relative">
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
        onStopMatch={async () => {
            setStartTime(null);
            setAccumulatedTime(0);
            setTimer(0);
            setStatus('Pausada');
            if (matchId) {
                await matchRepo.update(matchId, { status: 'Finalizada', timer_seconds: 0 });
            }
        }}
        onUpdateConfig={async (updates) => {
            if (updates.homeScore !== undefined || updates.awayScore !== undefined) {
                const newScore = {
                    home: updates.homeScore !== undefined ? updates.homeScore : score.home,
                    away: updates.awayScore !== undefined ? updates.awayScore : score.away
                };
                setScore(newScore);
                if (matchId) {
                    await matchRepo.update(matchId, { 
                        home_score: newScore.home, 
                        away_score: newScore.away 
                    });
                }
            } else {
                setConfig(prev => ({ ...prev, ...updates }));
            }
        }}
      />

      {/* HUD Tabs */}
      <div className="flex border border-white/10 mb-8 bg-black/20 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 md:px-4 transition-all relative shrink-0 min-w-max md:min-w-0 ${
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
                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block italic">Estatuto / Regras do Grupo</label>
                <textarea 
                  value={config.rules_text}
                  onChange={(e) => setConfig({...config, rules_text: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 p-4 text-white font-mono text-xs h-32 outline-none focus:border-primary/40"
                  placeholder="DIGITE AS REGRAS E MULTAS AQUI..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Descrição do Clube</label>
                    <input 
                        type="text"
                        value={(config as any).description}
                        onChange={(e) => setConfig({...config, description: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Ano Fundação</label>
                    <input 
                        type="number"
                        value={(config as any).founded_year}
                        onChange={(e) => setConfig({...config, founded_year: parseInt(e.target.value)})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                    />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Recorrência (Dia da Semana)</label>
                <select 
                  value={config.recurrence_day}
                  onChange={(e) => setConfig({...config, recurrence_day: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white outline-none focus:border-primary/40"
                >
                  {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => (
                      <option key={day} value={day} className="bg-slate-900">{day}</option>
                  ))}
                </select>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Modalidade (Formato)</label>
                <select 
                  value={config.game_mode}
                  onChange={(e) => setConfig({...config, game_mode: e.target.value as GameMode})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none appearance-none"
                >
                    <option value="Rachão" className="bg-slate-900">Rachão (Vencedor Fica)</option>
                    <option value="Revezamento" className="bg-slate-900">Revezamento Dinâmico</option>
                    <option value="Dois ou Dez" className="bg-slate-900">Dois ou Dez (Gols/Tempo)</option>
                    <option value="Vira-Acaba" className="bg-slate-900">Um Vira, Dois Acaba</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Esporte (Planta Tática)</label>
                <select 
                  value={config.sport_type}
                  onChange={(e) => setConfig({...config, sport_type: e.target.value as SportType})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none appearance-none"
                >
                    <option value="Society" className="bg-slate-900">7 x 7 (Society)</option>
                    <option value="Futsal" className="bg-slate-900">5 x 5 (Futsal)</option>
                    <option value="Campo" className="bg-slate-900">11 x 11 (Campo)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Limite de Vagas (Linha)</label>
                <input 
                  type="number" 
                  value={config.max_players}
                  onChange={(e) => setConfig({...config, max_players: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Limite de Vagas (Goleiros)</label>
                <input 
                  type="number" 
                  value={config.max_goalkeepers}
                  onChange={(e) => setConfig({...config, max_goalkeepers: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Atletas por Time (No Sorteio)</label>
                <input 
                  type="number" 
                  value={config.playersPerTeam}
                  onChange={(e) => setConfig({...config, playersPerTeam: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                />
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

          {userRole === 'owner' && (
            <GlassCard className="p-6">
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                    Delegar Acesso (Editores)
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="email" 
                            value={editorInput}
                            onChange={(e) => setEditorInput(e.target.value)}
                            placeholder="E-MAIL DO COLABORADOR..."
                            className="flex-1 bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none uppercase text-[10px] font-black tracking-widest"
                        />
                        <Button 
                            onClick={async () => {
                                if (editorInput && groupId) {
                                    await groupRepo.addEditor(groupId, editorInput.toLowerCase());
                                    setEditorInput('');
                                    const { data: roles } = await supabase.from('group_roles').select('*').eq('group_id', groupId);
                                    setEditors(roles || []);
                                }
                            }}
                            className="bg-primary text-black px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            ADICIONAR
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {editors.map((ed, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{ed.user_email}</span>
                                <button 
                                    onClick={async () => {
                                        await supabase.from('group_roles').delete().eq('id', ed.id);
                                        setEditors(editors.filter(e => e.id !== ed.id));
                                    }}
                                    className="text-red-500/40 hover:text-red-500 transition-colors p-1"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
          )}
          
          <div className="flex justify-end">
            <Button 
                variant="primary" 
                className="px-8 py-3 uppercase font-black tracking-widest text-xs"
                onClick={handleSaveConfig}
                disabled={loading}
            >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
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
                        <FontAwesomeIcon icon={faPlus} className="text-white/20" /> Link de Inscrição Automática (WhatsApp)
                    </h3>
                    <div className="flex gap-2">
                        <input 
                            id="rsvp-link"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/join${matchId ? `?matchId=${matchId}` : ''}`}
                            className="flex-1 bg-black/40 border border-white/10 p-4 text-[10px] font-mono text-primary/60 outline-none"
                        />
                        <Button 
                            onClick={() => {
                                const link = (document.getElementById('rsvp-link') as HTMLInputElement).value;
                                navigator.clipboard.writeText(link);
                                alert('Link RSVP copiado para o WhatsApp!');
                            }}
                            className="bg-primary/20 text-primary px-4 font-black uppercase text-[10px] border-none hover:bg-primary hover:text-black transition-all"
                        >
                            COPIAR
                        </Button>
                    </div>
                    <p className="mt-2 text-[8px] font-bold text-white/20 uppercase tracking-widest text-center">Jogadores clicam, confirmam e já caem na lista acima</p>
                </GlassCard>
            </div>

            <AttendanceSelector 
                allPlayers={allPlayers}
                selectedPlayerIds={selectedPlayerIds}
                onToggle={togglePlayerAttendance}
            />

            <div className="border-t border-white/5 pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                        <FontAwesomeIcon icon={faPlus} className="text-primary" /> Atletas Avulsos / Convidados
                    </h3>
                    <span className="text-[10px] text-white/20 font-bold bg-white/5 px-2 py-0.5 border border-white/5">
                        {guestPlayers.length} ADICIONADOS
                    </span>
                </div>
                
                <div className="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        value={guestInput}
                        onChange={(e) => setGuestInput(e.target.value)}
                        placeholder="NOME DO CONVIDADO..."
                        className="flex-1 bg-white/5 border border-white/10 p-4 text-white uppercase font-black text-[10px] tracking-[0.3em] outline-none focus:border-primary/40 focus:bg-primary/5 transition-all"
                    />
                    <Button 
                        onClick={() => {
                            if (guestInput) {
                                setGuestPlayers([...guestPlayers, guestInput]);
                                setGuestInput('');
                            }
                        }}
                        className="bg-primary text-black px-8 font-black uppercase tracking-widest border-none h-auto"
                    >
                        ADD
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guestPlayers.map((name, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 group hover:border-white/10 transition-all rounded-sm">
                            <span className="text-[10px] font-black uppercase text-white/60 tracking-widest italic">{name}</span>
                            <button 
                                onClick={() => setGuestPlayers(guestPlayers.filter((_, idx) => idx !== i))}
                                className="text-white/10 hover:text-red-500 transition-colors p-2"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <Button 
              onClick={handleDraft}
              disabled={selectedPlayerIds.length < 2 && guestPlayers.length === 0}
              className={`w-full py-8 font-black uppercase tracking-[0.4em] text-sm bg-primary text-black hover:bg-primary/80 transition-all gap-4 border-none shadow-[0_0_40px_rgba(204,255,0,0.15)] group relative overflow-hidden ${userRole === 'viewer' ? 'hidden' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <FontAwesomeIcon icon={faShuffle} className="text-xl group-hover:rotate-180 transition-all duration-700" />
              Realizar Sorteio PRO
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
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                    {['Futsal', 'Society', 'Campo'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setConfig({ ...config, sport_type: mode as any })}
                            className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all border ${
                                config.sport_type === mode 
                                ? 'bg-primary text-black border-primary' 
                                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                <div className="mb-12 flex justify-center">
                    <TacticalBoardV2
                       homeTeam={draftResult.homeTeam}
                       awayTeam={draftResult.awayTeam}
                       homeTeamName={config.homeTeamName || "TIME MANDANTE (A)"}
                       awayTeamName={config.awayTeamName || "TIME VISITANTE (B)"}
                       homeScore={score.home}
                       awayScore={score.away}
                       timer={timer}
                       matchStatus={status}
                       sportType={config.sport_type}
                    />
                </div>

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

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Botão Nova Partida (Apenas Dono) */}
                {userRole === 'owner' && (
                  <button 
                      onClick={() => {
                          if (confirm('Deseja realmente iniciar uma nova rodada? Todos os dados atuais do sorteio serão limpos.')) {
                              handleNewMatch();
                          }
                      }}
                      className="group flex items-center justify-center gap-4 bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all p-4"
                  >
                      <FontAwesomeIcon icon={faPlus} className="text-primary text-xs" />
                      <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-primary tracking-widest transition-colors">Nova Rodada</span>
                  </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => {
                        if (userRole === 'viewer') {
                            alert('Apenas donos e editores podem registrar eventos.');
                            return;
                        }
                        if (!draftResult) {
                            alert('Primeiro faça o sorteio dos times!');
                            return;
                        }
                        setSelectedEventType('Gol');
                        setIsEventModalOpen(true);
                    }}
                    className={`p-6 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex flex-col items-center justify-center gap-3 group ${userRole === 'viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="w-12 h-12 bg-primary text-black flex items-center justify-center text-xl shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                        <FontAwesomeIcon icon={faFutbol} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Registrar Evento</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Atribuir Gol, Assistência ou Cartão</span>
                </button>

                <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                    <h3 className="text-white/40 font-black uppercase tracking-widest text-[9px] mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faList} className="text-primary" /> Feed da Partida
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {events.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="text-[10px] font-bold text-white/10 uppercase italic">Nenhum evento registrado</span>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-8 ${event.team === 'home' ? 'bg-primary' : 'bg-white/40'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-white font-bold text-xs uppercase italic truncate max-w-[100px]">{(event as any).player?.name}</span>
                                                <span className={`text-[8px] px-1.5 py-0.5 font-black uppercase tracking-widest leading-none ${
                                                    event.type === 'Gol' ? 'bg-primary text-black' : 
                                                    event.type.includes('Amarelo') ? 'bg-yellow-400 text-black' :
                                                    event.type.includes('Vermelho') ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'
                                                }`}>
                                                    {event.type}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{event.minute}&apos; mins</span>
                                        </div>
                                    </div>
                                    <FontAwesomeIcon 
                                        icon={event.type === 'Gol' ? faFutbol : faSquare} 
                                        className={`text-xs shrink-0 ${
                                            event.type === 'Gol' ? 'text-primary' : 
                                            event.type.includes('Amarelo') ? 'text-yellow-400' :
                                            event.type.includes('Vermelho') ? 'text-red-500' : 'text-white/20'
                                        }`} 
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'next' && (
           <div className="space-y-6">
               {teamsQueue.length === 0 ? (
                    <GlassCard className="py-24 text-center border-dashed border-white/10">
                        <FontAwesomeIcon icon={faUserGroup} className="mx-auto mb-6 text-white/10 text-5xl" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Fila de espera vazia</p>
                    </GlassCard>
               ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <h2 className="text-xs font-black text-primary uppercase tracking-widest px-2">Times na Fila ({teamsQueue.length})</h2>
                        {teamsQueue.map((team, idx) => (
                            <GlassCard key={idx} className="p-4 flex flex-col gap-2">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-black uppercase text-white/40">PRÓXIMO #{idx + 1}</span>
                                    <span className="text-[9px] font-bold text-primary">{team.length} ATLETAS</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {team.map(p => (
                                        <div key={p.id} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/60 truncate max-w-[80px] uppercase font-bold">
                                            {p.name.split(' ')[0]}
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
               )}

               {config.game_mode === 'Rachão' && (
                    <div className="p-4 bg-primary/5 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                        <p>💡 MODO RACHÃO ATIVO: O time que ganhar fica (máximo de 2 vitórias seguidas).</p>
                    </div>
               )}
           </div>
        )}

        {status === 'Finalizada' && draftResult && (
            <div className="mt-8 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Sessão Finalizada! Quem é o próximo?</h2>
                <div className="flex gap-4 w-full">
                    <Button 
                        onClick={() => handleNextMatch('home')}
                        className="flex-1 bg-primary text-black font-black uppercase tracking-widest py-4 border-none shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                    >
                        {config.homeTeamName || "TIME A"} GANHOU
                    </Button>
                    <Button 
                        onClick={() => handleNextMatch('draw')}
                        className="bg-white/10 text-white font-black uppercase tracking-widest px-8 border-none"
                    >
                        EMPATE
                    </Button>
                    <Button 
                        onClick={() => handleNextMatch('away')}
                        className="flex-1 bg-primary text-black font-black uppercase tracking-widest py-4 border-none shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                    >
                        {config.awayTeamName || "TIME B"} GANHOU
                    </Button>
                </div>
            </div>
        )}
      </div>

      {/* Floating Tactical Button - Reset */}
      <button 
        onClick={async () => {
            if (confirm("Deseja iniciar uma NOVA PARTIDA? Isso limpará o sorteio atual.")) {
                setDraftResult(null);
                setSelectedPlayerIds([]);
                setGuestPlayers([]);
                setScore({ home: 0, away: 0 });
                setTimer(0);
                setStatus('Agendada');
                setMatchId(null);
                setActiveTab('attendance');
                
                // Se houver uma partida em curso, podemos marcá-la como finalizada no banco
                if (matchId) {
                    await matchRepo.update(matchId, { status: 'Finalizada' });
                }
            }
        }}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-16 h-16 bg-primary text-black shadow-xl shadow-primary/20 flex items-center justify-center hover:bg-primary/80 transition-all z-40 group"
        title="Nova Partida"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl group-hover:rotate-90 transition-all duration-300" />
      </button>
      {/* Modal de Registro de Eventos */}
      {isEventModalOpen && draftResult && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-2xl p-8 border-primary/20 bg-slate-900 border overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[100px] pointer-events-none" />
                
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Registrar Evento</h2>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Súmula Digital PRO</span>
                    </div>
                    <button onClick={() => setIsEventModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faTimes} className="text-xl" />
                    </button>
                </div>

                <div className="flex gap-2 mb-8 bg-black/40 p-1 border border-white/5 overflow-x-auto">
                    {['Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho'].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedEventType(type as EventType)}
                            className={`flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedEventType === type ? 'bg-primary text-black' : 'text-white/40 hover:text-white/60'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Time Casa */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                            <div className="w-1.5 h-4 bg-primary" />
                            <h3 className="text-xs font-black text-white uppercase italic truncate">
                                {config.homeTeamName || 'TIME CASA'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {draftResult.homeTeam.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleAddEvent(player.id, 'home', selectedEventType)}
                                    className="p-3 bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-left transition-all group"
                                >
                                    <span className="text-[10px] font-bold text-white uppercase group-hover:text-primary transition-colors">{player.name}</span>
                                    <div className="flex gap-2 mt-1">
                                        {player.positions.map(p => (
                                            <span key={p} className="text-[8px] font-black text-white/20 uppercase">{p}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Visitante */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                            <div className="w-1.5 h-4 bg-white/40" />
                            <h3 className="text-xs font-black text-white uppercase italic truncate">
                                {config.awayTeamName || 'TIME VISITANTE'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {draftResult.awayTeam.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleAddEvent(player.id, 'away', selectedEventType)}
                                    className="p-3 bg-white/5 border border-white/5 hover:border-white/40 hover:bg-white/10 text-left transition-all group"
                                >
                                    <span className="text-[10px] font-bold text-white uppercase group-hover:text-white/60 transition-colors">{player.name}</span>
                                    <div className="flex gap-2 mt-1">
                                        {player.positions.map(p => (
                                            <span key={p} className="text-[8px] font-black text-white/20 uppercase">{p}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
      )}

      <AddPlayerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleQuickCreatePlayer}
        groupId={groupId || ''}
      />
    </div>
  );
}

