'use server';

import { supabase } from '@/infra/supabase/client';
import { randomBytes } from 'crypto';

export async function generatePresenceLink(matchId: string, baseUrl: string): Promise<string> {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, invite_token')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new Error('Partida não encontrada.');

  const token = match.invite_token || randomBytes(16).toString('hex');

  if (!match.invite_token) {
    const { error } = await supabase
      .from('matches')
      .update({ invite_token: token })
      .eq('id', matchId);
    if (error) throw new Error(`Falha ao gerar link: ${error.message}`);
  }

  return `${baseUrl}/partida/${matchId}/confirmar?token=${token}`;
}

export async function validatePresenceToken(
  matchId: string,
  token: string
): Promise<{ matchId: string; groupId: string } | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, group_id, invite_token')
    .eq('id', matchId)
    .eq('invite_token', token)
    .maybeSingle();

  if (error || !data) return null;
  return { matchId: data.id, groupId: data.group_id };
}

export async function confirmPresenceLoggedIn(matchId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('match_presence')
    .upsert(
      { match_id: matchId, player_id: playerId, status: 'Confirmado', confirmed_at: new Date().toISOString() },
      { onConflict: 'match_id,player_id' }
    );

  if (error) throw new Error(`Falha ao confirmar presença: ${error.message}`);
}

export async function onboardAndConfirm(
  matchId: string,
  groupId: string,
  payload: { name: string; posicao_principal: string; skill_level: number; email?: string }
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  try {
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        name: payload.name.trim(),
        group_id: groupId,
        posicao_principal: payload.posicao_principal,
        positions: [payload.posicao_principal],
        skill_level: Math.max(1, Math.min(10, payload.skill_level)),
        rating: Math.max(1, Math.min(5, Math.round(payload.skill_level / 2))),
        email: payload.email?.trim() || null,
        status: 'Ativo',
        is_mensalista: false,
      })
      .select('id')
      .single();

    if (playerError) throw playerError;
    await confirmPresenceLoggedIn(matchId, player.id);
    return { success: true, playerId: player.id };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Erro desconhecido.' };
  }
}
