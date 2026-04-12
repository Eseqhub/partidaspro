'use server';

import { supabase } from '../supabase/client';
import { Match } from '@/core/entities/match';

/**
 * Agente de Backend: Validação de presença com base no modelo de cobrança.
 * Se o grupo for pago (is_paid_model), validamos se a match_fee foi tratada.
 */
export async function confirmPresence(playerId: string, matchId: string) {
  // 1. Buscar dados da partida e do grupo
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*, group:groups(is_paid_model)')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new Error('Partida não encontrada.');

  const isPaidModel = match.group.is_paid_model;
  const matchFee = match.match_fee;

  // 2. Lógica de Validação
  if (isPaidModel && matchFee > 0) {
    // Aqui entrará a lógica de gateway no futuro. 
    // Por enquanto, simulamos uma verificação de "Saldo" ou "Pendência"
    const { data: finance, error: financeError } = await supabase
      .from('finances')
      .select('status')
      .eq('player_id', playerId)
      .eq('category', 'Partida')
      .eq('amount', matchFee)
      .eq('status', 'Pago')
      .limit(1);

    if (financeError || !finance || finance.length === 0) {
      return { 
        success: false, 
        reason: 'PAGAMENTO_PENDENTE', 
        message: 'Esta é uma partida paga. Por favor, realize o pagamento para confirmar sua vaga.' 
      };
    }
  }

  // 3. Confirmação instantânea se for grátis ou se o pagamento foi validado
  // (Simulando a inserção em uma tabela de presenças que criaremos depois)
  console.log(`Presença confirmada para o jogador ${playerId} na partida ${matchId}`);
  
  return { success: true, message: 'Vaga confirmada com sucesso!' };
}

/**
 * Agente de Backend: Inicia o cronômetro da partida.
 */
export async function startTimer(matchId: string) {
  const { error } = await supabase
    .from('matches')
    .update({ 
      is_timer_running: true,
      timer_last_updated: new Date().toISOString()
    })
    .eq('id', matchId);

  if (error) throw new Error('Falha ao iniciar cronômetro.');
  return { success: true };
}

/**
 * Agente de Backend: Pausa o cronômetro e salva os segundos atuais.
 */
export async function pauseTimer(matchId: string, currentSeconds: number) {
  const { error } = await supabase
    .from('matches')
    .update({ 
      is_timer_running: false, 
      timer_seconds: currentSeconds,
      timer_last_updated: new Date().toISOString()
    })
    .eq('id', matchId);

  if (error) throw new Error('Falha ao pausar cronômetro.');
  return { success: true };
}

/**
 * Agente de Backend: Registra Gols, Assistências e Cartões.
 */
export async function registerEvent(matchId: string, playerId: string, type: string) {
  const { data, error } = await supabase
    .from('events')
    .insert({ match_id: matchId, player_id: playerId, type })
    .select()
    .single();

  if (error) throw new Error('Falha ao registrar evento.');
  
  // Se for GOL, opcionalmente atualizar o placar automaticamente (simplificado)
  return data;
}

