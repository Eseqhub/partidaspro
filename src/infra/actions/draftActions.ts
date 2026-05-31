'use server';

import { supabase } from '../supabase/client';
import { Player } from '@/core/entities/player';
import { runDraftAlgorithm, DraftTeam } from '@/core/services/draftAlgorithm';

/**
 * Busca jogadores confirmados na partida, roda o sorteio
 * e salva os times de volta no match_presence.
 */
export async function runDraft(
  matchId: string,
  fieldType: string = 'Futsal 5x5',
  modality: string = 'Rachão'
): Promise<{ success: boolean; teams?: DraftTeam[]; error?: string }> {
  try {
    // 1. Buscar presença confirmada com dados completos do jogador
    const { data: presenceData, error: presenceError } = await supabase
      .from('match_presence')
      .select('*, player:players(*)')
      .eq('match_id', matchId)
      .eq('status', 'Confirmado');

    if (presenceError || !presenceData) {
      return { success: false, error: 'Falha ao buscar jogadores confirmados.' };
    }

    const players: Player[] = presenceData
      .map((p: any) => p.player)
      .filter((p: any) => p && p.id && !p.id.startsWith('guest-') && !p.id.includes('_rot_'));

    if (players.length < 2) {
      return { success: false, error: 'Mínimo de 2 jogadores necessários para sortear.' };
    }

    // 2. Rodar o algoritmo de sorteio
    const teams = runDraftAlgorithm(players, fieldType, modality);

    // 3. Salvar os times no match_presence (upsert pelo player_id + match_id)
    for (let i = 0; i < teams.length; i++) {
      const teamName = teams[i].name;
      for (const player of teams[i].players) {
        await supabase.from('match_presence').upsert({
          match_id: matchId,
          player_id: player.id,
          team: teamName,
          status: 'Confirmado',
        });
      }
    }

    return { success: true, teams };
  } catch (err: any) {
    console.error('[runDraft] erro:', err);
    return { success: false, error: err.message ?? 'Erro interno no sorteio.' };
  }
}

/**
 * Gera (ou retorna existente) o hash de recrutamento para o grupo.
 * O link final é: /[slug]/register?h=[hash]
 */
export async function generateRecruitmentLink(
  groupId: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('groups')
      .select('recruitment_link_hash, slug')
      .eq('id', groupId)
      .single();

    if (existing?.recruitment_link_hash) {
      return { success: true, hash: existing.recruitment_link_hash };
    }

    // Gera novo hash único
    const hash = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const { error } = await supabase
      .from('groups')
      .update({ recruitment_link_hash: hash })
      .eq('id', groupId);

    if (error) throw error;

    return { success: true, hash };
  } catch (err: any) {
    console.error('[generateRecruitmentLink] erro:', err);
    return { success: false, error: err.message };
  }
}
