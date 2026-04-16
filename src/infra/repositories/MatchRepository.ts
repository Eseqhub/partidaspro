import { supabase } from '../supabase/client';
import { Match } from '@/core/entities/match';

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
      .in('status', ['Em curso', 'Pausada', 'Agendada'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data as Match | null;
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

  // ── MODO DESAFIO ────────────────────────────────────────────────────────

  async createChallenge(match: Omit<Match, 'id' | 'created_at'>): Promise<Match> {
    const token = crypto.randomUUID();
    const { data, error } = await supabase
      .from(this.table)
      .insert([{ ...match, match_type: 'desafio', challenge_token: token, challenge_status: 'pendente' }])
      .select()
      .single();
    if (error) throw error;
    return data as Match;
  }

  async findByToken(token: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('challenge_token', token)
      .maybeSingle();
    if (error) return null;
    return data as Match | null;
  }

  async acceptChallenge(token: string, awayGroupName: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from(this.table)
      .update({ challenge_status: 'aceito', away_group_name: awayGroupName, status: 'Agendada' })
      .eq('challenge_token', token)
      .select()
      .single();
    if (error) return null;
    return data as Match;
  }

  async declineChallenge(token: string): Promise<void> {
    await supabase
      .from(this.table)
      .update({ challenge_status: 'recusado' })
      .eq('challenge_token', token);
  }

  // ── REALTIME ─────────────────────────────────────────────────────────────

  subscribeToMatch(matchId: string, onUpdate: (match: Match) => void) {
    return supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: this.table,
        filter: `id=eq.${matchId}`,
      }, (payload) => onUpdate(payload.new as Match))
      .subscribe();
  }

  // ── EVENTS ───────────────────────────────────────────────────────────────

  async getEvents(matchId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*, player:players(name)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addEvent(event: any): Promise<any> {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select('*, player:players(name)')
      .single();
    if (error) throw error;
    return data;
  }

  // ── PRESENCE ─────────────────────────────────────────────────────────────

  async getPresence(matchId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('match_presence')
      .select('*, player:players(*)')
      .eq('match_id', matchId);
    if (error) throw error;
    return data;
  }

  async savePresenceBatch(matchId: string, playerTeams: { player_id: string; team: string }[]): Promise<void> {
    for (const item of playerTeams) {
      await supabase.from('match_presence').upsert({
        match_id: matchId,
        player_id: item.player_id,
        team: item.team,
        status: 'Confirmado',
      });
    }
  }

  async setPlayerPresence(matchId: string, playerId: string, confirmed: boolean): Promise<void> {
    if (confirmed) {
      await supabase.from('match_presence').upsert({
        match_id: matchId,
        player_id: playerId,
        status: 'Confirmado',
      });
    } else {
      await supabase
        .from('match_presence')
        .delete()
        .eq('match_id', matchId)
        .eq('player_id', playerId);
    }
  }
}
