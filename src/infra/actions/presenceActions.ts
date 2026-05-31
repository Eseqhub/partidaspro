'use server';

import { supabase } from '@/infra/supabase/client';
import { randomBytes } from 'crypto';

/**
 * Gera um token de convite único e persiste no match_presence.
 * Retorna a URL pública para compartilhar no WhatsApp.
 */
export async function generatePresenceLink(
  matchId: string,
  baseUrl: string
): Promise<string> {
  const token = randomBytes(16).toString('hex');

  const { error } = await supabase
    .from('match_presence')
    .upsert(
      { match_id: matchId, invite_token: token },
      { onConflict: 'match_id' }
    );

  if (error) throw new Error(`Falha ao gerar link: ${error.message}`);

  return `${baseUrl}/partida/${matchId}/confirmar?token=${token}`;
}

/**
 * Valida o token de convite para a rota de confirmação.
 * Retorna os dados da partida se válido, null caso contrário.
 */
export async function validatePresenceToken(
  matchId: string,
  token: string
): Promise<{ matchId: string; groupId: string } | null> {
  const { data, error } = await supabase
    .from('match_presence')
    .select('match_id, match:matches(group_id)')
    .eq('match_id', matchId)
    .eq('invite_token', token)
    .maybeSingle();

  if (error || !data) return null;

  return {
    matchId: data.match_id,
    groupId: (data.match as any)?.group_id,
  };
}

/**
 * Confirma presença de um usuário já autenticado.
 */
export async function confirmPresenceLoggedIn(
  matchId: string,
  playerId: string
): Promise<void> {
  const { error } = await supabase
    .from('match_presence')
    .upsert(
      {
        match_id: matchId,
        player_id: playerId,
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,player_id' }
    );

  if (error) throw new Error(`Falha ao confirmar presença: ${error.message}`);
}

/**
 * Onboarding rápido: cria perfil do jogador e confirma presença.
 * Usado quando o usuário NÃO está logado ao acessar o link de convite.
 */
export async function onboardAndConfirm(
  matchId: string,
  groupId: string,
  payload: {
    name: string;
    posicao_principal: string;
    skill_level: number;
    email?: string;
  }
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  try {
    // 1. Cria o perfil do jogador no grupo
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        name: payload.name,
        group_id: groupId,
        posicao_principal: payload.posicao_principal,
        positions: [payload.posicao_principal],
        skill_level: payload.skill_level,
        rating: Math.max(1, Math.min(5, Math.round(payload.skill_level / 2))),
        status: 'Ativo',
        is_mensalista: false,
      })
      .select('id')
      .single();

    if (playerError) throw playerError;

    // 2. Confirma presença na partida
    await confirmPresenceLoggedIn(matchId, player.id);

    return { success: true, playerId: player.id };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Erro desconhecido' };
  }
}
