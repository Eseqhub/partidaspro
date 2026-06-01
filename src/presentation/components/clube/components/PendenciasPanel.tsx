'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCircleCheck, faMoneyBillWave, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { generatePixCode } from '@/core/services/PixService';
import { Player } from '@/core/entities/player';

interface Props {
  finances: any[];
  players: Player[];
  groupId: string;
  groupName: string;
  onRefresh: () => void;
}

const green = '#22c55e';
const gold  = '#d4a017';

export const PendenciasPanel: React.FC<Props> = ({ finances, players, groupId, groupName, onRefresh }) => {
  const financeRepo = new FinanceRepository();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const playerById = new Map(players.map(p => [p.id, p]));

  // Pendências por jogador (Receita pendente)
  const pendingByPlayer = new Map<string, { total: number; items: any[] }>();
  finances.forEach(f => {
    if (f.type === 'Receita' && f.status === 'Pendente' && f.player_id) {
      if (!pendingByPlayer.has(f.player_id)) pendingByPlayer.set(f.player_id, { total: 0, items: [] });
      const e = pendingByPlayer.get(f.player_id)!;
      e.total += Number(f.amount); e.items.push(f);
    }
  });

  const ranked = Array.from(pendingByPlayer.entries())
    .map(([pid, d]) => ({ player: playerById.get(pid), pid, ...d }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalPendente = ranked.reduce((s, r) => s + r.total, 0);

  const cobrar = (name: string, amount: number, phone?: string) => {
    let pixCode = '';
    try {
      const saved = localStorage.getItem(`pix:${groupId}`);
      if (saved) {
        const o = JSON.parse(saved);
        if (o.pixKey) pixCode = generatePixCode({ pixKey: o.pixKey, merchantName: o.pixName || groupName, amount, description: 'Pelada' });
      }
    } catch {}

    const lines = [
      `Olá ${name.split(' ')[0]}! 👋`, '',
      `Passando pra lembrar da sua pendência na *${groupName}*:`,
      `💰 *R$ ${amount.toFixed(2)}*`,
    ];
    if (pixCode) { lines.push('', 'PIX copia e cola:', pixCode); }
    lines.push('', '_Partidas Pro_ ⚽');
    const text = encodeURIComponent(lines.join('\n'));

    const digits = (phone ?? '').replace(/\D/g, '');
    const target = digits.length >= 10 ? `https://wa.me/55${digits.slice(-11)}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(target, '_blank');
  };

  const marcarPago = async (id: string) => {
    setBusy(id);
    try { await financeRepo.update(id, { status: 'Pago' } as any); onRefresh(); }
    catch (e: any) { alert('Erro: ' + e.message); }
    finally { setBusy(null); }
  };

  if (ranked.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <FontAwesomeIcon icon={faCircleCheck} style={{ color: green, fontSize: 36, marginBottom: 12 }} />
        <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>Nenhuma pendência 🎉</p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Está todo mundo em dia.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Total */}
      <div style={{ padding: '14px 16px', background: `${gold}0c`, border: `1px solid ${gold}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: gold }} />
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>
            {ranked.length} {ranked.length === 1 ? 'devedor' : 'devedores'}
          </span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 900, color: gold }}>R${totalPendente.toFixed(2)}</span>
      </div>

      {/* Lista */}
      {ranked.map((r, i) => {
        const name = r.player?.name ?? 'Jogador';
        const isOpen = expanded === r.pid;
        const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div key={r.pid} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                {r.player?.photo_url ? <img src={r.player.photo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{initials}</span>}
              </div>
              <button onClick={() => setExpanded(isOpen ? null : r.pid)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{r.items.length} {r.items.length === 1 ? 'lançamento' : 'lançamentos'} · toque p/ extrato</p>
              </button>
              <span style={{ fontSize: 15, fontWeight: 900, color: gold, flexShrink: 0 }}>R${r.total.toFixed(2)}</span>
              <button onClick={() => cobrar(name, r.total, r.player?.phone)}
                style={{ padding: '6px 10px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', borderRadius: 6, cursor: 'pointer', flexShrink: 0, letterSpacing: '0.05em' }}>
                <FontAwesomeIcon icon={faWhatsapp} style={{ marginRight: 4 }} />Cobrar
              </button>
              <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
            </div>

            {/* Extrato */}
            {isOpen && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.25)' }}>
                {r.items.map((f: any) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description ?? f.category}</p>
                      <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{f.date ? new Date(f.date).toLocaleDateString('pt-BR') : ''} · {f.category}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, fontFamily: 'monospace', color: gold }}>R${Number(f.amount).toFixed(2)}</span>
                    <button onClick={() => marcarPago(f.id)} disabled={busy === f.id}
                      style={{ padding: '4px 8px', fontSize: 7, fontWeight: 900, textTransform: 'uppercase', background: `${green}14`, border: `1px solid ${green}40`, color: green, borderRadius: 5, cursor: 'pointer', flexShrink: 0 }}>
                      <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: 3 }} />{busy === f.id ? '...' : 'Pago'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
