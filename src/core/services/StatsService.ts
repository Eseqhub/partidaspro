import { supabase } from '@/infra/supabase/client';

export interface PlayerStats {
  id: string;
  name: string;
  photo_url?: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  victories: number;
  defeats: number;
  draws: number;
}

export class StatsService {
  async getGlobalStats(groupId: string) {
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*, player:player_id(name, photo_url)')
      .eq('match_id.group_id', groupId); // Este tipo de join complexo pode exigir uma View ou RPC no Supabase

    // Para o MVP funcional, vamos focar nos totais do grupo
    const { data: totalEvents, error } = await supabase
      .from('events')
      .select('type', { count: 'exact' })
      .eq('match_id.group_id', groupId);

    return {
      totalGoals: events?.filter(e => e.type === 'Gol').length || 0,
      totalYellowCards: events?.filter(e => e.type === 'Cartão Amarelo').length || 0,
      totalRedCards: events?.filter(e => e.type === 'Cartão Vermelho').length || 0,
    };
  }

  async getTopScorers(groupId: string): Promise<PlayerStats[]> {
     // Lógica para agrupar eventos por jogador e contar gols
     // Implementação simplificada para o dashboard operacional
     return [];
  }
}
