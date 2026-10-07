'use server';

import { supabase } from '@/infra/supabase/client';
import { randomBytes } from 'crypto';

export type ScorerEventType =
  | 'Gol'
  | 'Assistência'
  | 'Cartão Amarelo'
  | 'Cartão Vermelho'
  | 'Craque';

export async function createScorerToken(matchId: string): Promise<{ token: string; matchId: string }> {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new Error('Partida não encontrada.');

  const { data: existing } = await supabase
    .from('match_scorer_tokens')
    .select('token')
    .eq('match_id', matchId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return { token: existing.token, matchId };

  const token = randomBytes(24).toString('hex');
  const { error } = await supabase.from('match_scorer_tokens').insert({
    match_id: matchId,
    token,
    label: 'Apontador',
    active: true,
  });

  if (error) throw new Error(`Falha ao criar apontador: ${error.message}`);
  return { token, matchId };
}

export async function validateScorerToken(token: string) {
  if (!token) return null;

  const { data, error } = await supabase
    .from('match_scorer_tokens')
    .select('id, match_id, token, label, active, expires_at')
    .eq('token', token)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;

  await supabase
    .from('match_scorer_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return data;
}

export async function recordScorerEvent(input: {
  token: string;
  playerId: string;
  type: ScorerEventType;
  team: 'home' | 'away';
  minute: number;
}) {
  const scorer = await validateScorerToken(input.token);
  if (!scorer) throw new Error('Link do apontador inválido ou expirado.');

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, group_id, home_score, away_score')
    .eq('id', scorer.match_id)
    .single();

  if (matchError || !match) throw new Error('Partida não encontrada.');

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      match_id: match.id,
      player_id: input.playerId,
      type: input.type,
      team: input.team,
      minute: Math.max(0, Math.floor(input.minute)),
    })
    .select()
    .single();

  if (eventError) throw new Error(`Falha ao registrar evento: ${eventError.message}`);

  const { error: auditError } = await supabase.from('match_event_audit').insert({
    match_id: match.id,
    event_id: event.id,
    scorer_token_id: scorer.id,
    action: 'created',
    event_type: input.type,
    player_id: input.playerId,
    metadata: {
      team: input.team,
      minute: input.minute,
      source: 'apontador',
    },
  });

  if (auditError) throw new Error(`Evento registrado, mas auditoria falhou: ${auditError.message}`);

  const nextScore = {
    home_score: input.type === 'Gol' && input.team === 'home'
      ? (match.home_score ?? 0) + 1
      : (match.home_score ?? 0),
    away_score: input.type === 'Gol' && input.team === 'away'
      ? (match.away_score ?? 0) + 1
      : (match.away_score ?? 0),
  };

  if (input.type === 'Gol') {
    const { error: scoreError } = await supabase
      .from('matches')
      .update(nextScore)
      .eq('id', match.id);

    if (scoreError) throw new Error(`Evento registrado, mas placar falhou: ${scoreError.message}`);
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, name')
    .eq('id', input.playerId)
    .maybeSingle();

  const { data: current } = await supabase
    .from('match_player_stats')
    .select('goals, assists, tackles, saves, rating, team')
    .eq('match_id', match.id)
    .eq('player_id', input.playerId)
    .maybeSingle();

  const stats = {
    match_id: match.id,
    player_id: input.playerId,
    group_id: match.group_id,
    team: input.team,
    goals: (current?.goals ?? 0) + (input.type === 'Gol' ? 1 : 0),
    assists: (current?.assists ?? 0) + (input.type === 'Assistência' ? 1 : 0),
    tackles: current?.tackles ?? 0,
    saves: current?.saves ?? 0,
    rating: current?.rating ?? null,
  };

  const { error: statsError } = await supabase
    .from('match_player_stats')
    .upsert(stats, { onConflict: 'match_id,player_id' });

  if (statsError) {
    console.warn('Evento salvo, mas estatística não foi atualizada:', statsError.message);
  }

  return {
    event: { ...event, player: player ? { name: player.name } : undefined },
    score: {
      home: nextScoreHome(match.home_score ?? 0, input.team, input.type),
      away: nextScoreAway(match.away_score ?? 0, input.team, input.type),
    },
  };
}

function nextScoreHome(home: number, team: 'home' | 'away', type: ScorerEventType) {
  return type === 'Gol' && team === 'home' ? home + 1 : home;
}

function nextScoreAway(away: number, team: 'home' | 'away', type: ScorerEventType) {
  return type === 'Gol' && team === 'away' ? away + 1 : away;
}
