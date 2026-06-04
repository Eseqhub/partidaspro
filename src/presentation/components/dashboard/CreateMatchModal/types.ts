import { MatchType, SportType, GameMode } from '@/core/entities/match';

export type RotationRule = 'winner_stays' | 'two_and_out' | 'goal_diff';

export interface CreateMatchConfig {
  match_type: MatchType;
  sport_type: SportType;
  game_mode: GameMode;
  home_team_name: string;
  away_team_name: string;
  home_color: string;
  away_color: string;
  playersPerTeam: number;
  duration: number;
  stoppage: number;
  goalLimit: number;
  location: string;
  date: string;
  sessionStartTime: string;
  rotation_rule: RotationRule;
  rotation_goal_diff: number;
}

export type Step = 'choose' | 'rachao' | 'manual';

export const STEP_LABELS: Record<Step, { sub: string; title: string }> = {
  choose: { sub: 'NOVA SESSÃO',              title: 'Que tipo de jogo?' },
  rachao: { sub: 'CONFIGURAR RACHÃO',        title: 'Pelada com Sorteio' },
  manual: { sub: 'CONFIGURAR TIME VS TIME',  title: 'Times Definidos' },
};

export const DEFAULT_CFG: CreateMatchConfig = {
  match_type: 'rachao',
  sport_type: 'Society',
  game_mode: 'Rachão',
  home_team_name: '',
  away_team_name: '',
  home_color: 'Branco',
  away_color: 'Preto',
  playersPerTeam: 7,
  duration: 10,
  stoppage: 0,
  goalLimit: 0,
  location: '',
  date: new Date().toISOString().slice(0, 10),
  sessionStartTime: '08:00',
  rotation_rule: 'two_and_out',
  rotation_goal_diff: 2,
};
