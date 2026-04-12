import { Player } from '../entities/player';

/**
 * Agente de Backend: Algoritmo de Sorteio Inteligente (Balanced Teams)
 * Usa o sistema de Rating do Kit 2.0 para sugerir times equilibrados.
 */
export function balanceTeams(players: Player[]) {
  // 1. Ordenar por rating decrescente (do melhor para o pior)
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  
  const home: Player[] = [];
  const away: Player[] = [];
  
  let homeScore = 0;
  let awayScore = 0;

  // 2. Distribuição balanceada (Snake Draft Dinâmico)
  // O jogador é alocado para o time com menor soma de estrelas atual
  sorted.forEach((player) => {
    if (homeScore <= awayScore) {
      home.push(player);
      homeScore += player.rating;
    } else {
      away.push(player);
      awayScore += player.rating;
    }
  });

  return { 
    home, 
    away, 
    homeTotalRating: homeScore, 
    awayTotalRating: awayScore,
    diff: Math.abs(homeScore - awayScore)
  };
}
