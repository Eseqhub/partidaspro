import { Player } from '../entities/player';

export interface DraftResult {
  homeTeam: Player[];
  awayTeam: Player[];
  waitingList: Player[];
  homeRating: number;
  awayRating: number;
}

export class DraftService {
  // ... existing calculatePowerLevel and calculateAge methods ...
  private calculatePowerLevel(player: Player): number {
    let score = player.rating * 10; 
    if (player.birth_date) {
      const age = this.calculateAge(player.birth_date);
      if (age >= 20 && age <= 35) score += 5;
      else if (age > 35 && age < 45) score += 2;
      else if (age >= 45) score -= 2;
    }
    if (player.height && player.weight) {
        const heightInMeters = player.height;
        const imc = player.weight / (heightInMeters * heightInMeters);
        if (imc >= 20 && imc <= 26) score += 5;
        else if (imc > 26 && imc < 30) score += 2;
        else score -= 1;
    }
    return score;
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  }

  /**
   * Realiza o sorteio de dois times balanceados por múltiplos fatores.
   * Respeita o limite de jogadores por time.
   */
  balanceTeams(players: Player[], playersPerTeam: number = 20): DraftResult {
    // 1. Separar goleiros dos demais
    const goalkeepers = players.filter(p => p.positions.includes('G'));
    const fieldPlayers = players.filter(p => !p.positions.includes('G'));

    // 2. Ordenar jogadores de linha por Power Level (descendente)
    const sortedField = [...fieldPlayers].sort((a, b) => 
        this.calculatePowerLevel(b) - this.calculatePowerLevel(a)
    );

    const homeTeam: Player[] = [];
    const awayTeam: Player[] = [];
    let waitingList: Player[] = [];

    // 3. Distribuir goleiros
    goalkeepers.forEach((gk, index) => {
      if (index % 2 === 0) {
        if (homeTeam.length < playersPerTeam) homeTeam.push(gk);
        else waitingList.push(gk);
      } else {
        if (awayTeam.length < playersPerTeam) awayTeam.push(gk);
        else waitingList.push(gk);
      }
    });

    // 4. Snake Draft Pro
    sortedField.forEach((player, index) => {
      const isSecondOfPair = Math.floor(index / 2) % 2 === 1;
      const isEven = index % 2 === 0;

      if (isSecondOfPair) {
        if (isEven) {
            if (awayTeam.length < playersPerTeam) awayTeam.push(player);
            else waitingList.push(player);
        } else {
            if (homeTeam.length < playersPerTeam) homeTeam.push(player);
            else waitingList.push(player);
        }
      } else {
        if (isEven) {
            if (homeTeam.length < playersPerTeam) homeTeam.push(player);
            else waitingList.push(player);
        } else {
            if (awayTeam.length < playersPerTeam) awayTeam.push(player);
            else waitingList.push(player);
        }
      }
    });

    const homeRating = homeTeam.reduce((acc, p) => acc + this.calculatePowerLevel(p), 0) / (homeTeam.length || 1);
    const awayRating = awayTeam.reduce((acc, p) => acc + this.calculatePowerLevel(p), 0) / (awayTeam.length || 1);

    return {
      homeTeam,
      awayTeam,
      waitingList,
      homeRating,
      awayRating
    };
  }
}
