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

    // Fator Altura
    if (player.height) {
      if (player.height > 1.83)        score += 5;
      else if (player.height >= 1.75)  score += 2;
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

  // Equaliza força total dos times trocando pares de mesmo posGroup
  private equalizeTeams(
    home: Player[],
    away: Player[],
    posGroup: (p: Player) => 'DEF' | 'MID' | 'FWD',
    calcPower: (p: Player) => number,
    maxIterations = 3,
  ): void {
    const isGK = (p: Player) =>
      p.posicao_principal === 'G' ||
      (Array.isArray(p.positions) && p.positions.includes('G'));

    for (let iter = 0; iter < maxIterations; iter++) {
      const hPow = home.reduce((s, p) => s + calcPower(p), 0);
      const aPow = away.reduce((s, p) => s + calcPower(p), 0);
      const diff = hPow - aPow;
      if (Math.abs(diff) < 5) break;

      const [stronger, weaker] = diff > 0 ? [home, away] : [away, home];
      let bestGain = 0, bestSi = -1, bestWi = -1;

      for (let si = 0; si < stronger.length; si++) {
        const sp = stronger[si];
        if (isGK(sp)) continue;
        for (let wi = 0; wi < weaker.length; wi++) {
          const wp = weaker[wi];
          if (isGK(wp) || posGroup(wp) !== posGroup(sp)) continue;
          const gain = Math.abs(diff) -
            Math.abs(diff - 2 * (calcPower(sp) - calcPower(wp)));
          if (gain > bestGain) { bestGain = gain; bestSi = si; bestWi = wi; }
        }
      }
      if (bestSi === -1) break;
      [stronger[bestSi], weaker[bestWi]] = [weaker[bestWi], stronger[bestSi]];
    }
  }

  // Distribui um grupo de jogadores entre dois times via snake draft
  private snakeDraft(players: Player[], homeTeam: Player[], awayTeam: Player[],
    waitingList: Player[], playersPerTeam: number, homeFirst: boolean) {
    players.forEach((player, index) => {
      const round = Math.floor(index / 2);
      const posInRound = index % 2;
      let goToHome = round % 2 === 0 ? posInRound === 0 : posInRound === 1;
      if (!homeFirst) goToHome = !goToHome;
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
  }

  /**
   * Sorteio Inteligente para Rachão.
   * 1. Goleiros distribuídos alternadamente
   * 2. Demais jogadores separados por grupo de posição (DEF / MID / FWD)
   *    e snake draft dentro de cada grupo — garante equilíbrio de posições
   *    além do equilíbrio de força total.
   * Primeiro pick aleatório para não favorecer sempre o mesmo time.
   */
  balanceTeams(players: Player[], playersPerTeam = 7): DraftResult {
    // GK detectado por posicao_principal OU positions[] — ambos precisam ser checados
    const isGK  = (p: Player) =>
      p.posicao_principal === 'G' ||
      (Array.isArray(p.positions) && p.positions.includes('G'));
    const posGroup = (p: Player): 'DEF'|'MID'|'FWD' => {
      const pos = p.posicao_principal ?? p.positions?.[0] ?? '';
      if (['ZAG','ZGD','ZGE','LD','LE'].includes(pos)) return 'DEF';
      if (['VOL','MC','MD','ME','MO'].includes(pos)) return 'MID';
      return 'FWD'; // SA, CA, PD, PE, ou sem posição
    };

    const goalkeepers = players.filter(isGK);
    const field       = players.filter(p => !isGK(p));

    // Agrupa por posição e ordena cada grupo por força (maior → menor)
    const byGroup: Record<'DEF'|'MID'|'FWD', Player[]> = { DEF: [], MID: [], FWD: [] };
    field.forEach(p => byGroup[posGroup(p)].push(p));
    (['DEF','MID','FWD'] as const).forEach(g =>
      byGroup[g].sort((a, b) => this.calculatePowerLevel(b) - this.calculatePowerLevel(a))
    );

    const homeTeam: Player[]   = [];
    const awayTeam: Player[]   = [];
    const waitingList: Player[] = [];

    // 1. Goleiros: máximo 1 por time — extras vão direto para lista de espera
    //    (goleiro só joga no gol, não entra como linha)
    const gkShuffled = [...goalkeepers].sort(() => Math.random() - 0.5);
    let homeHasGK = false;
    let awayHasGK = false;
    gkShuffled.forEach(gk => {
      if (!homeHasGK) { homeTeam.push(gk); homeHasGK = true; }
      else if (!awayHasGK) { awayTeam.push(gk); awayHasGK = true; }
      else waitingList.push(gk); // 3º+ goleiro espera próxima partida
    });

    // 2. Snake draft por grupo — cada grupo com primeiro pick aleatório independente
    (['DEF','MID','FWD'] as const).forEach(g => {
      if (byGroup[g].length === 0) return;
      const homeFirst = Math.random() < 0.5;
      this.snakeDraft(byGroup[g], homeTeam, awayTeam, waitingList, playersPerTeam, homeFirst);
    });

    // 3. Passo de equalização: até 3 swaps por posGroup para minimizar |homePower - awayPower|
    this.equalizeTeams(homeTeam, awayTeam, posGroup, this.calculatePowerLevel.bind(this));

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
    const isGKBolao = (p: Player) =>
      p.posicao_principal === 'G' ||
      (Array.isArray(p.positions) && p.positions.includes('G'));
    const goalkeepers  = players.filter(isGKBolao);
    const fieldPlayers = players.filter(p => !isGKBolao(p));

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
