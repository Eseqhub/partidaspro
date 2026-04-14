import { supabase } from '../supabase/client';

export class AdminRepository {
  async getGlobalStats() {
    const { count: groupsCount } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    const { count: playersCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });

    const { count: activeMatchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Em curso');

    return {
      groupsCount: groupsCount || 0,
      playersCount: playersCount || 0,
      activeMatchesCount: activeMatchesCount || 0
    };
  }

  async getAllGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('*, profiles:owner_id(email)')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }
}
