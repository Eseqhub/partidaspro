import { supabase } from '../supabase/client';
import { MatchConfig } from '@/core/entities/matchConfig';

export class MatchConfigRepository {
  private table = 'match_configs';

  async create(config: Omit<MatchConfig, 'id' | 'created_at'>): Promise<MatchConfig> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([config])
      .select()
      .single();
    if (error) throw error;
    return data as MatchConfig;
  }

  async findByMatchId(matchId: string): Promise<MatchConfig | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();
    if (error) throw error;
    return data as MatchConfig | null;
  }

  async update(id: string, updates: Partial<MatchConfig>): Promise<MatchConfig> {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MatchConfig;
  }
}
