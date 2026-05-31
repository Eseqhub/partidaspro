export type TipoCampo = 'Futsal 5x5' | 'Society 6x6' | 'Society 7x7' | 'Campo 11x11';
export type Modalidade = 'Rachão' | 'Bolão' | 'Revezamento' | 'Dez_ou_2_gols';

export interface MatchConfig {
  id?: string;
  match_id?: string;
  group_id: string;
  tipo_campo: TipoCampo;
  modalidade: Modalidade;
  local?: string;
  hora_inicio?: string;   // "HH:MM"
  hora_fim?: string;      // "HH:MM"
  duracao_minutos?: number;
  created_at?: string;
}
