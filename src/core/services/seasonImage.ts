// Card "Resumo da Temporada" (PNG) para compartilhar.

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface SeasonCardParams {
  groupName?: string;
  monthLabel: string;
  champion?: { name: string; points: number; wins: number };
  topScorer?: { name: string; value: number };
  topAssister?: { name: string; value: number };
  craque?: { name: string; value: number };
}

export async function generateSeasonImage(p: SeasonCardParams): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const lime = '#ccff00', gold = '#FFD700';

  // Fundo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a1428'); bg.addColorStop(1, '#020810');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Glow
  const glow = ctx.createRadialGradient(W / 2, 380, 50, W / 2, 380, 500);
  glow.addColorStop(0, 'rgba(255,215,0,0.10)'); glow.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Header
  if (p.groupName) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '700 24px Arial';
    ctx.fillText(p.groupName.toUpperCase(), W / 2, 80);
  }
  ctx.fillStyle = lime; ctx.font = '900 42px Arial';
  ctx.fillText('RESUMO DA TEMPORADA', W / 2, 140);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '900 26px Arial';
  ctx.fillText(p.monthLabel.toUpperCase(), W / 2, 184);

  // Campeão
  if (p.champion) {
    ctx.font = '70px Arial'; ctx.fillText('👑', W / 2, 320);
    ctx.fillStyle = gold; ctx.font = '900 26px Arial';
    ctx.fillText('LÍDER DA TEMPORADA', W / 2, 380);
    ctx.fillStyle = '#fff'; ctx.font = '900 56px Arial';
    ctx.fillText(p.champion.name.toUpperCase().substring(0, 18), W / 2, 445);
    ctx.fillStyle = gold; ctx.font = '900 30px Arial';
    ctx.fillText(`${p.champion.points} PONTOS · ${p.champion.wins} VITÓRIAS`, W / 2, 495);
  }

  // Destaques
  const rows = [
    { emoji: '⚽', label: 'ARTILHEIRO',   data: p.topScorer,   suffix: 'gols',     color: lime },
    { emoji: '🎯', label: 'GARÇOM',       data: p.topAssister, suffix: 'assist.',  color: '#00b4ff' },
    { emoji: '🌟', label: 'CRAQUE',       data: p.craque,      suffix: 'prêmios',  color: gold },
  ];

  let y = 600;
  rows.forEach(r => {
    if (!r.data) return;
    // card
    ctx.fillStyle = `${r.color}10`;
    roundRect(ctx, 120, y, W - 240, 130, 18); ctx.fill();
    ctx.strokeStyle = `${r.color}40`; ctx.lineWidth = 2; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '54px Arial'; ctx.fillText(r.emoji, 160, y + 85);
    ctx.fillStyle = r.color; ctx.font = '900 22px Arial';
    ctx.fillText(r.label, 250, y + 52);
    ctx.fillStyle = '#fff'; ctx.font = '900 38px Arial';
    ctx.fillText(r.data.name.toUpperCase().substring(0, 16), 250, y + 95);

    ctx.textAlign = 'right';
    ctx.fillStyle = r.color; ctx.font = '900 56px Arial';
    ctx.fillText(String(r.data.value), W - 165, y + 78);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '700 18px Arial';
    ctx.fillText(r.suffix, W - 165, y + 105);
    ctx.textAlign = 'center';

    y += 158;
  });

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

export async function shareSeasonImage(blob: Blob, caption: string) {
  const file = new File([blob], 'temporada.png', { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], text: caption, title: 'Resumo da Temporada' }); return; } catch {}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'temporada.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
