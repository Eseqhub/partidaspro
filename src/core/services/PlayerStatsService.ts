import { PlayerAggStats, EMPTY_STATS } from './BadgeService';

interface EventRow   { player_id: string; type: string; match_id: string }
interface PresenceRow { player_id: string; team: string | null; match_id: string }
interface MatchRow   { id: string; status: string; home_score: number; away_score: number; date?: string; created_at?: string }

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
