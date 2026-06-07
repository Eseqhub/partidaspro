import { Player } from '@/core/entities/player';
import { Formation, xSlots } from './formations';

export type SportKey = 'Futsal' | 'Society' | 'Campo';

export interface FieldCfg {
  fieldW: number;      // largura SVG (metros)
  fieldH: number;      // altura SVG (metros)
  maxW: number;        // largura máxima em px para display
  limit: number;       // jogadores titulares
  bigBoxW: number;     // grande área largura
  bigBoxH: number;     // grande área profundidade
  smallBoxW: number;   // pequena área largura (0 = não existe)
  smallBoxH: number;   // pequena área profundidade
  goalW: number;       // largura das traves
  circleR: number;     // raio do círculo central
  penaltyY: number;    // distância do ponto de pênalti à linha do gol
  arcR: number;        // raio do arco de pênalti (Campo) / arco de goleiro (Futsal)
  hasCorners: boolean; // arcos de canto
  sportLabel: string;  // label para exibir
}

export const getFieldCfg = (sport: SportKey, ppt: number): FieldCfg => {
  const limit = sport === 'Futsal' ? Math.min(ppt, 5)
              : sport === 'Campo'  ? Math.min(ppt, 11)
              : Math.min(ppt, 7);

  // ── Futsal (28m × 15m real, exibido portrait) ───────────────────────────
  if (sport === 'Futsal') return {
    fieldW: 15, fieldH: 28, maxW: 175, limit,
    bigBoxW: 9.5, bigBoxH: 0,        // Futsal não tem grande área retangular
    smallBoxW: 5, smallBoxH: 2.2,    // pequena área (goleiro)
    goalW: 3, circleR: 3, penaltyY: 6,
    arcR: 6,                          // raio do semicírculo de penalidade
    hasCorners: false,
    sportLabel: `Futsal ${limit}×${limit}`,
  };

  // ── Campo 11×11 (105m × 68m) ────────────────────────────────────────────
  if (sport === 'Campo') return {
    fieldW: 68, fieldH: 105, maxW: 340, limit,
    bigBoxW: 40.32, bigBoxH: 16.5,
    smallBoxW: 18.32, smallBoxH: 5.5,
    goalW: 7.32, circleR: 9.15, penaltyY: 11,
    arcR: 9.15,
    hasCorners: true,
    sportLabel: `Campo ${limit}×${limit}`,
  };

  // ── Society ──────────────────────────────────────────────────────────────
  const is6 = limit <= 6;
  return {
    fieldW: is6 ? 22 : 32,
    fieldH: is6 ? 37 : 52,
    maxW:   is6 ? 210 : 260,
    limit,
    bigBoxW: is6 ? 11 : 16,
    bigBoxH: is6 ? 5.5 : 8,
    smallBoxW: 0, smallBoxH: 0,       // Society não tem pequena área
    goalW: is6 ? 3.5 : 5,
    circleR: is6 ? 4.5 : 6,
    penaltyY: is6 ? 6.5 : 8.5,
    arcR: 0,                          // Society não tem arco de pênalti
    hasCorners: false,
    sportLabel: `Society ${limit}×${limit}`,
  };
};

// ── Classificação de posição ─────────────────────────────────────────────
// DMF = volante/meia defensivo (mais recuado no meio)
// AMF = meia ofensivo (mais adiantado no meio)
type PosType = 'GK' | 'DEF' | 'DMF' | 'AMF' | 'FWD';

const POS_TYPE: Record<string, PosType> = {
  G:   'GK',
  ZAG: 'DEF', ZGD: 'DEF', ZGE: 'DEF', LD: 'DEF', LE: 'DEF',
  VOL: 'DMF', MC: 'DMF', MD: 'DMF', ME: 'DMF',
  MO:  'AMF',
  PD:  'FWD', PE: 'FWD', SA: 'FWD', CA: 'FWD',
};

// Ordem lateral dentro de cada linha: 0=esquerda, 50=centro, 100=direita
const LATERAL_ORDER: Record<string, number> = {
  // Defesa
  LE: 0, ZGE: 20, ZAG: 50, ZGD: 80, LD: 100,
  // Meio (volantes no centro, meias nas alas)
  ME: 10, VOL: 45, MC: 50, MO: 55, MD: 90,
  // Ataque
  PE: 0, SA: 35, CA: 50, PD: 100,
  // Goleiro
  G: 50,
};

