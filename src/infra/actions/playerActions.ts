'use server';

import { supabase } from '../supabase/client';
import { Player } from '@/core/entities/player';

export async function getPlayers(groupId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('group_id', groupId)
    .order('name');

  if (error) throw new Error(`Erro ao buscar jogadores: ${error.message}`);
  return data as Player[];
}

export async function upsertPlayer(player: Partial<Player>) {
  const { data, error } = await supabase
    .from('players')
    .upsert({
      ...player,
      status: player.status || 'Ativo',
    })
    .select()
    .single();

  if (error) throw new Error(`Erro ao salvar jogador: ${error.message}`);
  return data as Player;
}

/**
 * REGRA DE SEGURANÇA: Soft Delete automático seguindo o protocolo Kit 2.0.
 * Nunca deletamos dados, apenas marcamos como 'Inativo'.
 */
export async function archivePlayer(playerId: string) {
  const { error } = await supabase
    .from('players')
    .update({ status: 'Inativo' })
    .eq('id', playerId);

  if (error) throw new Error(`Erro ao arquivar jogador: ${error.message}`);
  return { success: true };
}
