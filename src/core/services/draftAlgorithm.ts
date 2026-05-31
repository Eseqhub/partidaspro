import { Player } from '@/core/entities/player';

// Goleiro recebe penalidade se o time já tiver um
const GOALKEEPER_POSITIONS = ['G'];

// Score de posição: penaliza se o time já tem goleiro
function positionScore(player: Player, teamPlayers: Player[]): number {
  const isGoalkeeper = player.positions.some(p => GOALKEEPER_POSITIONS.includes(p));
  const teamHasGoalkeeper = teamPlayers.some(p =>
    p.positions.some(pos => GOALKEEPER_POSITIONS.includes(pos))
  );
  // Se o time já tem goleiro e este também é goleiro, penaliza
  if (isGoalkeeper && teamHasGoalkeeper) return 0;
  return 10;
}

// Score físico: normaliza altura (cm) e peso (kg) em uma escala de 0–10
function physicalScore(player: Player): number {
  const heightCm = (player.height ?? 1.70) * 100;
  const weightKg = player.weight ?? 75;

  // Altura: referência 150–200 cm → score 0–10
  const heightScore = Math.max(0, Math.min(10, (heightCm - 150) / 5));

  // Peso: jogadores mais leves tendem a ser mais ágeis (referência heurística)
  // Peso ideal entre 65-85 kg → score próximo de 10
  const weightScore = Math.max(0, Math.min(10, 10 - Math.abs(weightKg - 75) / 5));

  return (heightScore + weightScore) / 2;
}

// Converte rating (1.0–5.0) para skill_level (1–10) se o campo não existir
function getSkillLevel(player: Player): number {
  if (player.skill_level != null) return player.skill_level;
  return Math.round(player.rating * 2);
}

// Força total do atleta — usado para ordenar o draft
export function calcPlayerStrength(player: Player, teamPlayers: Player[] = []): number {
  const skill = getSkillLevel(player); // 1–10
  const pos   = positionScore(player, teamPlayers); // 0 ou 10
  const phys  = physicalScore(player); // 0–10

  return (skill * 5) + (pos * 3) + (phys * 2);
}

export interface DraftTeam {
  name: string;
  color: string;
  players: Player[];
  totalStrength: number;
}

// Determina o número de times baseado na modalidade e tipo de campo
function getTeamCount(fieldType: string, modality: string): number {
  if (modality === 'Revezamento') return 3;
  return 2;
}

// Determina o max de jogadores por time baseado no tipo de campo
function getPlayersPerTeam(fieldType: string): number {
  const map: Record<string, number> = {
    'Futsal 5x5':  5,
    'Society 6x6': 6,
    'Society 7x7': 7,
    'Campo 11x11': 11,
  };
  return map[fieldType] ?? 5;
}

const TEAM_COLORS = ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B'];
const TEAM_NAMES  = ['Time Verde', 'Time Vermelho', 'Time Azul', 'Time Amarelo'];

/**
 * Algoritmo Snake Draft:
 * Jogadores são ordenados do mais forte para o mais fraco.
 * A distribuição segue o padrão: "1 2 3 3 2 1 1 2 3..." (serpentina)
 * para garantir que nenhum time fique com todos os melhores jogadores.
 */
export function runDraftAlgorithm(
  players: Player[],
  fieldType: string = 'Futsal 5x5',
  modality: string = 'Rachão'
): DraftTeam[] {
  const teamCount = getTeamCount(fieldType, modality);
  const teams: DraftTeam[] = Array.from({ length: teamCount }, (_, i) => ({
    name: TEAM_NAMES[i],
    color: TEAM_COLORS[i],
    players: [],
    totalStrength: 0,
  }));

  // Ordena jogadores por força decrescente (melhor primeiro)
  const sorted = [...players].sort(
    (a, b) => calcPlayerStrength(b) - calcPlayerStrength(a)
  );

  // Distribuição em serpentina
  let direction = 1;
  let teamIndex = 0;

  for (const player of sorted) {
    const strength = calcPlayerStrength(player, teams[teamIndex].players);
    teams[teamIndex].players.push(player);
    teams[teamIndex].totalStrength += strength;

    teamIndex += direction;

    // Inverte direção ao atingir as bordas
    if (teamIndex >= teamCount) {
      direction = -1;
      teamIndex = teamCount - 1;
    } else if (teamIndex < 0) {
      direction = 1;
      teamIndex = 0;
    }
  }

  return teams;
}