// ── Formações por modalidade/número de jogadores ─────────────────────────
// Cada linha: { y: porcentagem do campo (0=topo, 100=fundo), count: jogadores }
// O goleiro sempre vai para y=88 (ou ajustado por sport)

interface FormRow { y: number; count: number }

const FORMATIONS: Record<string, FormRow[]> = {
  // ── Futsal ─────────────────────────────────
  'Futsal-2': [{ y: 84, count: 1 }, { y: 16, count: 1 }],
  'Futsal-3': [{ y: 84, count: 1 }, { y: 52, count: 1 }, { y: 17, count: 1 }],
  'Futsal-4': [{ y: 84, count: 1 }, { y: 60, count: 2 }, { y: 17, count: 1 }],
  'Futsal-5': [{ y: 84, count: 1 }, { y: 62, count: 2 }, { y: 38, count: 1 }, { y: 16, count: 1 }],

  // ── Society 6×6 (1-2-2-1) ──────────────────
  'Society-4': [{ y: 86, count: 1 }, { y: 58, count: 2 }, { y: 16, count: 1 }],
  'Society-5': [{ y: 86, count: 1 }, { y: 64, count: 2 }, { y: 38, count: 1 }, { y: 16, count: 1 }],
  'Society-6': [{ y: 86, count: 1 }, { y: 67, count: 2 }, { y: 42, count: 2 }, { y: 15, count: 1 }],

  // ── Society 7×7 (1-2-3-1) ──────────────────
  'Society-7': [{ y: 86, count: 1 }, { y: 69, count: 2 }, { y: 46, count: 3 }, { y: 15, count: 1 }],
  'Society-8': [{ y: 86, count: 1 }, { y: 70, count: 2 }, { y: 48, count: 3 }, { y: 26, count: 1 }, { y: 14, count: 1 }],

  // ── Campo ───────────────────────────────────
  'Campo-7':  [{ y: 90, count: 1 }, { y: 72, count: 3 }, { y: 48, count: 2 }, { y: 24, count: 1 }],
  'Campo-8':  [{ y: 90, count: 1 }, { y: 73, count: 3 }, { y: 50, count: 2 }, { y: 24, count: 2 }],
  'Campo-9':  [{ y: 90, count: 1 }, { y: 73, count: 3 }, { y: 51, count: 3 }, { y: 24, count: 2 }],
  'Campo-10': [{ y: 90, count: 1 }, { y: 75, count: 4 }, { y: 54, count: 3 }, { y: 24, count: 2 }],
  'Campo-11': [{ y: 90, count: 1 }, { y: 75, count: 4 }, { y: 54, count: 3 }, { y: 26, count: 3 }],
};

// xSlots vem de formations.ts

// Formação genérica: distribui N jogadores em linhas equilibradas
function buildGenericFormation(total: number, sport: SportKey): FormRow[] {
  const gkY = sport === 'Campo' ? 90 : 86;

  if (total <= 1) return [{ y: gkY, count: 1 }];

  const outfield = total - 1;
  const rows: FormRow[] = [{ y: gkY, count: 1 }];

  // Distribui outfield em 2–3 linhas
  if (outfield <= 3) {
    rows.push({ y: 55, count: outfield });
  } else if (outfield <= 6) {
    const r1 = Math.ceil(outfield / 2);
    const r2 = outfield - r1;
    rows.push({ y: 65, count: r1 });
    rows.push({ y: 30, count: r2 });
  } else {
    const r1 = Math.round(outfield * 0.4);
    const r2 = Math.round(outfield * 0.35);
    const r3 = outfield - r1 - r2;
    const midY = sport === 'Campo' ? 54 : 45;
    rows.push({ y: 74, count: r1 });
    rows.push({ y: midY, count: r2 });
    rows.push({ y: 24, count: Math.max(r3, 0) });
  }

  return rows;
}

