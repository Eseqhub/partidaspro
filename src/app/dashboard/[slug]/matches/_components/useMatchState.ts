'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/infra/supabase/client';
import { Player } from '@/core/entities/player';
import { Match, SportType, GameMode, MatchStatus, MatchType } from '@/core/entities/match';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { DraftService, DraftResult } from '@/core/services/DraftService';
import { TournamentService, BolaoState } from '@/core/services/TournamentService';
import { Formation, getFormations, defaultFormation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';
import { AudioService } from '@/infra/services/AudioService';
import { PlayerRole } from '@/presentation/components/dashboard/matches/tabs/TeamAssignmentTab';
import { EventType as CoreEventType } from '@/core/entities/match';

const SPORT_PLAYERS: Record<string, number> = {
  Futsal: 5,
  Society: 7,
  Campo: 11,
};

export type SessionPhase = 'idle' | 'setup' | 'active';

export function useMatchState(slug: string) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'match' | 'stats' | 'settings' | 'bolao'>('attendance');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle');
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
    tipo_campo: '' as string,
    max_players: 14,
    max_goalkeepers: 2,
    rules_text: '',
    recurrence_day: 'Segunda-feira',
    description: '',
    founded_year: new Date().getFullYear(),
  });
  const [bolaoState, setBolaoState] = useState<BolaoState | null>(null);
  const [nextTeamCtx, setNextTeamCtx] = useState<{
    outgoingName: string;
    incomingTeam: Player[];
    winnerResult: 'home' | 'away' | 'draw';
  } | null>(null);
  const [mvpPlayerId, setMvpPlayerId] = useState<string | null>(null);
  const [tieBreakOpen, setTieBreakOpen] = useState(false);
  const [homeFormation, setHomeFormation] = useState<Formation>(defaultFormation('Society', 7));
  const [awayFormation, setAwayFormation] = useState<Formation>(defaultFormation('Society', 7));

  const playerRepo    = new PlayerRepository();
  const groupRepo     = new GroupRepository();
  const matchRepo     = new MatchRepository();
  const draftService  = new DraftService();
  const tournamentSvc = new TournamentService();
  const audioService  = new AudioService();

  // Ref para evitar closure stale nos subscriptions de grupo
  const matchIdRef = useRef<string | null>(null);
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);

  // Offset entre o relógio local e o relógio do servidor (ms).
  // Garante que celular e PC contem o tempo pelo MESMO relógio (o do servidor).
  const clockOffsetRef = useRef<number>(0);
  // "Agora" corrigido para o horário do servidor.
  const serverNow = () => Date.now() + clockOffsetRef.current;

  // Mede o offset do relógio uma vez ao montar (degrada para 0 se a função não existir).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t0 = Date.now();
        const { data, error } = await supabase.rpc('get_server_time');
        const t1 = Date.now();
        if (error || !data || cancelled) return;
        const serverMs = new Date(data as string).getTime();
        // Compensa metade do round-trip para estimar o "agora" do servidor.
        const localMid = t0 + (t1 - t0) / 2;
        clockOffsetRef.current = serverMs - localMid;
      } catch { /* mantém offset 0 */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const availableFormations = getFormations(config.sport_type, config.playersPerTeam);

  const fetchPlayers = async (id: string) => {
    try {
      const data = await playerRepo.findAllByGroupId(id);
      setAllPlayers(data);
    } catch (err) {
      console.error(err);
    }
  };

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

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      const group = await groupRepo.findBySlug(slug);

      if (group && user) {
        setGroupId(group.id);
        const playersLocal = await playerRepo.findAllByGroupId(group.id).catch(() => [] as Player[]);
        setAllPlayers(playersLocal);

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
          setStatus(liveMatch.status);
          if (liveMatch.status === 'Em curso') {
            if (liveMatch.timer_started_at) {
              // Tempo exato: reconstrói a partir do timestamp salvo (relógio do servidor)
              const startedAt = new Date(liveMatch.timer_started_at).getTime();
              const currentTotal = liveMatch.timer_seconds + Math.floor((serverNow() - startedAt) / 1000);
              setTimer(currentTotal);
              setStartTime(startedAt);
            } else {
              // Auto-repair: match rodando sem timer_started_at (deploy antigo)
              // Salva agora para que próximos reloads sejam precisos
              const now = serverNow();
              setTimer(liveMatch.timer_seconds);
              setStartTime(now);
              matchRepo.update(liveMatch.id, {
                timer_started_at: new Date(now).toISOString(),
              }).catch(console.error);
            }
          } else {
            setTimer(liveMatch.timer_seconds);
          }

          const resolvedType: MatchType =
            liveMatch.match_type === 'manual'  ? 'manual'
            : liveMatch.match_type === 'desafio' ? 'desafio'
            : (liveMatch as any).modality === 'Manual'  ? 'manual'
            : (liveMatch as any).modality === 'Bolão'   ? 'rachao'
            : 'rachao';
          setMatchType(resolvedType);
          if ((liveMatch as any).modality === 'Bolão') {
            setConfig(prev => ({ ...prev, game_mode: 'Bolão' }));
          }
          setSessionPhase('active');

          const matchEvents = await matchRepo.getEvents(liveMatch.id);
          setEvents(matchEvents);

          const fieldTypePPT: Record<string, number> = {
            'Futsal 5x5': 5, 'Society 6x6': 6, 'Society 7x7': 7, 'Campo 11x11': 11,
          };
          setConfig(prev => ({
            ...prev,
            homeTeamName:    liveMatch.home_team_name   || prev.homeTeamName,
            awayTeamName:    liveMatch.away_team_name   || prev.awayTeamName,
            homeColor:       liveMatch.home_color       || prev.homeColor,
            awayColor:       liveMatch.away_color       || prev.awayColor,
            duration:        liveMatch.duration_minutes || prev.duration,
            stoppage:        liveMatch.stoppage_minutes ?? prev.stoppage,
            goalLimit:       liveMatch.goal_limit       ?? prev.goalLimit,
            sport_type:     (liveMatch.sport_type as any) || prev.sport_type,
            playersPerTeam:  fieldTypePPT[liveMatch.field_type || ''] ?? prev.playersPerTeam,
            tipo_campo:      liveMatch.field_type || prev.tipo_campo,
          }));

          const presence = await matchRepo.getPresence(liveMatch.id);
          if (presence.length > 0) {
            const resolvePlayer = (p: any): Player | null =>
              p.player ?? playersLocal.find((pl: Player) => pl.id === p.player_id) ?? null;
            const homePlayers    = presence.filter((p: any) => p.team === 'home').map(resolvePlayer).filter(Boolean) as Player[];
            const awayPlayers    = presence.filter((p: any) => p.team === 'away').map(resolvePlayer).filter(Boolean) as Player[];
            const waitingPlayers = presence.filter((p: any) => !p.team || p.team === 'waiting').map(resolvePlayer).filter(Boolean) as Player[];
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
              setActiveTab('attendance');
            }
          } else {
            setActiveTab('attendance');
          }
        }
      }
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Atualiza formações quando sport/playersPerTeam muda
  useEffect(() => {
    const def = defaultFormation(config.sport_type, config.playersPerTeam);
    setHomeFormation(def);
    setAwayFormation(def);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.sport_type, config.playersPerTeam]);

  // Realtime: match
  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToMatch(matchId, updated => {
      setScore({ home: updated.home_score, away: updated.away_score });
      setStatus(updated.status);
      if (updated.status === 'Em curso' && updated.timer_started_at) {
        const startedAt = new Date(updated.timer_started_at).getTime();
        setAccumulatedTime(updated.timer_seconds);
        setStartTime(startedAt);
      } else {
        setAccumulatedTime(updated.timer_seconds);
        setTimer(updated.timer_seconds);
        setStartTime(null);
      }
    });
    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Realtime: eventos
  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToEvents(matchId, (raw) => {
      setEvents(prev => {
        if (prev.some(e => e.id === raw.id)) return prev;
        const player = allPlayers.find(p => p.id === raw.player_id);
        const enriched = { ...raw, player: player ? { name: player.name } : undefined };
        return [enriched, ...prev];
      });
    });
    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, allPlayers]);

  // Realtime: nova partida criada no grupo (outros dispositivos recebem a partida)
  useEffect(() => {
    if (!groupId) return;
    const sub = matchRepo.subscribeToGroupMatches(groupId, async (m: any) => {
      if (!m?.id) return;
      // Ignora se já temos essa partida ou se está finalizada
      if (matchIdRef.current === m.id) return;
      if (m.status === 'Finalizada') return;

      setMatchId(m.id);
      setScore({ home: m.home_score ?? 0, away: m.away_score ?? 0 });
      setStatus(m.status as MatchStatus);
      setAccumulatedTime(m.timer_seconds ?? 0);
      setTimer(m.timer_seconds ?? 0);
      setStartTime(null);
      setSessionPhase('active');

      const resolvedType: MatchType =
        m.match_type === 'manual'  ? 'manual'
        : m.match_type === 'desafio' ? 'desafio'
        : m.modality === 'Bolão' ? 'rachao'
        : 'rachao';
      setMatchType(resolvedType);

      setConfig((prev: any) => ({
        ...prev,
        homeTeamName: m.home_team_name   ?? prev.homeTeamName,
        awayTeamName: m.away_team_name   ?? prev.awayTeamName,
        homeColor:    m.home_color       ?? prev.homeColor,
        awayColor:    m.away_color       ?? prev.awayColor,
        duration:     m.duration_minutes ?? prev.duration,
        stoppage:     m.stoppage_minutes ?? prev.stoppage,
        goalLimit:    m.goal_limit       ?? prev.goalLimit,
        sport_type:  (m.sport_type as SportType)  ?? prev.sport_type,
        game_mode:   (m.modality  as GameMode)    ?? prev.game_mode,
      }));

      const ev = await matchRepo.getEvents(m.id);
      setEvents(ev);

      // Aguarda os inserts de presença (batch) terminarem e tenta reconstruir times
      setTimeout(async () => {
        const presence = await matchRepo.getPresence(m.id);
        if (!presence.length) return;
        const homePlayers    = presence.filter((p: any) => p.team === 'home'    && p.player).map((p: any) => p.player);
        const awayPlayers    = presence.filter((p: any) => p.team === 'away'    && p.player).map((p: any) => p.player);
        const waitingPlayers = presence.filter((p: any) => (!p.team || p.team === 'waiting') && p.player).map((p: any) => p.player);
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
        }
      }, 1500);
    });
    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Realtime: presença alterada (garante que outros dispositivos vejam os times mesmo em rede lenta)
  useEffect(() => {
    if (!matchId) return;
    let debounce: ReturnType<typeof setTimeout>;
    const sub = matchRepo.subscribeToPresence(matchId, async () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const presence = await matchRepo.getPresence(matchId);
        if (!presence.length) return;
        const homePlayers    = presence.filter((p: any) => p.team === 'home'    && p.player).map((p: any) => p.player);
        const awayPlayers    = presence.filter((p: any) => p.team === 'away'    && p.player).map((p: any) => p.player);
        const waitingPlayers = presence.filter((p: any) => (!p.team || p.team === 'waiting') && p.player).map((p: any) => p.player);
        if (homePlayers.length > 0 || awayPlayers.length > 0) {
          const calcRating = (team: Player[]) =>
            team.length ? team.reduce((acc, p) => acc + draftService.calculatePowerLevel(p), 0) / team.length : 0;
          // Só atualiza se o dispositivo atual ainda não tem times definidos
          setDraftResult(prev => {
            if (prev && prev.homeTeam.length > 0) return prev;
            return {
              homeTeam: homePlayers,
              awayTeam: awayPlayers,
              waitingList: waitingPlayers,
              homeRating: calcRating(homePlayers),
              awayRating: calcRating(awayPlayers),
            };
          });
          setActiveTab(prev => (prev === 'attendance' ? 'match' : prev));
        }
      }, 800);
    });
    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(sub);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Timer local
  useEffect(() => {
    let interval: any;
    if (status === 'Em curso' && startTime) {
      interval = setInterval(() => {
        const now = serverNow();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startTime, accumulatedTime, config.duration]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleTimer = async () => {
    const now = serverNow();
    const newStatus: MatchStatus = status === 'Em curso' ? 'Pausada' : 'Em curso';
    let newAccumulated = accumulatedTime;
    if (status === 'Em curso') {
      const elapsed = Math.floor((now - (startTime || now)) / 1000);
      newAccumulated = accumulatedTime + elapsed;
      setAccumulatedTime(newAccumulated);
      setStartTime(null);
      setStatus(newStatus);
      if (matchId) {
        await matchRepo.update(matchId, {
          status: newStatus,
          timer_seconds: newAccumulated,
          timer_started_at: null,
        }).catch(console.error);
      }
    } else {
      setStartTime(now);
      setStatus(newStatus);
      if (matchId) {
        await matchRepo.update(matchId, {
          status: newStatus,
          timer_seconds: newAccumulated,
          timer_started_at: new Date(now).toISOString(),
        }).catch(console.error);
      }
    }
  };

  const handleAddEvent = async (playerId: string, team: 'home' | 'away', type: CoreEventType) => {
    if (!matchId) {
      alert('Nenhuma partida ativa. Recarregue a página.');
      return;
    }
    try {
      const newEvent = await matchRepo.addEvent({ match_id: matchId, player_id: playerId, type, team, minute: Math.floor(timer / 60) });
      setEvents(prev => [newEvent, ...prev]);
      if (type === 'Gol') {
        const ns = { home: team === 'home' ? score.home + 1 : score.home, away: team === 'away' ? score.away + 1 : score.away };
        setScore(ns);
        await matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
      }
      setIsEventModalOpen(false);
    } catch (error: any) {
      console.error('[handleAddEvent]', error);
      alert(`Erro ao registrar ${type}: ${error?.message ?? 'verifique o console'}`);
    }
  };

  const handleElectMVP = async (playerId: string, team: 'home' | 'away') => {
    if (!matchId) return;
    try {
      const newEvent = await matchRepo.addEvent({
        match_id: matchId, player_id: playerId, type: 'Craque', team, minute: Math.floor(timer / 60),
      });
      setEvents(prev => [newEvent, ...prev.filter(e => e.type !== 'Craque')]);
      setMvpPlayerId(playerId);
    } catch (error) { console.error(error); }
  };

  const computeScorers = (): { name: string; team: 'home' | 'away'; goals: number }[] => {
    const map = new Map<string, { name: string; team: 'home' | 'away'; goals: number }>();
    events.filter(e => e.type === 'Gol').forEach((e: any) => {
      const key = e.player_id;
      if (!map.has(key)) map.set(key, { name: e.player?.name ?? '?', team: e.team, goals: 0 });
      map.get(key)!.goals++;
    });
    return Array.from(map.values()).sort((a, b) => b.goals - a.goals);
  };

  const togglePlayerAttendance = async (id: string) => {
    const isPresent = selectedPlayerIds.includes(id);
    setSelectedPlayerIds(prev => isPresent ? prev.filter(pId => pId !== id) : [...prev, id]);
    if (matchId) {
      await matchRepo.setPlayerPresence(matchId, id, !isPresent).catch(console.error);
    }
  };

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
        field_type: (
          config.sport_type === 'Futsal' ? 'Futsal 5x5' :
          config.sport_type === 'Campo'  ? 'Campo 11x11' :
          config.playersPerTeam <= 6     ? 'Society 6x6' : 'Society 7x7'
        ) as Match['field_type'],
        max_players: config.max_players,
        max_goalkeepers: config.max_goalkeepers,
        match_fee: 0,
        ...extraFields,
      });
    } catch {
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

  const handleDraft = async () => {
    try {
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
    } catch (err: any) {
      console.error('[handleDraft] erro:', err);
      alert('Erro ao sortear: ' + (err?.message ?? 'tente novamente'));
    }
  };

  const handleConfirmTeams = async () => {
    const homeStarters = allPlayers.filter(p => teamAssignments[p.id] === 'home-starter');
    const homeReserves = allPlayers.filter(p => teamAssignments[p.id] === 'home-reserve');
    const awayStarters = allPlayers.filter(p => teamAssignments[p.id] === 'away-starter');
    const awayReserves = allPlayers.filter(p => teamAssignments[p.id] === 'away-reserve');

    const homeTeam    = [...homeStarters, ...homeReserves];
    const awayTeam    = [...awayStarters, ...awayReserves];
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

  const handleNextMatch = async (winner: 'home' | 'away' | 'draw') => {
    if (bolaoState) { handleBolaoNext(winner); return; }
    if (!draftResult) return;

    const loserName = winner === 'home'
      ? (config.awayTeamName || 'Time B')
      : (config.homeTeamName || 'Time A');

    const nextFromQueue = teamsQueue[0] ?? [];

    setNextTeamCtx({
      outgoingName: loserName,
      incomingTeam: nextFromQueue,
      winnerResult: winner,
    });
  };

  const confirmNextTeam = async (incomingTeam: Player[]) => {
    if (!draftResult || !nextTeamCtx) return;
    const winner = nextTeamCtx.winnerResult;
    setNextTeamCtx(null);

    const newQueue = teamsQueue.slice(1);
    let newConsecutive = winner === lastWinnerId ? consecutiveWins + 1 : 1;
    let nextHome: Player[];
    let nextAway: Player[];

    if (winner === 'home') {
      nextHome = draftResult.homeTeam;
      nextAway = incomingTeam;
      if (newConsecutive >= 2) {
        newQueue.push(nextHome);
        nextHome = newQueue.shift() ?? [];
        newConsecutive = 0;
      }
      newQueue.push(draftResult.awayTeam);
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
    setStatus('Agendada');

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

  return {
    // state
    activeTab, setActiveTab,
    allPlayers, setAllPlayers,
    selectedPlayerIds, setSelectedPlayerIds,
    draftResult, setDraftResult,
    loading,
    isAddModalOpen, setIsAddModalOpen,
    isCreateMatchModalOpen, setIsCreateMatchModalOpen,
    groupId,
    sessionPhase, setSessionPhase,
    matchType, setMatchType,
    score, setScore,
    timer, setTimer,
    startTime, setStartTime,
    accumulatedTime, setAccumulatedTime,
    status, setStatus,
    matchId,
    events,
    isEventModalOpen, setIsEventModalOpen,
    selectedEventType, setSelectedEventType,
    guestPlayers, setGuestPlayers,
    guestInput, setGuestInput,
    userRole,
    editorInput, setEditorInput,
    editors, setEditors,
    teamsQueue,
    teamAssignments,
    config, setConfig,
    bolaoState,
    nextTeamCtx, setNextTeamCtx,
    mvpPlayerId,
    tieBreakOpen, setTieBreakOpen,
    homeFormation, setHomeFormation,
    awayFormation, setAwayFormation,
    availableFormations,
    // repos (needed by some inline handlers)
    matchRepo,
    playerRepo,
    groupRepo,
    // actions
    fetchPlayers,
    handleSaveConfig,
    toggleTimer,
    handleAddEvent,
    handleElectMVP,
    computeScorers,
    togglePlayerAttendance,
    handleDraft,
    handleConfirmTeams,
    handleNextMatch,
    confirmNextTeam,
    handleNewMatch,
    handleAssignPlayer,
    SPORT_PLAYERS,
  };
}
