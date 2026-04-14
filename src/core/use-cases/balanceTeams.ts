import { Player } from '../entities/player';
import { getEffectiveRating } from '../utils/performanceMetrics';

/**
 * Agente de Backend: Algoritmo de Sorteio Inteligente V2 (Balanced Teams)
 * Agora considera Biotipo (IMC) e Idade para um equilíbrio profissional.
 */
export function balanceTeams(players: Player[]) {
  // 1. Calcular o Rating Efetivo (Técnico * Perfil Físico)
  // e ordenar por esse valor decrescente
  const sorted = [...players]
    .map(p => ({
        ...p,
        effectiveRating: getEffectiveRating(p)
    }))
    .sort((a, b) => b.effectiveRating - a.effectiveRating);
  
  const home: Player[] = [];
  const away: Player[] = [];
  
  let homeScore = 0;
  let awayScore = 0;

  // 2. Distribuição balanceada (Snake Draft Dinâmico)
  // O jogador é alocado para o time com menor soma de performance atual
  sorted.forEach((player) => {
    if (homeScore <= awayScore) {
      home.push(player as any);
      homeScore += (player as any).effectiveRating;
    } else {
      away.push(player as any);
      awayScore += (player as any).effectiveRating;
    }
  });

  return { 
    home, 
    away, 
    homeTotalRating: parseFloat(homeScore.toFixed(2)), 
    awayTotalRating: parseFloat(awayScore.toFixed(2)),
    diff: parseFloat(Math.abs(homeScore - awayScore).toFixed(2))
  };
}
