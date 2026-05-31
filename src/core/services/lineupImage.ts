import { Player } from '@/core/entities/player';
import { computeCoords, SportKey } from '@/presentation/components/dashboard/TacticalBoardV2/fieldConfig';
import { Formation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';

// Cores de camisa (nome → hex). Aceita também hex direto.
const COLOR_MAP: Record<string, string> = {
  Branco: '#f5f5f5', Preto: '#1a1a1a', Vermelho: '#EF4444', Azul: '#3B82F6',
  Verde: '#22C55E', Amarelo: '#EAB308', Laranja: '#F97316', Roxo: '#A855F7',
  Rosa: '#EC4899', Cinza: '#6B7280', Ciano: '#06B6D4', Marrom: '#92400E',
};
function resolveColor(c?: string): string {
  if (!c) return '#3B82F6';
  if (c.startsWith('#')) return c;
  return COLOR_MAP[c] ?? '#3B82F6';
}

// Contraste do texto sobre a camisa
function textOn(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#000000' : '#ffffff';
}

interface LineupParams {
  homeTeam: Player[];
  awayTeam: Player[];
  homeName: string;
  awayName: string;
  homeColor?: string;
  awayColor?: string;
  sport: SportKey;
  campoLabel: string;
  homeFormation?: Formation;
  awayFormation?: Formation;
  homeScore?: number;
  awayScore?: number;
}

/**
 * Desenha a escalação dos dois times num campo e retorna um PNG (Blob).
 */
export async function generateLineupImage(p: LineupParams): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Fundo ───────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a1428');
  bg.addColorStop(1, '#020810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Header ──────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ccff00';
  ctx.font = '900 30px Arial';
  ctx.fillText('⚽ ESCALAÇÃO DA PELADA', W / 2, 56);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '700 20px Arial';
  ctx.fillText(p.campoLabel.toUpperCase(), W / 2, 86);

  // Placar / nomes
  ctx.font = '900 34px Arial';
  const hc = resolveColor(p.homeColor), ac = resolveColor(p.awayColor);
  const scoreTxt = (p.homeScore != null && p.awayScore != null) ? `  ${p.homeScore} x ${p.awayScore}  ` : '  VS  ';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${p.homeName.toUpperCase()}${scoreTxt}${p.awayName.toUpperCase()}`, W / 2, 130);

  // ── Campo ───────────────────────────────────────────────────────────────
  const fx = 50, fy = 170, fw = W - 100, fh = H - 250;
  // Gramado
  const grass = ctx.createLinearGradient(0, fy, 0, fy + fh);
  grass.addColorStop(0, '#0c3318');
  grass.addColorStop(0.5, '#0a2a14');
  grass.addColorStop(1, '#0c3318');
  ctx.fillStyle = grass;
  ctx.fillRect(fx, fy, fw, fh);

  // Faixas do gramado
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 10; i += 2) ctx.fillRect(fx, fy + (fh / 10) * i, fw, fh / 10);

  // Linhas
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(fx, fy, fw, fh);
  ctx.beginPath(); ctx.moveTo(fx, fy + fh / 2); ctx.lineTo(fx + fw, fy + fh / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh / 2, 70, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh / 2, 5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
  // Áreas
  const boxW = fw * 0.45, boxH = fh * 0.12;
  ctx.strokeRect(fx + (fw - boxW) / 2, fy, boxW, boxH);
  ctx.strokeRect(fx + (fw - boxW) / 2, fy + fh - boxH, boxW, boxH);

  // ── Jogadores ───────────────────────────────────────────────────────────
  const R = 30;
  const drawPlayer = (player: Player, cx: number, cy: number, color: string, num: number) => {
    // Sombra
    ctx.beginPath(); ctx.arc(cx, cy + 3, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
    // Camisa
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    // Número
    ctx.fillStyle = textOn(color);
    ctx.font = '900 26px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(num), cx, cy + 1);
    ctx.textBaseline = 'alphabetic';
    // Nome
    const name = player.name.split(' ')[0].toUpperCase().substring(0, 12);
    ctx.font = '900 19px Arial';
    const tw = ctx.measureText(name).width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - tw / 2 - 6, cy + R + 6, tw + 12, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(name, cx, cy + R + 24);
  };

  // Home: metade de baixo | Away: metade de cima (espelhado)
  const homeCoords = computeCoords(p.homeTeam, p.sport, p.homeFormation);
  const awayCoords = computeCoords(p.awayTeam, p.sport, p.awayFormation);

  homeCoords.forEach((c, i) => {
    const px = fx + (c.x / 100) * fw;
    const py = fy + fh / 2 + (c.y / 100) * (fh / 2) * 0.92 + fh * 0.02;
    drawPlayer(c.player, px, py, hc, i + 1);
  });
  awayCoords.forEach((c, i) => {
    const px = fx + ((100 - c.x) / 100) * fw;
    const py = fy + fh / 2 - (c.y / 100) * (fh / 2) * 0.92 - fh * 0.02;
    drawPlayer(c.player, px, py, ac, i + 1);
  });

  // ── Rodapé ──────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '900 20px Arial';
  ctx.fillText('PARTIDAS.PRO — SORTEIO INTELIGENTE', W / 2, H - 36);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha ao gerar imagem')), 'image/png', 0.95);
  });
}

/** Compartilha a imagem (share nativo no mobile) ou baixa no desktop. */
export async function shareLineupImage(blob: Blob, caption: string) {
  const file = new File([blob], 'escalacao.png', { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: caption, title: 'Escalação' });
      return;
    } catch { /* usuário cancelou → tenta download */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'escalacao.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
