'use client';
export const dynamic = 'force-dynamic';

import { supabase } from '@/infra/supabase/client';
import React, { useState, useEffect } from 'react';
import { Player } from '@/core/entities/player';
import { SportType, GameMode, MatchStatus, EventType, MatchType, ChallengeStatus } from '@/core/entities/match';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { DraftService, DraftResult } from '@/core/services/DraftService';
import { AudioService } from '@/infra/services/AudioService';
import { useParams, useRouter } from 'next/navigation';

// Componentes Modulares V2
import { ScoreboardV2 } from '@/presentation/components/dashboard/matches/MatchScoreboardV2';
import { MatchBottomNav, Tab } from '@/presentation/components/dashboard/matches/MatchBottomNav';
import { AttendanceTab } from '@/presentation/components/dashboard/matches/tabs/AttendanceTab';
import { ActiveMatchTab } from '@/presentation/components/dashboard/matches/tabs/ActiveMatchTab';
import { StatsTab } from '@/presentation/components/dashboard/matches/tabs/StatsTab';
import { SettingsTab } from '@/presentation/components/dashboard/matches/tabs/SettingsTab';
import { WaitingListTab } from '@/presentation/components/dashboard/matches/tabs/WaitingListTab';

import { AddPlayerModal } from '@/presentation/components/dashboard/AddPlayerModal';
import { CreateMatchModal, CreateMatchConfig } from '@/presentation/components/dashboard/CreateMatchModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faListCheck, faStopwatch, faFutbol, faUserGroup, faGear } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { EventType as CoreEventType } from '@/core/entities/match';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [activeTab, setActiveTab] = useState<'attendance' | 'match' | 'stats' | 'next' | 'settings'>('match');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  const [matchType, setMatchType] = useState<MatchType>('rachao');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('pendente');
  
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('Pausada');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<CoreEventType>('Gol');
  const [guestPlayers, setGuestPlayers] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
  const [editorInput, setEditorInput] = useState('');
  const [editors, setEditors] = useState<any[]>([]);
  const [teamsQueue, setTeamsQueue] = useState<Player[][]>([]);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(0);
  const [lastWinnerId, setLastWinnerId] = useState<'home' | 'away' | null>(null);
  
  const [config, setConfig] = useState({
    location: '',
    sessionStartTime: '08:00',
    sessionEndTime: '10:00',
    duration: 10,
    stoppage: 0,
    goalLimit: 0,
    homeColor: 'Branco',
    awayColor: 'Preto',
    playersPerTeam: 7,
    homeTeamName: '',
    awayTeamName: '',
    sport_type: 'Society' as SportType,
    game_mode: 'Rachão' as GameMode,
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
        await groupRepo.update(groupId, {
          rules_text: config.rules_text || '',
          sport_type_default: config.sport_type,
          recurrence_day: config.recurrence_day,
          description: config.description,
          founded_year: config.founded_year
        });
        alert('Configurações salvas!');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async (id: string) => {
    try {
      const data = await playerRepo.findAllByGroupId(id);
      setAllPlayers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const group = await groupRepo.findBySlug(slug);
      
      if (group && user) {
        setGroupId(group.id);
        fetchPlayers(group.id);
        
        if (group.owner_id === user.id) {
          setUserRole('owner');
          const { data: roles } = await supabase.from('group_roles').select('*').eq('group_id', group.id);
          setEditors(roles || []);
        } else {
          const isEditor = await groupRepo.isEditor(group.id, user.email || '');
          if (isEditor) setUserRole('editor');
        }

        setConfig(prev => ({
          ...prev,
          rules_text: group.rules_text || '',
          sport_type: group.sport_type_default as SportType || 'Society',
          recurrence_day: (group as any).recurrence_day || 'Segunda-feira',
          description: group.description || '',
          founded_year: group.founded_year || new Date().getFullYear()
        }));

        const liveMatch = await matchRepo.findLiveMatch(group.id);
        if (liveMatch) {
          setMatchId(liveMatch.id);
          setScore({ home: liveMatch.home_score, away: liveMatch.away_score });
          setAccumulatedTime(liveMatch.timer_seconds);
          setTimer(liveMatch.timer_seconds);
          setStatus(liveMatch.status);
          
          const matchEvents = await matchRepo.getEvents(liveMatch.id);
          setEvents(matchEvents);
          
          if (liveMatch.home_team_name || liveMatch.away_team_name) {
            setConfig(prev => ({
              ...prev,
              homeTeamName: liveMatch.home_team_name || prev.homeTeamName,
              awayTeamName: liveMatch.away_team_name || prev.awayTeamName
            }));
          }

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
      }
      setLoading(false);
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToMatch(matchId, (updated) => {
      setScore({ home: updated.home_score, away: updated.away_score });
      setStatus(updated.status);
      if (updated.status !== 'Em curso') {
        setAccumulatedTime(updated.timer_seconds);
        setTimer(updated.timer_seconds);
        setStartTime(null);
      }
      if (updated.challenge_status) setChallengeStatus(updated.challenge_status as any);
    });
    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  useEffect(() => {
    let interval: any;
    if (status === 'Em curso' && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const currentTotal = accumulatedTime + elapsed;
        const limitSeconds = (config.duration + config.stoppage) * 60;
        setTimer(currentTotal);
        if (currentTotal >= limitSeconds) {
          audioService.playEndAlarm();
          setStatus('Finalizada');
          setAccumulatedTime(limitSeconds);
          setStartTime(null);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [status, startTime, accumulatedTime, config.duration]);

  const toggleTimer = async () => {
    const now = Date.now();
    let newStatus: MatchStatus = status === 'Em curso' ? 'Pausada' : 'Em curso';
    let newAccumulated = accumulatedTime;

    if (status === 'Em curso') {
      const sessionElapsed = Math.floor((now - (startTime || now)) / 1000);
      newAccumulated = accumulatedTime + sessionElapsed;
      setAccumulatedTime(newAccumulated);
      setStartTime(null);
    } else {
      setStartTime(now);
    }
    setStatus(newStatus);
    if (matchId) await matchRepo.update(matchId, { status: newStatus, timer_seconds: newAccumulated });
  };

  const handleAddEvent = async (playerId: string, team: 'home' | 'away', type: CoreEventType) => {
    if (!matchId) return;
    try {
      const newEvent = await matchRepo.addEvent({
        match_id: matchId, player_id: playerId, type, team, minute: Math.floor(timer / 60)
      });
      setEvents(prev => [newEvent, ...prev]);
      if (type === 'Gol') {
        const newScore = { home: team === 'home' ? score.home + 1 : score.home, away: team === 'away' ? score.away + 1 : score.away };
        setScore(newScore);
        await matchRepo.update(matchId, { home_score: newScore.home, away_score: newScore.away });
      }
      setIsEventModalOpen(false);
    } catch (error) { console.error(error); }
  };

  const togglePlayerAttendance = async (id: string) => {
    const isPresent = selectedPlayerIds.includes(id);
    setSelectedPlayerIds(prev => isPresent ? prev.filter(pId => pId !== id) : [...prev, id]);
    if (matchId) await matchRepo.setPlayerPresence(matchId, id, !isPresent);
  };

  const handleDraft = async () => {
    const selectedPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
    const guests: Player[] = guestPlayers.map((name, i) => ({
      id: `guest-${i}-${name}`, name: `${name} (Avulso)`, group_id: groupId, rating: 3, positions: ['SA'], status: 'Ativo', is_mensalista: false
    } as Player));
    const totalAvailable = [...selectedPlayers, ...guests];
    if (totalAvailable.length < 2) return alert('Mínimo de 2 jogadores!');
    
    const result = draftService.balanceTeams(totalAvailable, config.playersPerTeam);
    setDraftResult(result);
    setActiveTab('match');

    if (groupId) {
      const newMatch = await matchRepo.create({
        group_id: groupId, date: new Date().toISOString(), status: 'Agendada', home_score: 0, away_score: 0,
        home_team_name: config.homeTeamName || 'Time Mandante', away_team_name: config.awayTeamName || 'Time Visitante',
        timer_seconds: 0, duration_minutes: config.duration, stoppage_minutes: config.stoppage,
        goal_limit: config.goalLimit, home_color: config.homeColor, away_color: config.awayColor,
        sport_type: config.sport_type, game_mode: config.game_mode, max_players: config.max_players,
        max_goalkeepers: config.max_goalkeepers, match_fee: 0
      });
      setMatchId(newMatch.id);
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
    if (winner === 'home') {
      newQueue.push(draftResult.awayTeam);
      if (newQueue.length > 0) nextAway = newQueue.shift()!;
      if (newConsecutive >= 2) { newQueue.push(nextHome); if (newQueue.length > 0) nextHome = newQueue.shift()!; newConsecutive = 0; }
      setLastWinnerId('home');
    } else if (winner === 'away') {
      newQueue.push(draftResult.homeTeam);
      if (newQueue.length > 0) nextHome = newQueue.shift()!;
      if (newConsecutive >= 2) { newQueue.push(nextAway); if (newQueue.length > 0) nextAway = newQueue.shift()!; newConsecutive = 0; }
      setLastWinnerId('away');
    }
    setDraftResult({ ...draftResult, homeTeam: nextHome, awayTeam: nextAway });
    setTeamsQueue(newQueue);
    setConsecutiveWins(newConsecutive);
    setScore({ home: 0, away: 0 });
    setTimer(0);
    setAccumulatedTime(0);
    setStartTime(null);
    setStatus('Pausada');
  };

  const handleNewMatch = () => {
    setDraftResult(null); setTeamsQueue([]); setConsecutiveWins(0); setScore({ home: 0, away: 0 }); setTimer(0); setAccumulatedTime(0); setStartTime(null); setStatus('Pausada'); setMatchId(null); setEvents([]); setMatchType('rachao'); setActiveTab('attendance');
  };

  const tabs: Tab[] = [
    { id: 'attendance', label: 'Chamada', icon: faListCheck, hidden: matchType === 'desafio' },
    { id: 'match', label: 'Partida', icon: faStopwatch },
    { id: 'next', label: 'EsperaV2', icon: faUserGroup, hidden: matchType === 'desafio' },
    { id: 'stats', label: 'Sumula', icon: faFutbol },
    { id: 'settings', label: 'Ajustes', icon: faGear },
  ].filter(t => !t.hidden) as Tab[];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-12 pb-32 relative font-inter">
      
      {/* Header com indicador de Desafio */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {challengeToken && matchType === 'desafio' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">DESAFIO ATIVO</span>
            </div>
          )}
        </div>
        {!matchId && userRole !== 'viewer' && (
          <button onClick={() => setIsCreateMatchModalOpen(true)} className="px-6 py-2.5 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> CRIAR PARTIDA
          </button>
        )}
      </div>

      {/* Scoreboard V2 Premium */}
      <ScoreboardV2
        homeScore={score.home} awayScore={score.away}
        homeTeamName={config.homeTeamName} awayTeamName={config.awayTeamName}
        homeColor={config.homeColor} awayColor={config.awayColor}
        timer={timer} status={status}
        onToggleTimer={toggleTimer}
        onStopMatch={async () => { setStartTime(null); setAccumulatedTime(0); setTimer(0); setStatus('Pausada'); if (matchId) await matchRepo.update(matchId, { status: 'Finalizada', timer_seconds: 0 }); }}
        onUpdateConfig={(updates) => {
          if (updates.homeScore !== undefined || updates.awayScore !== undefined) {
            const ns = { home: updates.homeScore ?? score.home, away: updates.awayScore ?? score.away };
            setScore(ns);
            if (matchId) matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
          } else { setConfig(prev => ({ ...prev, ...updates })); }
        }}
      />

      {/* Navegação Inferior (Mobile) / Tabs (Desktop) */}
      <MatchBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={tabs} 
        waitingCount={teamsQueue.length} 
      />

      {/* Conteúdo das Abas Modulares */}
      <div className="mt-8">
        {activeTab === 'attendance' && (
          <AttendanceTab 
            allPlayers={allPlayers} selectedPlayerIds={selectedPlayerIds} togglePlayerAttendance={togglePlayerAttendance} setIsAddModalOpen={setIsAddModalOpen} slug={slug} matchId={matchId} guestInput={guestInput} setGuestInput={setGuestInput} guestPlayers={guestPlayers} setGuestPlayers={setGuestPlayers} handleDraft={handleDraft} userRole={userRole}
          />
        )}
        {activeTab === 'match' && (
          <ActiveMatchTab 
            draftResult={draftResult} config={config} setConfig={setConfig} score={score} timer={timer} status={status} setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'stats' && (
          <StatsTab 
            userRole={userRole} handleNewMatch={handleNewMatch} draftResult={draftResult} setSelectedEventType={setSelectedEventType} setIsEventModalOpen={setIsEventModalOpen} events={events}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            config={config} setConfig={setConfig} handleSaveConfig={handleSaveConfig} loading={loading} userRole={userRole} editorInput={editorInput} setEditorInput={setEditorInput} editors={editors} setEditors={setEditors} groupId={groupId} groupRepo={groupRepo} supabase={supabase}
          />
        )}
        {activeTab === 'next' && (
          <WaitingListTab teamsQueue={teamsQueue} config={config} draftResult={draftResult} />
        )}
      </div>

      {/* Overlay de Finalização */}
      {status === 'Finalizada' && draftResult && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-8 rounded-3xl border-primary/20 text-center">
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8 italic">🔥 Partida Encerrada! Quem venceu?</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button onClick={() => handleNextMatch('home')} className="py-5 bg-primary text-black font-black uppercase tracking-widest rounded-xl">{config.homeTeamName || "TIME A"} GANHOU</Button>
              <Button onClick={() => handleNextMatch('draw')} className="py-4 bg-white/5 text-white/40 font-black uppercase tracking-widest rounded-xl">EMPATE</Button>
              <Button onClick={() => handleNextMatch('away')} className="py-5 bg-primary text-black font-black uppercase tracking-widest rounded-xl">{config.awayTeamName || "TIME B"} GANHOU</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Modais de Suporte */}
      <AddPlayerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={async (p) => { 
        const np = await playerRepo.create(p); if (groupId) fetchPlayers(groupId); setSelectedPlayerIds(prev => [...prev, np.id]); setIsAddModalOpen(false);
      }} groupId={groupId || ''} />

      <CreateMatchModal isOpen={isCreateMatchModalOpen} onClose={() => setIsCreateMatchModalOpen(false)} 
        onCreateRachao={(cfg) => { setMatchType('rachao'); setConfig(prev => ({...prev, ...cfg})); setActiveTab('attendance'); }}
        onCreateDesafio={async (cfg) => {
          if (!groupId) return '';
          const nm = await matchRepo.createChallenge({...cfg, group_id: groupId, date: new Date().toISOString(), status: 'Agendada', match_type: 'desafio'});
          setMatchId(nm.id); setMatchType('desafio'); setConfig(prev => ({...prev, ...cfg})); setActiveTab('match');
          return `${window.location.origin}/${slug}/challenge/${nm.challenge_token}`;
        }}
      />

      {/* Modal de Eventos (Gols/Cartões) */}
      {isEventModalOpen && draftResult && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-8 rounded-3xl border-primary/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white uppercase italic">Registrar Evento</h2>
              <button onClick={() => setIsEventModalOpen(false)} className="text-white/20 hover:text-white"><FontAwesomeIcon icon={faTimes} className="text-xl" /></button>
            </div>
            <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
              {['Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho'].map(type => (
                <button key={type} onClick={() => setSelectedEventType(type as any)} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-lg transition-all ${selectedEventType === type ? 'bg-primary text-black' : 'text-white/40'}`}>{type}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-8">
              {[ 'home', 'away' ].map(side => (
                <div key={side} className="space-y-4">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                    {side === 'home' ? (config.homeTeamName || 'TIME A') : (config.awayTeamName || 'TIME B')}
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {draftResult[side === 'home' ? 'homeTeam' : 'awayTeam'].map(p => (
                      <button key={p.id} onClick={() => handleAddEvent(p.id, side as any, selectedEventType)} className="w-full p-3 bg-white/5 border border-white/5 hover:border-primary/40 rounded-lg text-left group">
                        <span className="text-[10px] font-black text-white uppercase group-hover:text-primary">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
