import { supabase } from '../supabase/client';

export interface PlayerStatEntry {
  player_id: string;
  team?: string;
  goals: number;
  assists: number;
  tackles: number;
  saves: number;
  rating?: number;
}

export class MatchStatsRepository {
  private table = 'match_player_stats';

  async saveAll(matchId: string, groupId: string, entries: PlayerStatEntry[]): Promise<void> {
    const rows = entries.map(e => ({
      match_id:  matchId,
      group_id:  groupId,
      player_id: e.player_id,
      team:      e.team ?? null,
      goals:     e.goals,
      assists:   e.assists,
      tackles:   e.tackles,
      saves:     e.saves,
      rating:    e.rating ?? null,
    }));

    const { error } = await supabase
      .from(this.table)
      .upsert(rows, { onConflict: 'match_id,player_id' });

    if (error) throw error;
  }

  async findByMatch(matchId: string): Promise<PlayerStatEntry[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('match_id', matchId);

    if (error) throw error;
    return data as PlayerStatEntry[];
  }
}