// ── Função principal: mapeia jogadores para coordenadas % ────────────────
export const computeCoords = (
  players: Player[],
  sport: SportKey = 'Society',
  formation?: Formation,
): { player: Player; x: number; y: number }[] => {
  if (!players.length) return [];

  // Se formação selecionada, usa ela; senão usa mapa padrão
  let rows: FormRow[];
  if (formation) {
    const gkY = sport === 'Campo' ? 90 : 86;
    rows = [{ y: gkY, count: 1 }, ...formation.outfieldRows];
  } else {
    const key = `${sport}-${players.length}`;
    rows = FORMATIONS[key] ?? buildGenericFormation(players.length, sport);
  }

  // Detecção de goleiro: posicao_principal OU positions[]
  const isGK = (p: Player) =>
    p.posicao_principal === 'G' ||
    (Array.isArray(p.positions) && p.positions.includes('G'));

  const gkIdx = players.findIndex(isGK);
  const ordered: Player[] = [];

  if (gkIdx >= 0) {
    ordered.push(players[gkIdx]);
    players.forEach((p, i) => { if (i !== gkIdx) ordered.push(p); });
  } else {
    ordered.push(...players);
  }

  // Classifica jogadores por tipo de posição (usa posicao_principal prioritariamente)
  const byType: Record<PosType, Player[]> = { GK: [], DEF: [], DMF: [], AMF: [], FWD: [] };
  ordered.forEach(p => {
    const pos = p.posicao_principal ?? p.positions?.[0] ?? '';
    const type = POS_TYPE[pos] ?? 'DMF';
    byType[type].push(p);
  });

  // GK row = row com maior y
  const gkRow = rows.reduce((max, r) => r.y > max.y ? r : max, rows[0]);
  // Outfield rows ordenados por y DESC: recuados (DEF) → meio (DMF/AMF) → avançados (FWD)
  const outfieldRows = rows.filter(r => r !== gkRow).sort((a, b) => b.y - a.y);

  const rowTypeOf = (i: number, total: number): PosType => {
    if (total <= 1) return 'DMF';
    if (total === 2) return i === 0 ? 'DEF' : 'FWD';
    if (i === 0) return 'DEF';
    if (i === total - 1) return 'FWD';
    // Linhas intermediárias: primeira metade = DMF (volante), segunda = AMF (meia ofensivo)
    const midIdx  = i - 1;
    const midTotal = total - 2;
    return midIdx < Math.ceil(midTotal / 2) ? 'DMF' : 'AMF';
  };

  const rowTypeMap = new Map<FormRow, PosType>();
  rowTypeMap.set(gkRow, 'GK');
  outfieldRows.forEach((r, i) => rowTypeMap.set(r, rowTypeOf(i, outfieldRows.length)));

  // Cursores independentes por tipo
  const cursors: Record<PosType, number> = { GK: 0, DEF: 0, DMF: 0, AMF: 0, FWD: 0 };
  // Fallback: VOL/MC (DMF) preenche defesa vazia; MO (AMF) preenche ataque vazio
  const FALLBACK: Record<PosType, PosType[]> = {
    GK:  ['GK',  'DEF', 'DMF', 'AMF', 'FWD'],
    DEF: ['DEF', 'DMF', 'AMF', 'FWD', 'GK'],
    DMF: ['DMF', 'DEF', 'AMF', 'FWD', 'GK'],
    AMF: ['AMF', 'DMF', 'FWD', 'DEF', 'GK'],
    FWD: ['FWD', 'AMF', 'DMF', 'DEF', 'GK'],
  };
  const nextPlayer = (primary: PosType): Player | null => {
    for (const t of FALLBACK[primary]) {
      if (cursors[t] < byType[t].length) return byType[t][cursors[t]++];
    }
    return null;
  };

  const lateralScore = (p: Player): number => {
    const pos = p.posicao_principal ?? p.positions?.[0] ?? '';
    return LATERAL_ORDER[pos] ?? 50;
  };

  const result: { player: Player; x: number; y: number }[] = [];

  for (const row of rows) {
    const type = rowTypeMap.get(row)!;
    // Coleta jogadores para esta linha
    const rowPlayers: Player[] = [];
    for (let s = 0; s < row.count; s++) {
      const p = nextPlayer(type);
      if (p) rowPlayers.push(p);
    }
    // Ordena lateralmente: esquerda → centro → direita
    rowPlayers.sort((a, b) => lateralScore(a) - lateralScore(b));
    // Distribui nos slots (centralizado ao número real de jogadores)
    const slots = xSlots(rowPlayers.length);
    rowPlayers.forEach((p, i) => result.push({ player: p, x: slots[i], y: row.y }));
  }

  // Sobras não alocadas
  const placed = new Set(result.map(r => r.player.id));
  const leftover = [...byType.GK, ...byType.DEF, ...byType.DMF, ...byType.AMF, ...byType.FWD]
    .filter(p => !placed.has(p.id));
  const lastRow = rows[rows.length - 1];
  leftover.forEach(p => result.push({ player: p, x: 50, y: Math.max(14, lastRow.y - 15) }));

  return result;
};

export const fmtTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
