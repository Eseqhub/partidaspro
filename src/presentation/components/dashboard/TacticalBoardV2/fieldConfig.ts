import { Player } from '@/core/entities/player';

export type SportKey = 'Futsal' | 'Society' | 'Campo';

export interface FieldCfg {
  fieldW: number; fieldH: number;
  maxW: number;
  limit: number;
  bigBoxW: number; bigBoxH: number;
  smallBoxW: number; smallBoxH: number;
  goalW: number;
  circleR: number;
  penaltyY: number;
}

export const getFieldCfg = (sport: SportKey, ppt: number): FieldCfg => {
  const limit = sport === 'Futsal' ? Math.min(ppt, 5)
              : sport === 'Campo'  ? Math.min(ppt, 11)
              : Math.min(ppt, 7);

  if (sport === 'Futsal') return {
    fieldW: 16, fieldH: 34, maxW: 190, limit,
    bigBoxW: 8, bigBoxH: 6, smallBoxW: 6, smallBoxH: 3,
    goalW: 3, circleR: 3, penaltyY: 6,
  };

  if (sport === 'Campo') return {
    fieldW: 68, fieldH: 105, maxW: 360, limit,
    bigBoxW: 40.32, bigBoxH: 16.5, smallBoxW: 18.32, smallBoxH: 5.5,
    goalW: 7.32, circleR: 9.15, penaltyY: 11,
  };

  // Society Customizado
  const isFut6 = limit === 6;
  return {
    fieldW: isFut6 ? 20 : 25,
    fieldH: isFut6 ? 40 : 45,
    maxW: isFut6 ? 220 : 250,
    limit,
    bigBoxW: isFut6 ? 12 : 15,
    bigBoxH: isFut6 ? 6 : 8,
    smallBoxW: 0, smallBoxH: 0, // Society só tem a área principal
    goalW: 4, circleR: 5, penaltyY: 7,
  };
};

// Mapa tático: posição → coordenadas em % do campo (Y: 0 = topo/adversário)
export const POS_MAP: Record<string, { y: number; xBase: number }> = {
  G:   { y: 91, xBase: 50 },
  ZAG: { y: 76, xBase: 50 },
  ZGD: { y: 76, xBase: 68 }, ZGE: { y: 76, xBase: 32 },
  LD:  { y: 65, xBase: 88 }, LE:  { y: 65, xBase: 12 },
  VOL: { y: 58, xBase: 50 },
  MC:  { y: 48, xBase: 50 },
  MD:  { y: 48, xBase: 78 }, ME:  { y: 48, xBase: 22 },
  MO:  { y: 35, xBase: 50 },
  PD:  { y: 22, xBase: 84 }, PE:  { y: 22, xBase: 16 },
  SA:  { y: 18, xBase: 50 },
  CA:  { y: 12, xBase: 50 },
};
const FALLBACK = { y: 50, xBase: 50 };

// Distribui múltiplos jogadores na mesma posição lateralmente (spread simétrico)
export const computeCoords = (players: Player[]) => {
  const mapped = players.map(p => {
    const pos = p.positions?.[0] ?? 'MO';
    const pm  = POS_MAP[pos] ?? FALLBACK;
    return { player: p, y: pm.y, xBase: pm.xBase, pos };
  });

  const groups = new Map<string, typeof mapped>();
  mapped.forEach(item => {
    const key = `${item.y}_${item.xBase}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });

  const result: { player: Player; x: number; y: number }[] = [];
  groups.forEach(group => {
    if (group.length === 1) {
      result.push({ player: group[0].player, x: group[0].xBase, y: group[0].y });
    } else {
      const spread = Math.min(28, group.length * 10);
      const step   = spread / (group.length - 1 || 1);
      const startX = group[0].xBase - spread / 2;
      group.forEach((item, i) =>
        result.push({ player: item.player, x: startX + step * i, y: item.y })
      );
    }
  });
  return result;
};

export const fmtTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
