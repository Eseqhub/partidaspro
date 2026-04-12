import { Player } from '../entities/player';

export interface DraftResult {
  homeTeam: Player[];
  awayTeam: Player[];
  homeRating: number;
  awayRating: number;
}

export class DraftService {
  /**
   * Realiza o sorteio de dois times balanceados por rating e posições críticas (Goleiros).
   */
  balanceTeams(players: Player[]): DraftResult {
    // 1. Separar goleiros dos demais
    const goalkeepers = players.filter(p => p.positions.includes('G'));
    const fieldPlayers = players.filter(p => !p.positions.includes('G'));

    // 2. Ordenar jogadores de linha por rating (descendente)
    const sortedField = [...fieldPlayers].sort((a, b) => b.rating - a.rating);

    const homeTeam: Player[] = [];
    const awayTeam: Player[] = [];

    // 3. Distribuir goleiros (um para cada time se houver pelo menos 2)
    goalkeepers.forEach((gk, index) => {
      if (index % 2 === 0) {
        homeTeam.push(gk);
      } else {
        awayTeam.push(gk);
      }
    });

    // 4. Snake Draft para jogadores de linha para balancear rating
    // Padrão: A, B, B, A, A, B, B...
    sortedField.forEach((player, index) => {
      // O padrão snake alterna a cada 2 jogadores após o primeiro par
      // Índices: 0(A), 1(B), 2(B), 3(A), 4(A), 5(B), 6(B), 7(A)...
      const isSecondOfPair = Math.floor(index / 2) % 2 === 1;
      const isEven = index % 2 === 0;

      if (isSecondOfPair) {
        if (isEven) awayTeam.push(player);
        else homeTeam.push(player);
      } else {
        if (isEven) homeTeam.push(player);
        else awayTeam.push(player);
      }
    });

    const homeRating = homeTeam.reduce((acc, p) => acc + p.rating, 0) / (homeTeam.length || 1);
    const awayRating = awayTeam.reduce((acc, p) => acc + p.rating, 0) / (awayTeam.length || 1);

    return {
      homeTeam,
      awayTeam,
      homeRating,
      awayRating
    };
  }
}
