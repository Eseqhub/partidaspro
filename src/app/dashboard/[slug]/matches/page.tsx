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
import { TournamentService, BolaoState } from '@/core/services/TournamentService';
import { Formation, getFormations, defaultFormation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';
import { buildResultMessage, openWhatsApp } from '@/core/services/ShareService';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { AudioService } from '@/infra/services/AudioService';
import { useParams } from 'next/navigation';

import { ScoreboardV2 } from '@/presentation/components/dashboard/matches/MatchScoreboardV2';
import { MatchBottomNav, Tab } from '@/presentation/components/dashboard/matches/MatchBottomNav';
import { AttendanceTab } from '@/presentation/components/dashboard/matches/tabs/AttendanceTab';
import { ActiveMatchTab } from '@/presentation/components/dashboard/matches/tabs/ActiveMatchTab';
import { StatsTab } from '@/presentation/components/dashboard/matches/tabs/StatsTab';
import { SettingsTab } from '@/presentation/components/dashboard/matches/tabs/SettingsTab';
import { WaitingListTab } from '@/presentation/components/dashboard/matches/tabs/WaitingListTab';
import { TeamAssignmentTab, PlayerRole } from '@/presentation/components/dashboard/matches/tabs/TeamAssignmentTab';
import { BolaoTab } from '@/presentation/components/dashboard/matches/tabs/BolaoTab';
import { NextTeamModal } from '@/presentation/components/dashboard/matches/NextTeamModal';
import { TieBreakModal } from '@/presentation/components/dashboard/matches/TieBreakModal';
import { faTableList } from '@fortawesome/free-solid-svg-icons';

import { AddPlayerModal } from '@/presentation/components/dashboard/AddPlayerModal';
import { CreateMatchModal, CreateMatchConfig } from '@/presentation/components/dashboard/CreateMatchModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faListCheck, faStopwatch, faFutbol, faGear } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { EventType as CoreEventType } from '@/core/entities/match';

// sport_type → playersPerTeam padrão
const SPORT_PLAYERS: Record<string, number> = {
  Futsal: 5,
  Society: 7,
  Campo: 11,
};

export default function MatchPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<'attendance' | 'match' | 'stats' | 'settings' | 'bolao'>('attendance');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  // Fase da sessão: null = nenhuma, 'setup' = configurado mas não sorteado, 'active' = matchId definido
  const [sessionPhase, setSessionPhase] = useState<'idle' | 'setup' | 'active'>('idle');
  const [matchType, setMatchType] = useState<MatchType>('rachao');

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
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [lastWinnerId, setLastWinnerId] = useState<'home' | 'away' | null>(null);

  // Escalação manual (mode 'manual')
  const [teamAssignments, setTeamAssignments] = useState<Record<string, PlayerRole>>({});

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
    founded_year: new Date().getFullYear(),
  });

  // Bolão tournament state
  const [bolaoState, setBolaoState] = useState<BolaoState | null>(null);

  // Modal de próximo time (Rachão)
  const [nextTeamCtx, setNextTeamCtx] = useState<{
    outgoingName: string;
    incomingTeam: Player[];
    winnerResult: 'home' | 'away' | 'draw';
  } | null>(null);

  // Craque da partida atual
  const [mvpPlayerId, setMvpPlayerId] = useState<string | null>(null);

  // Modal de desempate (empate)
  const [tieBreakOpen, setTieBreakOpen] = useState(false);

  // Formações selecionadas
  const availableFormations = getFormations(config.sport_type, config.playersPerTeam);
  const [homeFormation, setHomeFormation] = useState<Formation>(defaultFormation(config.sport_type, config.playersPerTeam));
  const [awayFormation, setAwayFormation] = useState<Formation>(defaultFormation(config.sport_type, config.playersPerTeam));

  const playerRepo       = new PlayerRepository();
  const groupRepo        = new GroupRepository();
  const matchRepo        = new MatchRepository();
  const draftService     = new DraftService();
  const tournamentSvc    = new TournamentService();
  const audioService     = new AudioService();

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      if (groupId) {
        await groupRepo.update(groupId, {
          rules_text: config.rules_text || '',
          sport_type_default: config.sport_type,
          recurrence_day: config.recurrence_day,
          description: config.description,
          founded_year: config.founded_year,
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
          founded_year: group.founded_year || new Date().getFullYear(),
        }));

        const liveMatch = await matchRepo.findLiveMatch(group.id);
        if (liveMatch) {
          setMatchId(liveMatch.id);
          setScore({ home: liveMatch.home_score, away: liveMatch.away_score });
          setAccumulatedTime(liveMatch.timer_seconds);
          setTimer(liveMatch.timer_seconds);
          setStatus(liveMatch.status);
          // Prioridade: match_type salvo (novo), fallback: modality (NovaPartidaModal)
          const resolvedType: MatchType =
            liveMatch.match_type === 'manual'  ? 'manual'
            : liveMatch.match_type === 'desafio' ? 'desafio'
            : (liveMatch as any).modality === 'Manual'  ? 'manual'
            : (liveMatch as any).modality === 'Bolão'   ? 'rachao'  // Bolão usa rachao como base
            : 'rachao';
          setMatchType(resolvedType);
          if ((liveMatch as any).modality === 'Bolão') {
            setConfig(prev => ({ ...prev, game_mode: 'Bolão' }));
          }
          setSessionPhase('active');

          const matchEvents = await matchRepo.getEvents(liveMatch.id);
          setEvents(matchEvents);

          // Carrega todas as configurações salvas na partida
          setConfig(prev => ({
            ...prev,
            homeTeamName:   liveMatch.home_team_name   || prev.homeTeamName,
            awayTeamName:   liveMatch.away_team_name   || prev.awayTeamName,
            homeColor:      liveMatch.home_color       || prev.homeColor,
            awayColor:      liveMatch.away_color       || prev.awayColor,
            duration:       liveMatch.duration_minutes || prev.duration,
            stoppage:       liveMatch.stoppage_minutes ?? prev.stoppage,
            goalLimit:      liveMatch.goal_limit       ?? prev.goalLimit,
            sport_type:    (liveMatch.sport_type as any) || prev.sport_type,
          }));

          const presence = await matchRepo.getPresence(liveMatch.id);
          if (presence.length > 0) {
            const homePlayers    = presence.filter((p: any) => p.team === 'home' && p.player).map((p: any) => p.player);
            const awayPlayers    = presence.filter((p: any) => p.team === 'away' && p.player).map((p: any) => p.player);
            const waitingPlayers = presence.filter((p: any) => (!p.team || p.team === 'waiting') && p.player).map((p: any) => p.player);
            const allPresenceIds = presence.map((p: any) => p.player_id).filter(Boolean);
            setSelectedPlayerIds(allPresenceIds);

            if (homePlayers.length > 0 || awayPlayers.length > 0) {
              const calcRating = (team: Player[]) =>
                team.length ? team.reduce((acc, p) => acc + draftService.calculatePowerLevel(p), 0) / team.length : 0;

              setDraftResult({
                homeTeam: homePlayers,
                awayTeam: awayPlayers,
                waitingList: waitingPlayers,
                homeRating: calcRating(homePlayers),
                awayRating: calcRating(awayPlayers),
              });
              setActiveTab('match');
            } else {
              // Jogadores confirmados mas sem time atribuído ainda → chamada
              setActiveTab('attendance');
            }
          } else {
            // Partida nova sem presença → vai para chamada
            setActiveTab('attendance');
          }
        }
      }
      setLoading(false);
    }
    init();
  }, [slug]);

  // Atualiza formações quando sport/playersPerTeam muda
  useEffect(() => {
    const def = defaultFormation(config.sport_type, config.playersPerTeam);
    setHomeFormation(def);
    setAwayFormation(def);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.sport_type, config.playersPerTeam]);

  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToMatch(matchId, updated => {
      setScore({ home: updated.home_score, away: updated.away_score });
      setStatus(updated.status);
      if (updated.status !== 'Em curso') {
        setAccumulatedTime(updated.timer_seconds);
        setTimer(updated.timer_seconds);
        setStartTime(null);
      }
    });
    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  // Realtime: eventos registrados por qualquer pessoa aparecem no feed ao vivo
  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToEvents(matchId, (raw) => {
      setEvents(prev => {
        if (prev.some(e => e.id === raw.id)) return prev; // evita duplicar (quem registrou já tem)
        const player = allPlayers.find(p => p.id === raw.player_id);
        const enriched = { ...raw, player: player ? { name: player.name } : undefined };
        return [enriched, ...prev]; // placar sincroniza via subscribeToMatch
      });
    });
    return () => { supabase.removeChannel(sub); };
  }, [matchId, allPlayers]);

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
    const newStatus: MatchStatus = status === 'Em curso' ? 'Pausada' : 'Em curso';
    let newAccumulated = accumulatedTime;

    if (status === 'Em curso') {
      const elapsed = Math.floor((now - (startTime || now)) / 1000);
      newAccumulated = accumulatedTime + elapsed;
      setAccumulatedTime(newAccumulated);
      setStartTime(null);
    } else {
      setStartTime(now);
    }
    setStatus(newStatus);
    if (matchId) {
      await matchRepo.update(matchId, { status: newStatus, timer_seconds: newAccumulated }).catch(console.error);
    }
  };

  const handleAddEvent = async (playerId: string, team: 'home' | 'away', type: CoreEventType) => {
    if (!matchId) return;
    try {
      const newEvent = await matchRepo.addEvent({ match_id: matchId, player_id: playerId, type, team, minute: Math.floor(timer / 60) });
      setEvents(prev => [newEvent, ...prev]);
      if (type === 'Gol') {
        const ns = { home: team === 'home' ? score.home + 1 : score.home, away: team === 'away' ? score.away + 1 : score.away };
        setScore(ns);
        await matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
      }
      setIsEventModalOpen(false);
    } catch (error) { console.error(error); }
  };

  // Elege o Craque da Partida (salvo como evento type 'Craque', sem migração)
  const handleElectMVP = async (playerId: string, team: 'home' | 'away') => {
    if (!matchId) return;
    try {
      const newEvent = await matchRepo.addEvent({
        match_id: matchId, player_id: playerId, type: 'Craque', team, minute: Math.floor(timer / 60),
      });
      setEvents(prev => [newEvent, ...prev.filter(e => e.type !== 'Craque')]); // 1 craque por partida
      setMvpPlayerId(playerId);
    } catch (error) { console.error(error); }
  };

  const togglePlayerAttendance = async (id: string) => {
    const isPresent = selectedPlayerIds.includes(id);
    setSelectedPlayerIds(prev => isPresent ? prev.filter(pId => pId !== id) : [...prev, id]);
    if (matchId) {
      await matchRepo.setPlayerPresence(matchId, id, !isPresent).catch(console.error);
    }
  };

  // Cria o registro da partida no banco
  const createMatchRecord = async (extraFields: Record<string, any> = {}) => {
    if (!groupId) return null;
    try {
      return await matchRepo.create({
        group_id: groupId,
        date: new Date().toISOString(),
        status: 'Agendada',
        home_score: 0,
        away_score: 0,
        home_team_name: config.homeTeamName || 'Time A',
        away_team_name: config.awayTeamName || 'Time B',
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
        match_fee: 0,
        ...extraFields,
      });
    } catch {
      // fallback sem colunas novas
      try {
        return await matchRepo.create({
          group_id: groupId,
          date: new Date().toISOString(),
          status: 'Agendada',
          home_score: 0,
          away_score: 0,
          timer_seconds: 0,
          duration_minutes: config.duration,
          stoppage_minutes: config.stoppage,
          goal_limit: config.goalLimit,
        } as any);
      } catch (fbErr) {
        console.error('Fallback de criação falhou:', fbErr);
        return null;
      }
    }
  };

  // Sorteio (modo Rachão / Bolão)
  const handleDraft = async () => {
    const realPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
    const guests: Player[] = guestPlayers.map((name, i) => ({
      id: `guest-${i}-${Date.now()}`,
      name: `${name} (Avulso)`,
      group_id: groupId || '',
      rating: 3,
      skill_level: 5,
      positions: ['SA'] as any,
      status: 'Ativo',
      is_mensalista: false,
    } as Player));

    const totalAvailable = [...realPlayers, ...guests];
    if (totalAvailable.length < 2) return alert('Mínimo de 2 jogadores!');

    const playersPerTeam = SPORT_PLAYERS[config.sport_type] ?? config.playersPerTeam;
    const isReal = (p: Player) => !p.id.startsWith('guest-');

    if (config.game_mode === 'Bolão') {
      // ── Modo Bolão: múltiplos times com torneio ──────────────────────────
      const result = draftService.generateBolao(totalAvailable, playersPerTeam);
      const allTeams = result.allTeams ?? [result.homeTeam, result.awayTeam];

      const newBolao = tournamentSvc.initBolao(allTeams);
      setBolaoState(newBolao);

      const homeTeam = allTeams.find((_, i) => `team-${i}` === newBolao.currentHomeId) ?? allTeams[0];
      const awayTeam = allTeams.find((_, i) => `team-${i}` === newBolao.currentAwayId) ?? allTeams[1];

      const calcRating = (players: Player[]) =>
        players.length ? players.reduce((acc, p) => acc + draftService.calculatePowerLevel(p), 0) / players.length : 0;

      setDraftResult({
        homeTeam,
        awayTeam,
        waitingList: allTeams.filter((_, i) => !['currentHomeId', 'currentAwayId'].includes(`team-${i}`)).flat(),
        homeRating: calcRating(homeTeam),
        awayRating: calcRating(awayTeam),
      });

      const newMatch = await createMatchRecord({ match_type: 'rachao', game_mode: 'Bolão' });
      if (newMatch) {
        setMatchId(newMatch.id);
        const presencePayload = totalAvailable.filter(isReal).map(p => ({ player_id: p.id, team: 'waiting' }));
        await matchRepo.savePresenceBatch(newMatch.id, presencePayload);
      }

      setSessionPhase('active');
      setActiveTab('bolao' as any);
      return;
    }

    // ── Modo Rachão padrão ───────────────────────────────────────────────
    const result = draftService.balanceTeams(totalAvailable, playersPerTeam);
    setDraftResult(result);

    const newMatch = await createMatchRecord({ match_type: 'rachao' });
    if (newMatch) {
      setMatchId(newMatch.id);
      const presencePayload = [
        ...result.homeTeam.filter(isReal).map(p => ({ player_id: p.id, team: 'home' })),
        ...result.awayTeam.filter(isReal).map(p => ({ player_id: p.id, team: 'away' })),
        ...result.waitingList.filter(isReal).map(p => ({ player_id: p.id, team: 'waiting' })),
      ];
      await matchRepo.savePresenceBatch(newMatch.id, presencePayload);
    }

    setSessionPhase('active');
    setActiveTab('match');
  };

  // Confirmação de times (modo Manual / Time Contra Time)
  const handleConfirmTeams = async () => {
    const homeStarters = allPlayers.filter(p => teamAssignments[p.id] === 'home-starter');
    const homeReserves = allPlayers.filter(p => teamAssignments[p.id] === 'home-reserve');
    const awayStarters = allPlayers.filter(p => teamAssignments[p.id] === 'away-starter');
    const awayReserves = allPlayers.filter(p => teamAssignments[p.id] === 'away-reserve');

    const homeTeam   = [...homeStarters, ...homeReserves];
    const awayTeam   = [...awayStarters, ...awayReserves];
    const waitingList = allPlayers.filter(p => !teamAssignments[p.id]);

    const calcRating = (team: Player[]) =>
      team.length ? team.reduce((acc, p) => acc + draftService.calculatePowerLevel(p), 0) / team.length : 0;

    setDraftResult({
      homeTeam,
      awayTeam,
      waitingList,
      allTeams: [homeTeam, awayTeam],
      homeRating: calcRating(homeTeam),
      awayRating: calcRating(awayTeam),
    });

    const newMatch = await createMatchRecord({ match_type: 'manual' });
    if (newMatch) {
      setMatchId(newMatch.id);
      const presencePayload = [
        ...homeTeam.map(p => ({ player_id: p.id, team: 'home' })),
        ...awayTeam.map(p => ({ player_id: p.id, team: 'away' })),
        ...waitingList.map(p => ({ player_id: p.id, team: 'waiting' })),
      ];
      await matchRepo.savePresenceBatch(newMatch.id, presencePayload);
    }

    setSessionPhase('active');
    setActiveTab('match');
  };

  // Próxima partida — Bolão
  const handleBolaoNext = (winner: 'home' | 'away' | 'draw') => {
    if (!bolaoState) return;
    const newBolao = tournamentSvc.processResult(bolaoState, score.home, score.away);
    setBolaoState(newBolao);

    if (newBolao.phase === 'done') {
      setStatus('Finalizada');
      return;
    }

    const allTeams = newBolao.teams;
    const homeTeam = allTeams.find(t => t.id === newBolao.currentHomeId)?.players ?? [];
    const awayTeam = allTeams.find(t => t.id === newBolao.currentAwayId)?.players ?? [];
    const calcRating = (ps: Player[]) =>
      ps.length ? ps.reduce((acc, p) => acc + draftService.calculatePowerLevel(p), 0) / ps.length : 0;

    setDraftResult({
      homeTeam, awayTeam,
      waitingList: newBolao.queue.flatMap(id => allTeams.find(t => t.id === id)?.players ?? []),
      homeRating: calcRating(homeTeam),
      awayRating: calcRating(awayTeam),
    });

    const homeTeamRec = newBolao.teams.find(t => t.id === newBolao.currentHomeId);
    const awayTeamRec = newBolao.teams.find(t => t.id === newBolao.currentAwayId);
    setConfig(prev => ({
      ...prev,
      homeTeamName: homeTeamRec?.name ?? prev.homeTeamName,
      awayTeamName: awayTeamRec?.name ?? prev.awayTeamName,
    }));

    setScore({ home: 0, away: 0 });
    setTimer(0); setAccumulatedTime(0); setStartTime(null); setStatus('Pausada');
  };

  // Próxima partida — Rachão (revezamento) — com seleção do próximo time
  const handleNextMatch = async (winner: 'home' | 'away' | 'draw') => {
    if (bolaoState) { handleBolaoNext(winner); return; }
    if (!draftResult) return;

    // Determina quem sai: o perdedor (ou se 2 vitórias consecutivas, o vencedor)
    const loserTeam  = winner === 'home' ? draftResult.awayTeam : draftResult.homeTeam;
    const loserName  = winner === 'home'
      ? (config.awayTeamName || 'Time B')
      : (config.homeTeamName || 'Time A');

    // Próximo time da fila (se houver)
    const nextFromQueue = teamsQueue[0] ?? [];

    // Mostra modal de seleção do próximo time
    setNextTeamCtx({
      outgoingName: loserName,
      incomingTeam: nextFromQueue,
      winnerResult: winner,
    });
  };

  // Executa a troca após o admin confirmar o próximo time no modal
  const confirmNextTeam = async (incomingTeam: Player[]) => {
    if (!draftResult || !nextTeamCtx) return;
    const winner = nextTeamCtx.winnerResult;
    setNextTeamCtx(null);

    // A fila já teve o primeiro time "mostrado" no modal — removemos ele
    const newQueue = teamsQueue.slice(1);

    let newConsecutive = winner === lastWinnerId ? consecutiveWins + 1 : 1;
    let nextHome: Player[];
    let nextAway: Player[];

    if (winner === 'home') {
      // Vencedor (home) permanece; perdedor (away) vai pro fim da fila
      nextHome = draftResult.homeTeam;
      nextAway = incomingTeam; // time confirmado no modal
      if (newConsecutive >= 2) {
        // Vencedor também sai após 2 vitórias seguidas
        newQueue.push(nextHome);
        nextHome = newQueue.shift() ?? [];
        newConsecutive = 0;
      }
      newQueue.push(draftResult.awayTeam); // perdedor ao fim da fila
      setLastWinnerId('home');
    } else if (winner === 'away') {
      nextAway = draftResult.awayTeam;
      nextHome = incomingTeam;
      if (newConsecutive >= 2) {
        newQueue.push(nextAway);
        nextAway = newQueue.shift() ?? [];
        newConsecutive = 0;
      }
      newQueue.push(draftResult.homeTeam);
      setLastWinnerId('away');
    } else {
      // Empate: mantém os times, traz próximo da fila para a fila
      nextHome = draftResult.homeTeam;
      nextAway = incomingTeam.length > 0 ? incomingTeam : draftResult.awayTeam;
      newConsecutive = 0;
    }

    const calcRating = (team: Player[]) =>
      team.length ? team.reduce((acc, p) => acc + draftService.calculatePowerLevel(p), 0) / team.length : 0;

    const newDraft: DraftResult = {
      homeTeam: nextHome,
      awayTeam: nextAway,
      waitingList: newQueue.flat(),
      homeRating: calcRating(nextHome),
      awayRating: calcRating(nextAway),
    };

    setDraftResult(newDraft);
    setTeamsQueue(newQueue);
    setConsecutiveWins(newConsecutive);
    setScore({ home: 0, away: 0 });
    setTimer(0); setAccumulatedTime(0); setStartTime(null);
    setMvpPlayerId(null);
    setStatus('Agendada'); // volta para "Agendada" → mostrará botão INICIAR PARTIDA

    const nextMatch = await createMatchRecord({ match_type: matchType });
    if (nextMatch) {
      setMatchId(nextMatch.id);
      const isReal = (p: Player) => !p.id.startsWith('guest-');
      const presencePayload = [
        ...nextHome.filter(isReal).map(p => ({ player_id: p.id, team: 'home' })),
        ...nextAway.filter(isReal).map(p => ({ player_id: p.id, team: 'away' })),
        ...newQueue.flat().filter(isReal).map(p => ({ player_id: p.id, team: 'waiting' })),
      ];
      await matchRepo.savePresenceBatch(nextMatch.id, presencePayload);
    }
    setActiveTab('match');
  };

  const handleNewMatch = () => {
    setDraftResult(null);
    setTeamsQueue([]);
    setConsecutiveWins(0);
    setScore({ home: 0, away: 0 });
    setTimer(0);
    setAccumulatedTime(0);
    setStartTime(null);
    setStatus('Pausada');
    setMatchId(null);
    setEvents([]);
    setMatchType('rachao');
    setSessionPhase('idle');
    setTeamAssignments({});
    setBolaoState(null);
    setNextTeamCtx(null);
    setMvpPlayerId(null);
    setTieBreakOpen(false);
    setActiveTab('attendance');
  };

  const handleAssignPlayer = (playerId: string, role: PlayerRole | null) => {
    setTeamAssignments(prev => {
      if (role === null) {
        const next = { ...prev };
        delete next[playerId];
        return next;
      }
      return { ...prev, [playerId]: role };
    });
  };

  const isBolao = config.game_mode === 'Bolão' && !!bolaoState;

  const tabs: Tab[] = [
    { id: 'attendance', label: 'Chamada',       icon: faListCheck, hidden: isBolao },
    { id: 'bolao',      label: 'Classificação', icon: faTableList, hidden: !isBolao },
    { id: 'match',      label: 'Partida',        icon: faStopwatch },
    { id: 'stats',      label: 'Sumula',         icon: faFutbol },
    { id: 'settings',   label: 'Ajustes',        icon: faGear },
  ].filter(t => !t.hidden) as Tab[];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-12 pb-32 relative font-inter">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div />
        {sessionPhase === 'idle' && userRole !== 'viewer' && (
          <button
            onClick={() => setIsCreateMatchModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> CRIAR PARTIDA
          </button>
        )}
      </div>

      {/* ── FASE 1: Idle ─────────────────────────────────────────────────── */}
      {sessionPhase === 'idle' && (
        <div className="py-24 text-center">
          <GlassCard className="max-w-md mx-auto p-8 border-dashed border-white/20">
            <FontAwesomeIcon icon={faFutbol} className="text-5xl text-white/10 mb-6" />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">
              Nenhuma partida rolando
            </h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-8">
              Crie uma partida para iniciar o sorteio ou escalar os times.
            </p>
            {userRole !== 'viewer' && (
              <button
                onClick={() => setIsCreateMatchModalOpen(true)}
                className="px-8 py-4 w-full bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> CRIAR NOVA PARTIDA
              </button>
            )}
          </GlassCard>
        </div>
      )}

      {/* ── FASE 2: Setup (pré-sorteio) ──────────────────────────────────── */}
      {sessionPhase === 'setup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                {matchType === 'manual' ? 'ESCALANDO TIMES' : 'SELECIONANDO JOGADORES'}
              </span>
            </div>
            <button
              onClick={handleNewMatch}
              className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
            >
              CANCELAR
            </button>
          </div>

          {matchType === 'rachao' && (
            <AttendanceTab
              allPlayers={allPlayers}
              selectedPlayerIds={selectedPlayerIds}
              togglePlayerAttendance={togglePlayerAttendance}
              setIsAddModalOpen={setIsAddModalOpen}
              slug={slug}
              matchId={matchId}
              guestInput={guestInput}
              setGuestInput={setGuestInput}
              guestPlayers={guestPlayers}
              setGuestPlayers={setGuestPlayers}
              handleDraft={handleDraft}
              userRole={userRole}
              matchType="rachao"
              setSelectedPlayerIds={setSelectedPlayerIds}
              homeFormations={availableFormations}
              awayFormations={availableFormations}
              homeFormationId={homeFormation.id}
              awayFormationId={awayFormation.id}
              homeTeamName={config.homeTeamName || 'Time A'}
              awayTeamName={config.awayTeamName || 'Time B'}
              onSelectHomeFormation={id => { const f = availableFormations.find(x => x.id === id); if (f) setHomeFormation(f); }}
              onSelectAwayFormation={id => { const f = availableFormations.find(x => x.id === id); if (f) setAwayFormation(f); }}
            />
          )}

          {matchType === 'manual' && (
            <TeamAssignmentTab
              allPlayers={allPlayers}
              homeTeamName={config.homeTeamName || 'Time A'}
              awayTeamName={config.awayTeamName || 'Time B'}
              assignments={teamAssignments}
              onAssign={handleAssignPlayer}
              onConfirm={handleConfirmTeams}
              userRole={userRole}
            />
          )}
        </div>
      )}

      {/* ── FASE 3a: Partida criada mas SEM sorteio → chamada sem scoreboard ── */}
      {sessionPhase === 'active' && matchId && !draftResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                {matchType === 'manual' ? 'ESCALANDO TIMES' : 'SELECIONANDO JOGADORES'}
              </span>
            </div>
            <button onClick={handleNewMatch}
              className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
              CANCELAR
            </button>
          </div>

          {matchType !== 'manual' && (
            <AttendanceTab
              allPlayers={allPlayers} selectedPlayerIds={selectedPlayerIds}
              togglePlayerAttendance={togglePlayerAttendance} setIsAddModalOpen={setIsAddModalOpen}
              slug={slug} matchId={matchId} guestInput={guestInput} setGuestInput={setGuestInput}
              guestPlayers={guestPlayers} setGuestPlayers={setGuestPlayers}
              handleDraft={handleDraft} userRole={userRole} matchType="rachao"
              setSelectedPlayerIds={setSelectedPlayerIds}
              homeFormations={availableFormations}
              awayFormations={availableFormations}
              homeFormationId={homeFormation.id}
              awayFormationId={awayFormation.id}
              homeTeamName={config.homeTeamName || 'Time A'}
              awayTeamName={config.awayTeamName || 'Time B'}
              onSelectHomeFormation={id => { const f = availableFormations.find(x => x.id === id); if (f) setHomeFormation(f); }}
              onSelectAwayFormation={id => { const f = availableFormations.find(x => x.id === id); if (f) setAwayFormation(f); }}
            />
          )}

          {matchType === 'manual' && (
            <TeamAssignmentTab
              allPlayers={allPlayers}
              homeTeamName={config.homeTeamName || 'Time A'}
              awayTeamName={config.awayTeamName || 'Time B'}
              assignments={teamAssignments}
              onAssign={handleAssignPlayer}
              onConfirm={handleConfirmTeams}
              userRole={userRole}
            />
          )}
        </div>
      )}

      {/* ── FASE 3b: Sorteio feito → scoreboard + tabs completos ────────── */}
      {sessionPhase === 'active' && matchId && draftResult && (
        <>
          <ScoreboardV2
            homeScore={score.home} awayScore={score.away}
            homeTeamName={config.homeTeamName} awayTeamName={config.awayTeamName}
            homeColor={config.homeColor} awayColor={config.awayColor}
            timer={timer} status={status}
            onToggleTimer={toggleTimer}
            onStopMatch={async () => {
              setStartTime(null); setAccumulatedTime(0); setTimer(0); setStatus('Pausada');
              if (matchId) await matchRepo.update(matchId, { status: 'Finalizada', timer_seconds: 0 });
            }}
            onUpdateConfig={updates => {
              if (updates.homeScore !== undefined || updates.awayScore !== undefined) {
                const ns = { home: updates.homeScore ?? score.home, away: updates.awayScore ?? score.away };
                setScore(ns);
                if (matchId) matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
              } else {
                setConfig(prev => ({ ...prev, ...updates }));
              }
            }}
          />

          <MatchBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
            waitingCount={teamsQueue.length}
          />

          <div className="mt-8">
            {activeTab === 'bolao' && bolaoState && (
              <BolaoTab bolaoState={bolaoState} />
            )}
            {activeTab === 'attendance' && (
              <AttendanceTab
                allPlayers={allPlayers} selectedPlayerIds={selectedPlayerIds}
                togglePlayerAttendance={togglePlayerAttendance} setIsAddModalOpen={setIsAddModalOpen}
                slug={slug} matchId={matchId} guestInput={guestInput} setGuestInput={setGuestInput}
                guestPlayers={guestPlayers} setGuestPlayers={setGuestPlayers}
                handleDraft={handleDraft} userRole={userRole} matchType={matchType === 'desafio' ? 'desafio' : 'rachao'}
                setSelectedPlayerIds={setSelectedPlayerIds}
                homeFormations={availableFormations}
                awayFormations={availableFormations}
                homeFormationId={homeFormation.id}
                awayFormationId={awayFormation.id}
                homeTeamName={config.homeTeamName || 'Time A'}
                awayTeamName={config.awayTeamName || 'Time B'}
                onSelectHomeFormation={id => { const f = availableFormations.find(x => x.id === id); if (f) setHomeFormation(f); }}
                onSelectAwayFormation={id => { const f = availableFormations.find(x => x.id === id); if (f) setAwayFormation(f); }}
              />
            )}
            {activeTab === 'match' && (
              <ActiveMatchTab
                draftResult={draftResult} config={config} setConfig={setConfig}
                score={score} timer={timer} status={status}
                setActiveTab={setActiveTab} matchType={matchType === 'desafio' ? 'desafio' : 'rachao'}
                onStartMatch={status === 'Agendada' ? toggleTimer : undefined}
                homeFormation={homeFormation}
                awayFormation={awayFormation}
                events={events}
              />
            )}
            {activeTab === 'stats' && (
              <StatsTab
                userRole={userRole} handleNewMatch={handleNewMatch} draftResult={draftResult}
                setSelectedEventType={setSelectedEventType} setIsEventModalOpen={setIsEventModalOpen}
                events={events}
                onElectMVP={handleElectMVP} mvpPlayerId={mvpPlayerId}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                config={config} setConfig={setConfig} handleSaveConfig={handleSaveConfig}
                loading={loading} userRole={userRole} editorInput={editorInput}
                setEditorInput={setEditorInput} editors={editors} setEditors={setEditors}
                groupId={groupId} groupRepo={groupRepo} supabase={supabase}
              />
            )}
          </div>
        </>
      )}

      {/* Modal de desempate */}
      {tieBreakOpen && draftResult && (
        <TieBreakModal
          homeTeamName={config.homeTeamName || 'Time A'}
          awayTeamName={config.awayTeamName || 'Time B'}
          onClose={() => setTieBreakOpen(false)}
          onResolve={(winner) => { setTieBreakOpen(false); handleNextMatch(winner); }}
        />
      )}

      {/* Modal de seleção do próximo time */}
      {nextTeamCtx && draftResult && (
        <NextTeamModal
          outgoingTeamName={nextTeamCtx.outgoingName}
          incomingTeam={nextTeamCtx.incomingTeam}
          winnerTeam={nextTeamCtx.winnerResult === 'home' ? draftResult.homeTeam : draftResult.awayTeam}
          winnerTeamName={nextTeamCtx.winnerResult === 'home' ? (config.homeTeamName || 'Time A') : (config.awayTeamName || 'Time B')}
          availablePlayers={allPlayers.filter(p => selectedPlayerIds.includes(p.id))}
          playersPerTeam={SPORT_PLAYERS[config.sport_type] ?? config.playersPerTeam}
          onConfirm={confirmNextTeam}
          onCancel={() => setNextTeamCtx(null)}
        />
      )}

      {/* Overlay de fim de partida */}
      {status === 'Finalizada' && draftResult && sessionPhase === 'active' && bolaoState?.phase !== 'done' && !nextTeamCtx && !tieBreakOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-8 rounded-3xl border-primary/20 text-center">
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8 italic">
              Partida Encerrada! Quem venceu?
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => handleNextMatch('home')} className="py-5 bg-primary text-black font-black uppercase tracking-widest rounded-xl">
                {config.homeTeamName || 'TIME A'} GANHOU
              </button>
              <button onClick={() => setTieBreakOpen(true)} className="py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black uppercase tracking-widest rounded-xl">
                EMPATE — DESEMPATAR
              </button>
              <button onClick={() => handleNextMatch('away')} className="py-5 bg-primary text-black font-black uppercase tracking-widest rounded-xl">
                {config.awayTeamName || 'TIME B'} GANHOU
              </button>
            </div>

            {/* Compartilhar resultado no WhatsApp */}
            <button
              onClick={() => {
                const scorersMap = new Map<string, { name: string; team: 'home' | 'away'; goals: number }>();
                events.filter(e => e.type === 'Gol').forEach(e => {
                  const name = (e as any).player?.name ?? '?';
                  const key = e.player_id;
                  if (!scorersMap.has(key)) scorersMap.set(key, { name, team: e.team, goals: 0 });
                  scorersMap.get(key)!.goals++;
                });
                openWhatsApp(buildResultMessage(
                  config.homeTeamName || 'Time A', config.awayTeamName || 'Time B',
                  score.home, score.away, Array.from(scorersMap.values()),
                ));
              }}
              className="w-full mt-4 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px]"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
            >
              <FontAwesomeIcon icon={faWhatsapp} className="text-sm" />
              Compartilhar Resultado
            </button>
          </GlassCard>
        </div>
      )}

      {/* Modal de eventos (Gols/Cartões) */}
      {isEventModalOpen && draftResult && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-8 rounded-3xl border-primary/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white uppercase italic">Registrar Evento</h2>
              <button onClick={() => setIsEventModalOpen(false)} className="text-white/20 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>
            <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
              {['Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho'].map(type => (
                <button key={type} onClick={() => setSelectedEventType(type as any)}
                  className={`flex-1 py-3 text-[9px] font-black uppercase rounded-lg transition-all ${selectedEventType === type ? 'bg-primary text-black' : 'text-white/40'}`}>
                  {type}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-8">
              {(['home', 'away'] as const).map(side => (
                <div key={side} className="space-y-4">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                    {side === 'home' ? (config.homeTeamName || 'TIME A') : (config.awayTeamName || 'TIME B')}
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {draftResult[side === 'home' ? 'homeTeam' : 'awayTeam'].map(p => (
                      <button key={p.id} onClick={() => handleAddEvent(p.id, side, selectedEventType)}
                        className="w-full p-3 bg-white/5 border border-white/5 hover:border-primary/40 rounded-lg text-left group">
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

      {/* Modal de adicionar jogador */}
      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async p => {
          const np = await playerRepo.create(p);
          if (groupId) fetchPlayers(groupId);
          setSelectedPlayerIds(prev => [...prev, np.id]);
          setIsAddModalOpen(false);
        }}
        groupId={groupId || ''}
      />

      {/* Modal de criação de partida */}
      <CreateMatchModal
        isOpen={isCreateMatchModalOpen}
        onClose={() => setIsCreateMatchModalOpen(false)}
        onCreateMatch={cfg => {
          setMatchType((cfg.match_type || 'rachao') as MatchType);
          setConfig(prev => ({
            ...prev,
            duration:       cfg.duration,
            stoppage:       cfg.stoppage,
            goalLimit:      cfg.goalLimit,
            homeColor:      cfg.home_color,
            awayColor:      cfg.away_color,
            homeTeamName:   cfg.home_team_name,
            awayTeamName:   cfg.away_team_name,
            sport_type:     cfg.sport_type,
            game_mode:      cfg.game_mode,
            playersPerTeam: cfg.playersPerTeam,
            location:       cfg.location,
          }));
          setSessionPhase('setup');
          setActiveTab('attendance');
          setIsCreateMatchModalOpen(false);
        }}
      />
    </div>
  );
}
