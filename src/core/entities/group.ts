export interface Group {
  id: string;
  name: string;
  slug: string; // URL amigável
  logo_url?: string; // Escudo do time
  owner_id: string;
  invite_password?: string;
  is_paid_model?: boolean;
  created_at: string;
}

export interface GroupConfig {
  match_fee_default: number;
  monthly_fee?: number;
}
