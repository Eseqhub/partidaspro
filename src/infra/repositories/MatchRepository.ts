import { supabase } from '../supabase/client';
import { Match, MatchStatus } from '@/core/entities/match';

export class MatchRepository {
  private table = 'matches';

  async findAllByGroupId(groupId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Match[];
  }

  async findLiveMatch(groupId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'Em curso')
      .single();

    if (error) return null;
    return data as Match;
  }

  async create(match: Omit<Match, 'id' | 'created_at'>): Promise<Match> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([match])
      .select()
      .single();

    if (error) throw error;
    return data as Match;
  }

  async update(id: string, updates: Partial<Match>): Promise<Match> {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Match;
  }

  // Realtime Subscription
  subscribeToMatch(matchId: string, onUpdate: (match: Match) => void) {
    return supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: this.table,
        filter: `id=eq.${matchId}`
      }, (payload) => {
        onUpdate(payload.new as Match);
      })
      .subscribe();
  }
}
