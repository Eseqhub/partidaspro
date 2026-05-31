// Estatísticas agregadas de um jogador — derivadas de eventos + presença
export interface PlayerAggStats {
  matches:     number;
  goals:       number;
  assists:     number;
  wins:        number;
  draws:       number;
  losses:      number;
  yellowCards: number;
  redCards:    number;
  hatTricks:   number;  // partidas com 3+ gols
  bestStreak:  number;  // maior sequência de vitórias
  mvpCount:    number;  // prêmios de Craque da Partida
}

export const EMPTY_STATS: PlayerAggStats = {
  matches: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0,
  yellowCards: 0, redCards: 0, hatTricks: 0, bestStreak: 0, mvpCount: 0,
};

export interface Badge {
  id:       string;
  label:    string;
  icon:     string;   // emoji
  color:    string;
  desc:     string;
  earned:   boolean;
  progress?: string;  // ex: "7/10"
}

/**
 * Calcula as conquistas de um jogador a partir das estatísticas agregadas.
 * Todas derivam de dados que já são coletados (eventos + presença).
 */
export function computeBadges(s: PlayerAggStats): Badge[] {
  const winRate = s.matches > 0 ? s.wins / s.matches : 0;

  const defs: Badge[] = [
    {
      id: 'artilheiro', label: 'Artilheiro', icon: '⚽', color: '#ccff00',
      desc: '10+ gols marcados',
      earned: s.goals >= 10, progress: `${Math.min(s.goals, 10)}/10`,
    },
    {
      id: 'garcom', label: 'Garçom', icon: '🎯', color: '#00b4ff',
      desc: '10+ assistências',
      earned: s.assists >= 10, progress: `${Math.min(s.assists, 10)}/10`,
    },
    {
      id: 'hat-trick', label: 'Hat-trick', icon: '🎩', color: '#A855F7',
      desc: '3+ gols numa partida',
      earned: s.hatTricks >= 1, progress: s.hatTricks >= 1 ? `${s.hatTricks}×` : '0/1',
    },
    {
      id: 'pegada', label: 'Pegada Quente', icon: '🔥', color: '#F97316',
      desc: '3 vitórias seguidas',
      earned: s.bestStreak >= 3, progress: `${Math.min(s.bestStreak, 3)}/3`,
    },
    {
      id: 'craque', label: 'Craque da Pelada', icon: '🏆', color: '#FFD700',
      desc: 'Eleito o melhor em campo',
      earned: s.mvpCount >= 1, progress: s.mvpCount >= 1 ? `${s.mvpCount}×` : '0/1',
    },
    {
      id: 'presenca', label: 'Presença VIP', icon: '💯', color: '#22C55E',
      desc: '10+ partidas disputadas',
      earned: s.matches >= 10, progress: `${Math.min(s.matches, 10)}/10`,
    },
    {
      id: 'veterano', label: 'Veterano', icon: '🌟', color: '#EAB308',
      desc: '50+ partidas no clube',
      earned: s.matches >= 50, progress: `${Math.min(s.matches, 50)}/50`,
    },
    {
      id: 'vencedor', label: 'Máquina de Vencer', icon: '👑', color: '#EC4899',
      desc: '70%+ de aproveitamento (mín. 10 jogos)',
      earned: s.matches >= 10 && winRate >= 0.7,
      progress: `${Math.round(winRate * 100)}%`,
    },
    {
      id: 'badboy', label: 'Sangue no Olho', icon: '🟥', color: '#EF4444',
      desc: 'Levou cartão vermelho',
      earned: s.redCards >= 1, progress: s.redCards >= 1 ? `${s.redCards}×` : '—',
    },
  ];

  return defs;
}
