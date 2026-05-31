import { supabase } from '../supabase/client';

export class AdminRepository {

  async getGlobalStats() {
    const [
      { count: groupsCount },
      { count: playersCount },
      { count: activeMatchesCount },
      { count: totalMatchesCount },
      { count: totalGoals },
    ] = await Promise.all([
      supabase.from('groups').select('*', { count: 'exact', head: true }),
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'Em curso'),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('type', 'Gol'),
    ]);

    return {
      groupsCount:       groupsCount       ?? 0,
      playersCount:      playersCount      ?? 0,
      activeMatchesCount: activeMatchesCount ?? 0,
      totalMatchesCount: totalMatchesCount  ?? 0,
      totalGoals:        totalGoals         ?? 0,
    };
  }

  async getAllGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, logo_url, description, sport_type_default, created_at, owner_id')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  }

  async getGroupDetails(groupId: string) {
    const [
      { data: players },
      { data: matches },
      { count: matchCount },
    ] = await Promise.all([
      supabase.from('players').select('id, name, positions, skill_level, rating, status, photo_url').eq('group_id', groupId).order('name'),
      supabase.from('matches').select('id, date, status, home_team_name, away_team_name, home_score, away_score, modality, field_type').eq('group_id', groupId).order('created_at', { ascending: false }).limit(10),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('group_id', groupId),
    ]);
    return {
      players: players ?? [],
      matches:  matches  ?? [],
      matchCount: matchCount ?? 0,
    };
  }

  async getAllMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('id, date, status, home_team_name, away_team_name, home_score, away_score, modality, field_type, group_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return [];
    return data;
  }

  async getAllPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, positions, skill_level, rating, status, photo_url, group_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return [];
    return data;
  }

  async deleteGroup(groupId: string) {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) throw error;
  }

  async deletePlayer(playerId: string) {
    const { error } = await supabase.from('players').delete().eq('id', playerId);
    if (error) throw error;
  }

  async deleteMatch(matchId: string) {
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) throw error;
  }
}
