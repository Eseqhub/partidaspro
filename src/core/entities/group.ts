export interface Group {
  id: string;
  name: string;
  slug: string; // URL amigável
  logo_url?: string; // Escudo do time
  owner_id: string;
  invite_password?: string;
  is_paid_model?: boolean;
  rules_text?: string;
  estatuto_regras?: string;  // Estatuto/regras longo do grupo (visível a todos)
  description?: string;
  founded_year?: number;
  recurrence_day?: string;
  sport_type_default?: 'Futsal' | 'Society' | 'Campo';
  recruitment_link_hash?: string;
  auto_approve_members?: boolean;
  created_at: string;
}

export interface GroupConfig {
  match_fee_default: number;
  monthly_fee?: number;
}
