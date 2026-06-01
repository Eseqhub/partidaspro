import { faLayerGroup, faDice, faUsers, faTrophy } from '@fortawesome/free-solid-svg-icons';

export type TipoCampo = 'Futsal 5x5' | 'Society 6x6' | 'Society 7x7' | 'Campo 11x11';
export type Modalidade = 'Rachão' | 'Bolão' | 'Manual' | 'Desafio';
export type Recorrencia = 'nao' | 'semanal' | 'quinzenal' | 'mensal';

export interface MatchDraft {
  tipo_campo:           TipoCampo;
  modalidade:           Modalidade;
  recorrencia:          Recorrencia;
  recorrencia_dia:      string;
  data:                 string;
  hora_inicio:          string;
  hora_fim:             string;
  local:                string;
  duracao_minutos:      number;
  nome_time_adversario?: string;
  nome_time_a:          string;
  nome_time_b:          string;
  cor_time_a:           string;
  cor_time_b:           string;
  limite_gols:          number;
}

export const MATCH_DRAFT_INITIAL: MatchDraft = {
  tipo_campo:      'Society 7x7',
  modalidade:      'Rachão',
  recorrencia:     'nao',
  recorrencia_dia: 'Terça-feira',
  data:            new Date().toISOString().split('T')[0],
  hora_inicio:     '08:00',
  hora_fim:        '10:00',
  local:           '',
  duracao_minutos: 10,
  nome_time_a:     'Time Casa',
  nome_time_b:     'Visitante',
  cor_time_a:      'Branco',
  cor_time_b:      'Preto',
  limite_gols:     0,
};

export const neon   = '#ccff00';
export const blue   = '#00b4ff';
export const gold   = '#d4a017';
export const green  = '#22c55e';
export const purple = '#a855f7';

export const SHIRT_COLORS: { label: string; hex: string }[] = [
  { label: 'Branco',   hex: '#ffffff' },
  { label: 'Preto',    hex: '#111111' },
  { label: 'Vermelho', hex: '#EF4444' },
  { label: 'Azul',     hex: '#3B82F6' },
  { label: 'Verde',    hex: '#22C55E' },
  { label: 'Amarelo',  hex: '#EAB308' },
  { label: 'Laranja',  hex: '#F97316' },
  { label: 'Roxo',     hex: '#A855F7' },
  { label: 'Rosa',     hex: '#EC4899' },
  { label: 'Cinza',    hex: '#6B7280' },
  { label: 'Ciano',    hex: '#06B6D4' },
  { label: 'Marrom',   hex: '#92400E' },
];

export const CAMPOS: { value: TipoCampo; label: string; sub: string; players: number; emoji: string }[] = [
  { value: 'Futsal 5x5',  label: 'Futsal',  sub: '5 × 5',   players: 5,  emoji: '🏟️' },
  { value: 'Society 6x6', label: 'Society', sub: '6 × 6',   players: 6,  emoji: '⚽' },
  { value: 'Society 7x7', label: 'Society', sub: '7 × 7',   players: 7,  emoji: '⚽' },
  { value: 'Campo 11x11', label: 'Campo',   sub: '11 × 11', players: 11, emoji: '🏆' },
];

export const MODALIDADES: { value: Modalidade; label: string; desc: string; icon: any; color: string }[] = [
  {
    value: 'Rachão',
    label: 'Rachão / Sorteio',
    desc: 'Times sorteados automaticamente pelo algoritmo inteligente levando em conta habilidade, posição, idade e físico.',
    icon: faDice,
    color: neon,
  },
  {
    value: 'Bolão',
    label: 'Bolão — Torneio',
    desc: 'Gera de 3 a 6 times equilibrados e monta um chaveamento automático. Quem perde 2× vai pra repescagem.',
    icon: faLayerGroup,
    color: purple,
  },
  {
    value: 'Manual',
    label: 'Time Contra Time',
    desc: 'Você escala cada jogador como Titular ou Reserva de cada time. Sem sorteio automático.',
    icon: faUsers,
    color: blue,
  },
  {
    value: 'Desafio',
    label: 'Desafio de Clube',
    desc: 'Partida contra outro clube. Gere um link de desafio e envie para o adversário confirmar.',
    icon: faTrophy,
    color: gold,
  },
];

export const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
};

export const lbl: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' as any,
  letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginBottom: 6,
};

export function totalSteps(modalidade: Modalidade) {
  return modalidade === 'Desafio' ? 4 : 3;
}
