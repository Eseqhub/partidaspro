import { SportKey } from './fieldConfig';

export interface FormRow { y: number; count: number }

export interface Formation {
  id: string;
  label: string;       // ex: "4-3-3"
  name: string;        // ex: "Clássico"
  sport: SportKey;
  playersPerTeam: number;
  // rows SEM incluir o GK (o GK é sempre adicionado em y=87-90%)
  outfieldRows: FormRow[];
}

// ── X slots para N jogadores em uma linha ──────────────────────────────────
export const xSlots = (n: number): number[] => {
  if (n === 1) return [50];
  if (n === 2) return [26, 74];
  if (n === 3) return [18, 50, 82];
  if (n === 4) return [11, 37, 63, 89];
  if (n === 5) return [9, 27, 50, 73, 91];
  return Array.from({ length: n }, (_, i) => 10 + (80 / Math.max(n - 1, 1)) * i);
};

// ── FUTSAL 5×5 ─────────────────────────────────────────────────────────────
const FUTSAL: Formation[] = [
  {
    id: 'futsal-1-2-1', label: '1-2-1', name: 'Clássico',
    sport: 'Futsal', playersPerTeam: 5,
    outfieldRows: [{ y: 64, count: 1 }, { y: 40, count: 2 }, { y: 15, count: 1 }],
  },
  {
    id: 'futsal-2-2', label: '2-2', name: 'Equilibrado',
    sport: 'Futsal', playersPerTeam: 5,
    outfieldRows: [{ y: 62, count: 2 }, { y: 20, count: 2 }],
  },
  {
    id: 'futsal-3-1', label: '3-1', name: 'Ofensivo',
    sport: 'Futsal', playersPerTeam: 5,
    outfieldRows: [{ y: 48, count: 3 }, { y: 14, count: 1 }],
  },
  {
    id: 'futsal-2-1-1', label: '2-1-1', name: 'Defensivo',
    sport: 'Futsal', playersPerTeam: 5,
    outfieldRows: [{ y: 64, count: 2 }, { y: 40, count: 1 }, { y: 15, count: 1 }],
  },
];

// ── SOCIETY 6×6 ────────────────────────────────────────────────────────────
const SOCIETY_6: Formation[] = [
  {
    id: 'soc6-2-2-1', label: '2-2-1', name: 'Equilibrado',
    sport: 'Society', playersPerTeam: 6,
    outfieldRows: [{ y: 67, count: 2 }, { y: 43, count: 2 }, { y: 15, count: 1 }],
  },
  {
    id: 'soc6-2-1-2', label: '2-1-2', name: 'Ofensivo',
    sport: 'Society', playersPerTeam: 6,
    outfieldRows: [{ y: 67, count: 2 }, { y: 43, count: 1 }, { y: 15, count: 2 }],
  },
  {
    id: 'soc6-3-2', label: '3-2', name: 'Defensivo',
    sport: 'Society', playersPerTeam: 6,
    outfieldRows: [{ y: 65, count: 3 }, { y: 18, count: 2 }],
  },
  {
    id: 'soc6-1-3-1', label: '1-3-1', name: 'Pivô',
    sport: 'Society', playersPerTeam: 6,
    outfieldRows: [{ y: 67, count: 1 }, { y: 43, count: 3 }, { y: 14, count: 1 }],
  },
];

// ── SOCIETY 7×7 ────────────────────────────────────────────────────────────
const SOCIETY_7: Formation[] = [
  {
    id: 'soc7-2-3-1', label: '2-3-1', name: 'Clássico',
    sport: 'Society', playersPerTeam: 7,
    outfieldRows: [{ y: 69, count: 2 }, { y: 46, count: 3 }, { y: 15, count: 1 }],
  },
  {
    id: 'soc7-3-2-1', label: '3-2-1', name: 'Defensivo',
    sport: 'Society', playersPerTeam: 7,
    outfieldRows: [{ y: 69, count: 3 }, { y: 44, count: 2 }, { y: 15, count: 1 }],
  },
  {
    id: 'soc7-2-2-2', label: '2-2-2', name: 'Simétrico',
    sport: 'Society', playersPerTeam: 7,
    outfieldRows: [{ y: 69, count: 2 }, { y: 45, count: 2 }, { y: 17, count: 2 }],
  },
  {
    id: 'soc7-3-3', label: '3-3', name: 'Bloco',
    sport: 'Society', playersPerTeam: 7,
    outfieldRows: [{ y: 67, count: 3 }, { y: 18, count: 3 }],
  },
  {
    id: 'soc7-4-2', label: '4-2', name: 'Ultra-Def.',
    sport: 'Society', playersPerTeam: 7,
    outfieldRows: [{ y: 68, count: 4 }, { y: 17, count: 2 }],
  },
];

// ── CAMPO 11×11 ────────────────────────────────────────────────────────────
const CAMPO: Formation[] = [
  {
    id: 'campo-4-4-2', label: '4-4-2', name: 'Clássico',
    sport: 'Campo', playersPerTeam: 11,
    outfieldRows: [{ y: 75, count: 4 }, { y: 52, count: 4 }, { y: 22, count: 2 }],
  },
  {
    id: 'campo-4-3-3', label: '4-3-3', name: 'Moderno',
    sport: 'Campo', playersPerTeam: 11,
    outfieldRows: [{ y: 75, count: 4 }, { y: 52, count: 3 }, { y: 22, count: 3 }],
  },
  {
    id: 'campo-3-5-2', label: '3-5-2', name: 'Meio-campo',
    sport: 'Campo', playersPerTeam: 11,
    outfieldRows: [{ y: 75, count: 3 }, { y: 52, count: 5 }, { y: 22, count: 2 }],
  },
  {
    id: 'campo-4-5-1', label: '4-5-1', name: 'Defensivo',
    sport: 'Campo', playersPerTeam: 11,
    outfieldRows: [{ y: 75, count: 4 }, { y: 50, count: 5 }, { y: 20, count: 1 }],
  },
  {
    id: 'campo-3-4-3', label: '3-4-3', name: 'Ofensivo',
    sport: 'Campo', playersPerTeam: 11,
    outfieldRows: [{ y: 75, count: 3 }, { y: 50, count: 4 }, { y: 22, count: 3 }],
  },
  {
    id: 'campo-5-3-2', label: '5-3-2', name: 'Retrancado',
    sport: 'Campo', playersPerTeam: 11,
    outfieldRows: [{ y: 75, count: 5 }, { y: 50, count: 3 }, { y: 20, count: 2 }],
  },
];

// ── Export agrupado ────────────────────────────────────────────────────────
export const FORMATIONS_BY_SPORT: Record<SportKey, Formation[][]> = {
  Futsal:  [FUTSAL],
  Society: [SOCIETY_6, SOCIETY_7],
  Campo:   [CAMPO],
};

/** Retorna as formações disponíveis para o sport e playersPerTeam */
export function getFormations(sport: SportKey, playersPerTeam: number): Formation[] {
  if (sport === 'Futsal') return FUTSAL;
  if (sport === 'Campo')  return CAMPO;
  // Society: escolhe pelo número de jogadores
  return playersPerTeam <= 6 ? SOCIETY_6 : SOCIETY_7;
}

/** Formação padrão por sport+ppt */
export function defaultFormation(sport: SportKey, playersPerTeam: number): Formation {
  return getFormations(sport, playersPerTeam)[0];
}
