import { Player } from '../entities/player';

export interface DraftResult {
  homeTeam: Player[];
  awayTeam: Player[];
  waitingList: Player[];
  allTeams?: Player[][];
  homeRating: number;
  awayRating: number;
}

export class DraftService {
  /**
   * Força do jogador: 0–120
   * Prioridade: skill_level (1-10) > rating (1-5)
   * Fatores secundários: idade e IMC.
   */
  calculatePowerLevel(player: Player): number {
    // Base: skill_level 1-10 → 10-100 | rating 1-5 → 10-50 (fallback)
    const skill = player.skill_level != null
      ? player.skill_level
      : Math.round((player.rating || 3) * 2);
    let score = skill * 10;

    // Fator Idade
    if (player.birth_date) {
      const age = this.calculateAge(player.birth_date);
      if (age >= 18 && age <= 32)      score += 10;
      else if (age > 32 && age <= 40)  score += 5;
      else if (age > 40 && age <= 48)  score += 0;
      else if (age > 48)               score -= 5;
      // Abaixo de 18: sem bônus (em desenvolvimento)
    }

    // Fator Físico (IMC)
    if (player.height && player.weight) {
      const imc = player.weight / (player.height * player.height);
      if (imc >= 20 && imc <= 25)       score += 10;
      else if (imc > 25 && imc < 30)    score += 5;
      else if (imc >= 17 && imc < 20)   score += 3;
      else                               score -= 5;
    }

    return Math.max(0, score);
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  /**
   * Sorteio Inteligente para Rachão.
   * Snake draft: goleiros separados, linha ordenada por força.
   * Padrão de distribuição: H A A H H A A H ...
   */
  balanceTeams(players: Player[], playersPerTeam = 7): DraftResult {
    const goalkeepers = players.filter(p => p.positions.includes('G'));
    const fieldPlayers = players.filter(p => !p.positions.includes('G'));

    const sortedField = [...fieldPlayers].sort(
      (a, b) => this.calculatePowerLevel(b) - this.calculatePowerLevel(a)
    );

    const homeTeam: Player[] = [];
    const awayTeam: Player[] = [];
    const waitingList: Player[] = [];

    // 1. Distribui goleiros alternadamente
    goalkeepers.forEach((gk, idx) => {
      const target = idx % 2 === 0 ? homeTeam : awayTeam;
      if (target.length < playersPerTeam) target.push(gk);
      else waitingList.push(gk);
    });

    // 2. Snake draft para jogadores de linha
    // Padrão: H A A H H A A H (índice 0→H, 1→A, 2→A, 3→H, 4→H, 5→A...)
    sortedField.forEach((player, index) => {
      const round = Math.floor(index / 2);
      const posInRound = index % 2;
      const goToHome = round % 2 === 0 ? posInRound === 0 : posInRound === 1;

      if (goToHome) {
        if (homeTeam.length < playersPerTeam) homeTeam.push(player);
        else if (awayTeam.length < playersPerTeam) awayTeam.push(player);
        else waitingList.push(player);
      } else {
        if (awayTeam.length < playersPerTeam) awayTeam.push(player);
        else if (homeTeam.length < playersPerTeam) homeTeam.push(player);
        else waitingList.push(player);
      }
    });

    const calcRating = (team: Player[]) =>
      team.length ? team.reduce((acc, p) => acc + this.calculatePowerLevel(p), 0) / team.length : 0;

    return {
      homeTeam,
      awayTeam,
      waitingList,
      allTeams: [homeTeam, awayTeam],
      homeRating: calcRating(homeTeam),
      awayRating: calcRating(awayTeam),
    };
  }

  /**
   * Modalidade Bolão: múltiplos times, snake draft N-times.
   */
  generateBolao(players: Player[], targetPlayersPerTeam = 7): DraftResult {
    const numberOfTeams = Math.max(2, Math.floor(players.length / targetPlayersPerTeam));
    const goalkeepers = players.filter(p => p.positions.includes('G'));
    const fieldPlayers = players.filter(p => !p.positions.includes('G'));

    const sortedField = [...fieldPlayers].sort(
      (a, b) => this.calculatePowerLevel(b) - this.calculatePowerLevel(a)
    );

    const teams: Player[][] = Array.from({ length: numberOfTeams }, () => []);

    // Goleiros: um por time se disponível (sem clonar IDs)
    goalkeepers.forEach((gk, i) => {
      if (i < numberOfTeams) teams[i].push(gk);
    });

    // Snake draft para linha
    let reverse = false;
    for (let i = 0; i < sortedField.length; i += numberOfTeams) {
      const chunk = sortedField.slice(i, i + numberOfTeams);
      if (reverse) chunk.reverse();
      chunk.forEach((p, idx) => {
        if (idx < numberOfTeams && teams[idx].length < targetPlayersPerTeam + 1) {
          teams[idx].push(p);
        }
      });
      reverse = !reverse;
    }

    const draftedIds = new Set(teams.flat().map(p => p.id));
    const waitingList = players.filter(p => !draftedIds.has(p.id));

    const calcRating = (team: Player[]) =>
      team.length ? team.reduce((acc, p) => acc + this.calculatePowerLevel(p), 0) / team.length : 0;

    return {
      homeTeam: teams[0] || [],
      awayTeam: teams[1] || [],
      allTeams: teams,
      waitingList,
      homeRating: calcRating(teams[0] || []),
      awayRating: calcRating(teams[1] || []),
    };
  }
}
