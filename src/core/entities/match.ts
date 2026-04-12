export type MatchStatus = 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';

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
