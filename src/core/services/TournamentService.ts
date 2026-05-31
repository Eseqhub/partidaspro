import { Player } from '@/core/entities/player';
import { DraftService } from './DraftService';

export interface BolaoTeam {
  id: string;          // "team-0", "team-1", ...
  name: string;
  color: string;
  players: Player[];
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  isEliminated: boolean;
  isChampion: boolean;
}

export interface BolaoMatchRecord {
  roundNum: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  result: 'home' | 'away' | 'draw';
}

export interface BolaoState {
  teams: BolaoTeam[];
  queue: string[];         // team IDs waiting to play
  currentHomeId: string;
  currentAwayId: string;
  history: BolaoMatchRecord[];
  round: number;
  phase: 'main' | 'repechage' | 'done';
  maxLossesMain: number;       // default 2 → eliminated from main
  maxLossesRepechage: number;  // default 1 → eliminated from repechage
  repechageQueue: string[];    // teams with 1 loss competing in repechage
  championId: string | null;
}

const TEAM_COLORS = ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B', '#A855F7', '#F97316', '#06B6D4', '#EC4899'];
const TEAM_NAMES  = ['Time Verde', 'Time Vermelho', 'Time Azul', 'Time Amarelo', 'Time Roxo', 'Time Laranja', 'Time Ciano', 'Time Rosa'];

export class TournamentService {
  private draftService = new DraftService();

  /** Inicializa um Bolão a partir de um array de Player[][] (resultado do generateBolao) */
  initBolao(
    allTeams: Player[][],
    maxLossesMain = 2,
  ): BolaoState {
    const teams: BolaoTeam[] = allTeams.map((players, i) => ({
      id: `team-${i}`,
      name: TEAM_NAMES[i] ?? `Time ${i + 1}`,
      color: TEAM_COLORS[i] ?? '#fff',
      players,
      wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0,
      isEliminated: false,
      isChampion: false,
    }));

    // Sorteio aleatório da ordem
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const [home, away, ...rest] = shuffled;

    return {
      teams,
      queue: rest.map(t => t.id),
      currentHomeId: home.id,
      currentAwayId: away.id,
      history: [],
      round: 1,
      phase: 'main',
      maxLossesMain,
      maxLossesRepechage: 1,
      repechageQueue: [],
      championId: null,
    };
  }

  /** Processa o resultado de uma partida e retorna o novo estado */
  processResult(
    state: BolaoState,
    homeScore: number,
    awayScore: number,
  ): BolaoState {
    const result: 'home' | 'away' | 'draw' =
      homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

    const newTeams = state.teams.map(t => ({ ...t }));
    const homeTeam = newTeams.find(t => t.id === state.currentHomeId)!;
    const awayTeam = newTeams.find(t => t.id === state.currentAwayId)!;

    homeTeam.goalsFor      += homeScore;
    homeTeam.goalsAgainst  += awayScore;
    awayTeam.goalsFor      += awayScore;
    awayTeam.goalsAgainst  += homeScore;

    if (result === 'home')       { homeTeam.wins++; awayTeam.losses++; }
    else if (result === 'away')  { awayTeam.wins++; homeTeam.losses++; }
    else                         { homeTeam.draws++; awayTeam.draws++; }

    const newHistory: BolaoMatchRecord[] = [
      ...state.history,
      {
        roundNum:  state.round,
        homeId:    state.currentHomeId,
        awayId:    state.currentAwayId,
        homeScore, awayScore, result,
      },
    ];

    if (state.phase === 'main') {
      return this.advanceMain({ ...state, teams: newTeams, history: newHistory }, result, homeTeam, awayTeam);
    }
    return this.advanceRepechage({ ...state, teams: newTeams, history: newHistory }, result, homeTeam, awayTeam);
  }

