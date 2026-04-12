import { supabase } from '../supabase/client';
import { Player, PlayerPositionV2 } from '@/core/entities/player';

export class PlayerRepository {
  private table = 'players';

  async findAllByGroupId(groupId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .order('name');

    if (error) throw error;
    return data as Player[];
  }

  async findById(id: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Player;
  }

  async create(player: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([player])
      .select()
      .single();

    if (error) throw error;
    return data as Player;
  }

  async update(id: string, updates: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Player;
  }
}
