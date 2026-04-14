import { supabase } from '../supabase/client';
import { Player, PlayerPositionV2 } from '@/core/entities/player';

export class PlayerRepository {
  private table = 'players';

  async findAllByGroupId(groupId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    
    // Ordenação técnica de posições (Broadcast Standard)
    const positionOrder: Record<string, number> = {
      'G': 1,
      'ZG': 2, 'LD': 2, 'LE': 2,
      'VOL': 3, 'MD': 3, 'ME': 3,
      'MO': 4,
      'PE': 5, 'PD': 5, 'ATA': 5, 'CA': 5
    };

    const sortedData = (data as Player[]).sort((a, b) => {
      const weightA = positionOrder[a.positions[0]] || 99;
      const weightB = positionOrder[b.positions[0]] || 99;
      
      if (weightA !== weightB) return weightA - weightB;
      return a.name.localeCompare(b.name);
    });

    return sortedData;
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
