export type MatchStatus = 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';

export type GameMode = 'Rachão' | 'Bolão' | 'Revezamento' | 'Dois ou Dez' | 'Vira-Acaba' | 'Dez ou 2 Gols';
export type SportType = 'Futsal' | 'Society' | 'Campo';
export type MatchType = 'rachao' | 'desafio' | 'manual';
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
  timer_started_at?: string | null;
  match_fee: number;
  duration_minutes: number;
  stoppage_minutes: number;
  goal_limit: number;
  pix_key?: string;
  home_color?: string;
  away_color?: string;
  sport_type?: SportType;
  game_mode?: GameMode;
  // Novos campos de configuração (mais descritivos)
  field_type?: 'Futsal 5x5' | 'Society 6x6' | 'Society 7x7' | 'Campo 11x11';
  modality?: 'Rachão' | 'Bolão' | 'Revezamento' | 'Dez ou 2 Gols';
  start_time?: string; // HH:MM
  end_time?: string;   // HH:MM
  max_players?: number;
  max_goalkeepers?: number;
  // Modo Desafio
  match_type?: MatchType;
  challenge_token?: string;
  challenge_status?: ChallengeStatus;
  away_group_name?: string;
  created_at?: string;
}

export type EventType = 'Gol' | 'Assistência' | 'Cartão Amarelo' | 'Cartão Vermelho' | 'Entrada' | 'Saída' | 'Craque';

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  type: EventType;
  team: 'home' | 'away';
  minute?: number;
  created_at?: string;
}
