'use server';

import { supabase } from '../supabase/client';
import { Player } from '@/core/entities/player';
import { runDraftAlgorithm, DraftTeam } from '@/core/services/draftAlgorithm';

export async function runDraft(
  matchId: string,
  fieldType = 'Futsal 5x5',
  modality = 'Rachão'
): Promise<{ success: boolean; teams?: DraftTeam[]; waitingList?: Player[]; error?: string }> {
  try {
    const { data: presenceData, error: presenceError } = await supabase
      .from('match_presence')
      .select('*, player:players(*)')
      .eq('match_id', matchId)
      .eq('status', 'Confirmado');

    if (presenceError) throw presenceError;

    const players: Player[] = (presenceData ?? [])
      .map((p: any) => p.player as Player)
      .filter((p): p is Player => Boolean(p?.id) && !p.id.startsWith('guest-') && !p.id.includes('_rot_'));

    if (players.length < 2) {
      return { success: false, error: 'Mínimo de 2 jogadores confirmados necessários.' };
    }

    const { data: allPresence } = await supabase
      .from('match_presence')
      .select('player_id')
      .eq('match_id', matchId);

    // Limpa atribuições antigas para que um novo sorteio nunca deixe jogador fantasma em um time.
    if (allPresence?.length) {
      await supabase
        .from('match_presence')
        .update({ team: null })
        .eq('match_id', matchId);
    }

    const teams = runDraftAlgorithm(players, fieldType, modality);
    const assignedIds = new Set<string>();

    for (const team of teams) {
      for (const player of team.players) {
        assignedIds.add(player.id);
        const { error } = await supabase
          .from('match_presence')
          .update({ team: team.name, status: 'Confirmado' })
          .eq('match_id', matchId)
          .eq('player_id', player.id);
        if (error) throw error;
      }
    }

    const waitingList = players.filter(p => !assignedIds.has(p.id));

    for (const player of waitingList) {
      const { error } = await supabase
        .from('match_presence')
        .update({ team: null, status: 'Espera' })
        .eq('match_id', matchId)
        .eq('player_id', player.id);
      if (error) throw error;
    }

    return {
      success: true,
      teams,
      waitingList,
    };
  } catch (err: any) {
    console.error('[runDraft]', err);
    return { success: false, error: err?.message ?? 'Erro interno no sorteio.' };
  }
}

export async function generateRecruitmentLink(
  groupId: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('groups')
      .select('recruitment_link_hash, slug')
      .eq('id', groupId)
      .single();

    if (existing?.recruitment_link_hash) return { success: true, hash: existing.recruitment_link_hash };

    const hash = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const { error } = await supabase.from('groups').update({ recruitment_link_hash: hash }).eq('id', groupId);
    if (error) throw error;

    return { success: true, hash };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Não foi possível gerar o link.' };
  }
}
