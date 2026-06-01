'use client';

import React from 'react';

interface Props {
  finances: any[];
  monthsBack?: number;
}

const GREEN = '#22c55e';
const RED   = '#ef4444';

/**
 * Fluxo de caixa do clube — entradas (recebidas) vs saídas por mês.
 */
export const CashFlowChart: React.FC<Props> = ({ finances, monthsBack = 6 }) => {
  const now = new Date();
  const buckets: { label: string; income: number; expense: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
      income: 0, expense: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    return [`${d.getFullYear()}-${d.getMonth()}`, i];
  }));

  finances.forEach((f: any) => {
    const raw = f.date ?? f.created_at;
    if (!raw) return;
    const d = new Date(raw);
    const k = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (k === undefined) return;
    const amount = Number(f.amount) || 0;
    if (f.type === 'Receita') { if (f.status === 'Pago') buckets[k].income += amount; }
    else buckets[k].expense += Math.abs(amount);
  });

  const max = Math.max(1, ...buckets.flatMap(b => [b.income, b.expense]));
  const totalIn = buckets.reduce((s, b) => s + b.income, 0);
  const totalOut = buckets.reduce((s, b) => s + b.expense, 0);
  const net = totalIn - totalOut;

  const W = 600, H = 200, padX = 36, padY = 16, padBottom = 26;
  const plotW = W - padX * 2, plotH = H - padY - padBottom;
  const groupW = plotW / Math.max(buckets.length, 1);
  const barW = Math.min(22, (groupW - 10) / 2);
  const grid = [0, 0.5, 1].map(t => ({ y: padY + plotH * (1 - t), val: Math.round(max * t) }));

  return (
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 20 }}>
      {/* Header + totais */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>Fluxo de Caixa ({monthsBack}m)</h3>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: GREEN }} /><span style={{ fontSize: 8, fontWeight: 900, color: GREEN }}>+R${totalIn.toFixed(0)}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: RED }} /><span style={{ fontSize: 8, fontWeight: 900, color: RED }}>-R${totalOut.toFixed(0)}</span></div>
          <span style={{ fontSize: 8, fontWeight: 900, color: net >= 0 ? GREEN : RED }}>SALDO R${net.toFixed(0)}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={padX} y1={g.y} x2={W - padX} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={padX - 6} y={g.y + 3} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.25)" fontWeight={700}>{g.val}</text>
          </g>
        ))}
        {buckets.map((b, gi) => {
          const gx = padX + groupW * gi + (groupW - barW * 2 - 4) / 2;
          const ih = (b.income / max) * plotH, eh = (b.expense / max) * plotH;
          return (
            <g key={gi}>
              <rect x={gx} y={padY + plotH - ih} width={barW} height={Math.max(ih, b.income > 0 ? 2 : 0)} rx={2} fill={GREEN} opacity={0.9}><title>Entradas: R${b.income.toFixed(2)}</title></rect>
              <rect x={gx + barW + 4} y={padY + plotH - eh} width={barW} height={Math.max(eh, b.expense > 0 ? 2 : 0)} rx={2} fill={RED} opacity={0.85}><title>Saídas: R${b.expense.toFixed(2)}</title></rect>
              <text x={padX + groupW * gi + groupW / 2} y={H - 8} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.4)" fontWeight={900}>{b.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
