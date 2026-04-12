export interface Group {
  id: string;
  name: string;
  owner_id: string;
  is_paid_model: boolean;
  invite_password?: string;
  created_at?: string;
}

export interface GroupConfig {
  match_fee_default: number;
  monthly_fee?: number;
}
