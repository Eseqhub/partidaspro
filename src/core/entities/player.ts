export type PlayerPositionV2 = 'G' | 'LD' | 'LE' | 'ZGD' | 'ZGE' | 'ZAG' | 'VOL' | 'MC' | 'MD' | 'ME' | 'MO' | 'PE' | 'PD' | 'SA' | 'CA';
export type PlayerStatus = 'Ativo' | 'Inativo';

export interface Player {
  id: string;
  group_id: string;
  name: string;
  full_name?: string;
  nationality?: string;
  birth_date?: string;
  phone?: string;
  preferred_foot?: 'L' | 'R' | 'Ambidestro';
  height?: number;
  weight?: number;
  photo_url?: string;
  rating: number; // 1.0 a 5.0
  positions: PlayerPositionV2[]; // Array de posições conforme fotos
  status: PlayerStatus;
  is_mensalista: boolean;
  created_at?: string;
}
