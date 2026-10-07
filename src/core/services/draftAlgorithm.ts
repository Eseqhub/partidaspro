import { Player } from '@/core/entities/player';

const GOALKEEPER_POSITIONS = ['G'];
const TEAM_COLORS = ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B'];
const TEAM_NAMES = ['Time Verde', 'Time Vermelho', 'Time Azul', 'Time Amarelo'];

function isGoalkeeper(player: Player): boolean {
  return player.posicao_principal === 'G' ||
    (Array.isArray(player.positions) && player.positions.some(p => GOALKEEPER_POSITIONS.includes(p)));
}

function physicalScore(player: Player): number {
  const heightCm = (player.height ?? 1.75) * 100;
  const weightKg = player.weight ?? 75;
  const heightScore = Math.max(0, Math.min(10, (heightCm - 150) / 5));
  const weightScore = Math.max(0, Math.min(10, 10 - Math.abs(weightKg - 75) / 5));
  return (heightScore + weightScore) / 2;
}

function getSkillLevel(player: Player): number {
  if (player.skill_level != null) return Math.max(1, Math.min(10, player.skill_level));
  return Math.max(1, Math.min(10, Math.round((player.rating || 3) * 2)));
}

export function calcPlayerStrength(player: Player, teamPlayers: Player[] = []): number {
  const skill = getSkillLevel(player);
  const teamHasGoalkeeper = teamPlayers.some(isGoalkeeper);
  const goalkeeperBonus = isGoalkeeper(player) && teamHasGoalkeeper ? -20 : 10;
  return (skill * 5) + (goalkeeperBonus * 3) + (physicalScore(player) * 2);
}

function getTeamCount(_fieldType: string, modality: string): number {
  return modality === 'Revezamento' ? 3 : 2;
}

export function getPlayersPerTeam(fieldType: string): number {
  const map: Record<string, number> = {
    'Futsal 5x5': 5,
    'Society 6x6': 6,
    'Society 7x7': 7,
    'Campo 11x11': 11,
  };
  return map[fieldType] ?? 5;
}

export interface DraftTeam {
  name: string;
  color: string;
  players: Player[];
  totalStrength: number;
}

export interface DraftResult {
  teams: DraftTeam[];
  waitingList: Player[];
}

function makeTeams(count: number): DraftTeam[] {
  return Array.from({ length: count }, (_, i) => ({
    name: TEAM_NAMES[i] ?? `Time ${i + 1}`,
    color: TEAM_COLORS[i] ?? '#64748B',
    players: [],
    totalStrength: 0,
  }));
}

/**
 * Sorteio inteligente com capacidade rígida.
 * Ninguém é perdido: quem excede a capacidade vai para waitingList.
 */
export function runDraftAlgorithm(
  players: Player[],
  fieldType = 'Futsal 5x5',
  modality = 'Rachão',
): DraftTeam[] {
  const teamCount = getTeamCount(fieldType, modality);
  const capacity = getPlayersPerTeam(fieldType);
  const teams = makeTeams(teamCount);
  const waitingList: Player[] = [];

  // Goleiros primeiro: um por time, extras aguardam.
  const keepers = [...players].filter(isGoalkeeper).sort(() => Math.random() - 0.5);
  const fieldPlayers = players.filter(p => !isGoalkeeper(p));

  keepers.forEach((player, index) => {
    const team = teams[index % teamCount];
    if (team.players.length < capacity) {
      team.players.push(player);
      team.totalStrength += calcPlayerStrength(player, team.players);
    } else {
      waitingList.push(player);
    }
  });

  // Os mais fortes primeiro, sempre escolhendo o time elegível de menor força.
  // Empate de força usa o time com menos jogadores e depois aleatoriedade.
  const sorted = [...fieldPlayers].sort((a, b) => {
    const diff = calcPlayerStrength(b) - calcPlayerStrength(a);
    return diff || (Math.random() - 0.5);
  });

  for (const player of sorted) {
    const available = teams
      .filter(t => t.players.length < capacity)
      .sort((a, b) => {
        if (a.totalStrength !== b.totalStrength) return a.totalStrength - b.totalStrength;
        return a.players.length - b.players.length;
      });

    const team = available[0];
    if (!team) {
      waitingList.push(player);
      continue;
    }

    const strength = calcPlayerStrength(player, team.players);
    team.players.push(player);
    team.totalStrength += strength;
  }

  return teams;
}

export function runDraftWithWaitingList(
  players: Player[],
  fieldType = 'Futsal 5x5',
  modality = 'Rachão',
): { teams: DraftTeam[]; waitingList: Player[] } {
  const teamCount = getTeamCount(fieldType, modality);
  const capacity = getPlayersPerTeam(fieldType);
  const teams = makeTeams(teamCount);
  const waitingList: Player[] = [];

  // Shuffle only among players with equivalent priority to avoid deterministic favoritism.
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const sorted = shuffled.sort((a, b) => calcPlayerStrength(b) - calcPlayerStrength(a));

  // Snake distribution with hard capacity.
  let index = 0;
  let direction = 1;
  while (index < sorted.length) {
    const player = sorted[index++];
    const candidates = teams.filter(t => t.players.length < capacity);
    if (!candidates.length) {
      waitingList.push(player);
      continue;
    }

    const preferred = teams[direction > 0 ? 0 : teamCount - 1];
    const team = candidates.includes(preferred)
      ? preferred
      : candidates.sort((a, b) => a.players.length - b.players.length)[0];

    team.players.push(player);
    team.totalStrength += calcPlayerStrength(player, team.players);

    const pos = teams.indexOf(team);
    if (teamCount > 1 && (pos === teamCount - 1 || pos === 0)) direction *= -1;
  }

  return { teams, waitingList };
}