  private advanceMain(
    state: BolaoState,
    result: 'home' | 'away' | 'draw',
    homeTeam: BolaoTeam,
    awayTeam: BolaoTeam,
  ): BolaoState {
    const winnerId = result === 'home' ? homeTeam.id : result === 'away' ? awayTeam.id : homeTeam.id;
    const loserId  = result === 'home' ? awayTeam.id : result === 'away' ? homeTeam.id : awayTeam.id;

    const newTeams  = state.teams.map(t => ({ ...t }));
    const loserRec  = newTeams.find(t => t.id === loserId)!;
    const newQueue  = [...state.queue];
    const newRepQ   = [...state.repechageQueue];

    // Empate: o visitante não perde, mas cede o campo e vai pro fim da fila
    if (result === 'draw') {
      newQueue.push(loserId);
    } else if (loserRec.losses >= state.maxLossesMain) {
      // Eliminado da fase principal → vai pra repescagem se tiver 1 derrota menos que o limite
      loserRec.isEliminated = true;
      if (loserRec.losses === state.maxLossesMain) {
        // Tem exatamente maxLosses → repechage (se quiser refazer, pode mudar essa lógica)
        newRepQ.push(loserId);
      }
    } else {
      newQueue.push(loserId);
    }

    const nextChallengerIdx = newQueue.shift();

    // Se não há mais desafiantes, vai pra repechage ou encerra
    if (nextChallengerIdx === undefined) {
      return this.checkEndOrRepechage({ ...state, teams: newTeams, queue: [], repechageQueue: newRepQ, history: state.history }, winnerId);
    }

    return {
      ...state,
      teams: newTeams,
      queue: newQueue,
      repechageQueue: newRepQ,
      currentHomeId: winnerId,
      currentAwayId: nextChallengerIdx,
      round: state.round + 1,
      history: state.history,
    };
  }

  private checkEndOrRepechage(state: BolaoState, currentLeaderId: string): BolaoState {
    const newTeams = state.teams.map(t => ({ ...t }));

    // Se há times na repescagem, inicia essa fase
    if (state.repechageQueue.length >= 2) {
      const [repHome, repAway, ...restRep] = state.repechageQueue;
      return {
        ...state,
        teams: newTeams,
        phase: 'repechage',
        currentHomeId: repHome,
        currentAwayId: repAway,
        queue: restRep,            // reutiliza queue para controle dentro da repescagem
        repechageQueue: [],
        round: state.round + 1,
      };
    }

    // Se só 1 time na repescagem, direto pra final contra o líder
    if (state.repechageQueue.length === 1) {
      return {
        ...state,
        teams: newTeams,
        phase: 'repechage',
        currentHomeId: currentLeaderId,
        currentAwayId: state.repechageQueue[0],
        queue: [],
        repechageQueue: [],
        round: state.round + 1,
      };
    }

    // Sem repescagem → campeão
    const champion = newTeams.find(t => t.id === currentLeaderId)!;
    champion.isChampion = true;
    return { ...state, teams: newTeams, phase: 'done', championId: currentLeaderId };
  }

  private advanceRepechage(
    state: BolaoState,
    result: 'home' | 'away' | 'draw',
    homeTeam: BolaoTeam,
    awayTeam: BolaoTeam,
  ): BolaoState {
    const newTeams  = state.teams.map(t => ({ ...t }));
    const winnerId  = result === 'home' ? homeTeam.id : result === 'away' ? awayTeam.id : homeTeam.id;
    const loserId   = result === 'home' ? awayTeam.id : result === 'away' ? homeTeam.id : awayTeam.id;

    const loserRec = newTeams.find(t => t.id === loserId)!;
    loserRec.isEliminated = true;

    const newQueue = [...state.queue];
    const nextOpponent = newQueue.shift();

    if (nextOpponent === undefined) {
      // Repescagem encerrada → campeão é o vencedor
      const champion = newTeams.find(t => t.id === winnerId)!;
      champion.isChampion = true;
      return { ...state, teams: newTeams, phase: 'done', championId: winnerId, queue: [] };
    }

    return {
      ...state,
      teams: newTeams,
      currentHomeId: winnerId,
      currentAwayId: nextOpponent,
      queue: newQueue,
      round: state.round + 1,
    };
  }

  /** Ranking por pontos → saldo de gols → gols marcados */
  getStandings(teams: BolaoTeam[]): BolaoTeam[] {
    return [...teams].sort((a, b) => {
      const pa = a.wins * 3 + a.draws;
      const pb = b.wins * 3 + b.draws;
      if (pb !== pa) return pb - pa;
      const sda = a.goalsFor - a.goalsAgainst;
      const sdb = b.goalsFor - b.goalsAgainst;
      if (sdb !== sda) return sdb - sda;
      return b.goalsFor - a.goalsFor;
    });
  }

  getRating(team: BolaoTeam): number {
    return team.players.length
      ? team.players.reduce((acc, p) => acc + this.draftService.calculatePowerLevel(p), 0) / team.players.length
      : 0;
  }
}
