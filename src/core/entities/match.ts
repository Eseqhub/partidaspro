export type MatchStatus = 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';

export type GameMode = 'Rachão' | 'Revezamento' | 'Dois ou Dez' | 'Vira-Acaba';
export type SportType = 'Futsal' | 'Society' | 'Campo';
export type MatchType = 'rachao' | 'desafio';
export type ChallengeStatus = 'pendente' | 'aceito' | 'recusado';

export interface Match {
  id: string;
  group_id: string;
  date: string;
  location?: string;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  home_team_name?: string;
  away_team_name?: string;
  timer_seconds: number;
  match_fee: number;
  duration_minutes: number;
  stoppage_minutes: number;
  goal_limit: number;
  pix_key?: string;
  home_color?: string;
  away_color?: string;
  sport_type?: SportType;
  game_mode?: GameMode;
  max_players?: number;
  max_goalkeepers?: number;
  // Modo Desafio
  match_type?: MatchType;
  challenge_token?: string;
  challenge_status?: ChallengeStatus;
  away_group_name?: string;
  created_at?: string;
}

export type EventType = 'Gol' | 'Assistência' | 'Cartão Amarelo' | 'Cartão Vermelho' | 'Entrada' | 'Saída';

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  type: EventType;
  team: 'home' | 'away';
  minute?: number;
  created_at?: string;
}
