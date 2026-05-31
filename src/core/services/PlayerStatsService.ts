import { PlayerAggStats, EMPTY_STATS } from './BadgeService';

interface EventRow   { player_id: string; type: string; match_id: string }
interface PresenceRow { player_id: string; team: string | null; match_id: string }
interface MatchRow   { id: string; status: string; home_score: number; away_score: number; date?: string; created_at?: string }

export interface SeasonStanding extends PlayerAggStats {
  playerId:  string;
  name:      string;
  photo_url?: string;
  points:    number;  // pontos de campeonato (V*3 + E + craque*2)
}

/**
 * Agrega estatísticas de TODOS os jogadores de uma vez (para rankings/temporada).
 * Recebe metadados dos jogadores para montar nome/foto.
 */
export function aggregateAllPlayers(
  events: EventRow[],
  presences: PresenceRow[],
  matches: MatchRow[],
  playerMeta: Map<string, { name: string; photo_url?: string }>,
): SeasonStanding[] {
  // Conjunto de jogadores que participaram
  const ids = new Set<string>();
  presences.forEach(p => { if (p.player_id) ids.add(p.player_id); });

  const standings: SeasonStanding[] = [];
  ids.forEach(pid => {
    const s = aggregatePlayerStats(pid, events, presences, matches);
    if (s.matches === 0) return; // só quem jogou no período
    const meta = playerMeta.get(pid);
    standings.push({
      ...s,
      playerId: pid,
      name: meta?.name ?? '—',
      photo_url: meta?.photo_url,
      points: s.wins * 3 + s.draws + s.mvpCount * 2,
    });
  });

  // Ordena: pontos → vitórias → gols → assistências
  standings.sort((a, b) =>
    b.points - a.points || b.wins - a.wins || b.goals - a.goals || b.assists - a.assists);

  return standings;
}

/**
 * Agrega as estatísticas de um jogador a partir de linhas cruas do banco.
 * Função PURA — facilita reuso e teste.
 */
export function aggregatePlayerStats(
  playerId: string,
  events: EventRow[],
  presences: PresenceRow[],
  matches: MatchRow[],
): PlayerAggStats {
  const stats: PlayerAggStats = { ...EMPTY_STATS };
  const matchById = new Map(matches.map(m => [m.id, m]));

  // ── Eventos ────────────────────────────────────────────────────────────
  const goalsByMatch = new Map<string, number>();
  events.filter(e => e.player_id === playerId).forEach(e => {
    if (e.type === 'Gol') {
      stats.goals++;
      goalsByMatch.set(e.match_id, (goalsByMatch.get(e.match_id) ?? 0) + 1);
    } else if (e.type === 'Assistência')   stats.assists++;
    else if (e.type === 'Cartão Amarelo')  stats.yellowCards++;
    else if (e.type === 'Cartão Vermelho') stats.redCards++;
    else if (e.type === 'Craque')          stats.mvpCount++;
  });
  goalsByMatch.forEach(count => { if (count >= 3) stats.hatTricks++; });

  // ── Presença / resultados ──────────────────────────────────────────────
  const playerPresences = presences
    .filter(p => p.player_id === playerId && p.team && (p.team === 'home' || p.team === 'away'))
    .map(p => ({ presence: p, match: matchById.get(p.match_id) }))
    .filter((x): x is { presence: PresenceRow; match: MatchRow } =>
      !!x.match && x.match.status === 'Finalizada')
    .sort((a, b) => {
      const da = a.match.date ?? a.match.created_at ?? '';
      const db = b.match.date ?? b.match.created_at ?? '';
      return da.localeCompare(db);
    });

  let currentStreak = 0;
  for (const { presence, match } of playerPresences) {
    stats.matches++;
    const homeWon = match.home_score > match.away_score;
    const awayWon = match.away_score > match.home_score;
    const isDraw  = match.home_score === match.away_score;
    const won = (presence.team === 'home' && homeWon) || (presence.team === 'away' && awayWon);

    if (won) {
      stats.wins++;
      currentStreak++;
      if (currentStreak > stats.bestStreak) stats.bestStreak = currentStreak;
    } else if (isDraw) {
      stats.draws++;
      currentStreak = 0;
    } else {
      stats.losses++;
      currentStreak = 0;
    }
  }

  return stats;
}
