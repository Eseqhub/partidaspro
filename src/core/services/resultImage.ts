// Gera um card de RESULTADO da partida (PNG) para compartilhar.

const COLOR_MAP: Record<string, string> = {
  Branco: '#f5f5f5', Preto: '#1a1a1a', Vermelho: '#EF4444', Azul: '#3B82F6',
  Verde: '#22C55E', Amarelo: '#EAB308', Laranja: '#F97316', Roxo: '#A855F7',
  Rosa: '#EC4899', Cinza: '#6B7280', Ciano: '#06B6D4', Marrom: '#92400E',
};
function resolveColor(c?: string): string {
  if (!c) return '#3B82F6';
  return c.startsWith('#') ? c : (COLOR_MAP[c] ?? '#3B82F6');
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface ResultParams {
  groupName?: string;
  homeName: string;
  awayName: string;
  homeColor?: string;
  awayColor?: string;
  homeScore: number;
  awayScore: number;
  scorers?: { name: string; team: 'home' | 'away'; goals: number }[];
  mvpName?: string;
}

export async function generateResultImage(p: ResultParams): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const lime = '#ccff00', gold = '#FFD700';

  // Fundo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a1428'); bg.addColorStop(1, '#020810');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Header
  ctx.textAlign = 'center';
  if (p.groupName) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '700 24px Arial';
    ctx.fillText(p.groupName.toUpperCase(), W / 2, 80);
  }
  ctx.fillStyle = lime; ctx.font = '900 40px Arial';
  ctx.fillText('RESULTADO FINAL', W / 2, 140);

  // Placar grande
  const hc = resolveColor(p.homeColor), ac = resolveColor(p.awayColor);
  const winnerHome = p.homeScore > p.awayScore;
  const winnerAway = p.awayScore > p.homeScore;

  // Nomes dos times
  ctx.font = '900 38px Arial';
  ctx.fillStyle = winnerHome ? gold : '#fff';
  ctx.fillText(p.homeName.toUpperCase().substring(0, 18), W / 2, 280);
  ctx.fillStyle = winnerAway ? gold : '#fff';
  ctx.fillText(p.awayName.toUpperCase().substring(0, 18), W / 2, 620);

  // Bolas de cor
  ctx.beginPath(); ctx.arc(W / 2, 200, 26, 0, Math.PI * 2); ctx.fillStyle = hc; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, 540, 26, 0, Math.PI * 2); ctx.fillStyle = ac; ctx.fill(); ctx.stroke();

  // Placar central gigante
  ctx.font = '900 180px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${p.homeScore}`, W / 2 - 130, 470);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('-', W / 2, 460);
  ctx.fillStyle = '#fff';
  ctx.fillText(`${p.awayScore}`, W / 2 + 130, 470);

  // Banner vencedor
  const bannerY = 700;
  ctx.fillStyle = winnerHome || winnerAway ? `${gold}1a` : 'rgba(255,255,255,0.05)';
  roundRect(ctx, 140, bannerY, W - 280, 80, 16); ctx.fill();
  ctx.strokeStyle = winnerHome || winnerAway ? `${gold}55` : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2; ctx.stroke();
  ctx.font = '900 34px Arial';
  ctx.fillStyle = winnerHome || winnerAway ? gold : 'rgba(255,255,255,0.6)';
  const winnerTxt = winnerHome ? `🏆 ${p.homeName.toUpperCase()} VENCEU`
    : winnerAway ? `🏆 ${p.awayName.toUpperCase()} VENCEU` : '🤝 EMPATE';
  ctx.fillText(winnerTxt.substring(0, 30), W / 2, bannerY + 52);

  // Artilheiros
  let y = 880;
  if (p.scorers && p.scorers.length) {
    ctx.fillStyle = lime; ctx.font = '900 26px Arial';
    ctx.fillText('⚽ ARTILHEIROS', W / 2, y); y += 50;
    ctx.font = '700 28px Arial';
    p.scorers.slice(0, 6).forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.fillText(`${s.name}${s.goals > 1 ? ` (${s.goals})` : ''}`, W / 2, y);
      y += 44;
    });
  }

  // Craque
  if (p.mvpName) {
    y += 16;
    ctx.fillStyle = gold; ctx.font = '900 26px Arial';
    ctx.fillText(`🌟 CRAQUE: ${p.mvpName.toUpperCase()}`, W / 2, y);
  }

  // Rodapé — marca
  const my = H - 60;
  ctx.strokeStyle = lime; ctx.globalAlpha = 0.9; ctx.lineWidth = 2.5;
  roundRect(ctx, W / 2 - 150, my - 16, 24, 30, 5); ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 150, my - 1); ctx.lineTo(W / 2 - 126, my - 1); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2 - 138, my - 1, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = lime;
  [[-145, 7], [-131, 7], [-138, 12]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(W / 2 + dx, my + dy, 2.6, 0, Math.PI * 2); ctx.fill(); });
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '900 24px Arial';
  ctx.fillStyle = '#fff'; ctx.fillText('PARTIDAS', W / 2 - 112, my - 1);
  const pw = ctx.measureText('PARTIDAS').width;
  ctx.fillStyle = lime; ctx.fillText(' PRO', W / 2 - 112 + pw, my - 1);
  ctx.textBaseline = 'alphabetic';

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha ao gerar imagem')), 'image/png', 0.95);
  });
}

export async function shareResultImage(blob: Blob, caption: string) {
  const file = new File([blob], 'resultado.png', { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], text: caption, title: 'Resultado' }); return; } catch {}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'resultado.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
