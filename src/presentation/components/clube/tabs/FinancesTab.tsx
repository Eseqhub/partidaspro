'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp, faArrowTrendDown, faWallet,
  faCircleCheck, faHourglassHalf, faUsers,
  faCalendarAlt, faChevronLeft, faChevronRight,
  faSpinner, faQrcode, faCommentDots,
} from '@fortawesome/free-solid-svg-icons';
import { generatePixCode } from '@/core/services/PixService';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { Player } from '@/core/entities/player';
import { PixRateioPanel } from '@/presentation/components/clube/components/PixRateioPanel';
import { PendenciasPanel } from '@/presentation/components/clube/components/PendenciasPanel';
import { CashFlowChart } from '@/presentation/components/clube/components/CashFlowChart';

const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';

interface Props {
  finances: any[];
  summary: { balance: number; income: number; expense: number; received: number; pending: number };
  groupId: string;
  groupName?: string;
  players?: Player[];
  onRefresh: () => void;
}

function FinanceCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: any }) {
  return (
    <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20`, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: 12 }} />
        <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{sub}</p>
    </div>
  );
}

export const FinancesTab: React.FC<Props> = ({ finances, summary, groupId, groupName = 'Pelada', players = [], onRefresh }) => {
  const [subTab, setSubTab] = useState<'geral' | 'mensalistas' | 'cobrancas' | 'pendencias'>('geral');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('50.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState<string>('50.00');
  const [generating, setGenerating] = useState(false);
  const [pixCfg, setPixCfg] = useState<{ pixKey: string; pixName: string }>({ pixKey: '', pixName: groupName });
  const [meta, setMeta] = useState('');

  // Carrega valor mensal salvo + chave PIX (mesma do painel de rateio) + meta da caixinha
  useEffect(() => {
    try {
      const fee = localStorage.getItem(`monthlyFee:${groupId}`);
      if (fee) setMonthlyFee(fee);
      const pix = localStorage.getItem(`pix:${groupId}`);
      if (pix) { const o = JSON.parse(pix); setPixCfg({ pixKey: o.pixKey || '', pixName: o.pixName || groupName }); }
      const m = localStorage.getItem(`meta:${groupId}`);
      if (m) setMeta(m);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const updateMeta = (v: string) => {
    setMeta(v);
    try { localStorage.setItem(`meta:${groupId}`, v); } catch { /* ignore */ }
  };

  // Relatório imprimível (salvar como PDF / compartilhar)
  const gerarRelatorio = () => {
    const fmt = (n: number) => `R$ ${n.toFixed(2)}`;
    const rows = finances.slice(0, 200).map((f: any) => `
      <tr>
        <td>${(f.description ?? f.category ?? '-')}</td>
        <td>${f.player?.name ?? ''}</td>
        <td>${f.date ? new Date(f.date).toLocaleDateString('pt-BR') : ''}</td>
        <td style="text-transform:uppercase">${f.status ?? ''}</td>
        <td style="text-align:right;color:${f.type === 'Receita' ? '#138' : '#b00'}">${f.type === 'Receita' ? '+' : '-'}${fmt(Number(f.amount))}</td>
      </tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório ${groupName}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;max-width:800px;margin:auto}
        h1{font-size:18px;margin:0 0 4px} .sub{color:#666;font-size:12px;margin-bottom:16px}
        .cards{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
        .card{flex:1;min-width:120px;border:1px solid #ddd;border-radius:8px;padding:10px}
        .card .l{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px}
        .card .v{font-size:18px;font-weight:bold}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left}
        th{font-size:10px;text-transform:uppercase;color:#666}
        @media print{button{display:none}}
      </style></head><body>
      <h1>${groupName} — Relatório Financeiro</h1>
      <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      <div class="cards">
        <div class="card"><div class="l">Saldo</div><div class="v">${fmt(summary.balance)}</div></div>
        <div class="card"><div class="l">Recebido</div><div class="v">${fmt(summary.received)}</div></div>
        <div class="card"><div class="l">Pendente</div><div class="v">${fmt(summary.pending)}</div></div>
        <div class="card"><div class="l">Despesas</div><div class="v">${fmt(summary.expense)}</div></div>
      </div>
      <table><thead><tr><th>Descrição</th><th>Atleta</th><th>Data</th><th>Status</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">Sem movimentações</td></tr>'}</tbody></table>
      <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;font-weight:bold;cursor:pointer">Salvar como PDF / Imprimir</button>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const updateMonthlyFee = (v: string) => {
    setMonthlyFee(v);
    try { localStorage.setItem(`monthlyFee:${groupId}`, v); } catch { /* ignore */ }
  };

  const sanitizePhone = (raw?: string) => {
    if (!raw) return '';
    let d = raw.replace(/\D/g, '');
    if (d.length >= 10 && d.length <= 11) d = '55' + d;
    return d;
  };

  const cobrarMensalistaWhats = (p: Player) => {
    const fee = parseFloat(monthlyFee.replace(',', '.'));
    const phone = sanitizePhone(p.phone);
    const first = p.name.split(' ')[0];
    const linhas = [`💳 *Mensalidade ${monthName}*`, `Olá ${first}! Sua mensalidade é *R$${(fee || 0).toFixed(2)}*.`];
    if (pixCfg.pixKey && fee > 0) {
      const code = generatePixCode({ pixKey: pixCfg.pixKey.trim(), merchantName: pixCfg.pixName || groupName, amount: Number(fee.toFixed(2)), description: `Mensalidade ${monthName}` });
      linhas.push('', 'PIX copia e cola:', code);
    }
    const text = encodeURIComponent(linhas.join('\n'));
    window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, '_blank');
  };

  const transactions = finances.slice(0, 50);
  const mensalistas = players.filter(p => p.is_mensalista && p.status === 'Ativo');

  // Month navigation
  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const financeRepo = new FinanceRepository();

  const handleRegisterPayment = async () => {
    if (!selectedPlayer || !paymentAmount) return;
    setIsSubmitting(true);
    try {
      const amount = parseFloat(paymentAmount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) throw new Error('Valor inválido');

      await financeRepo.create({
        group_id: groupId,
        player_id: selectedPlayer.id,
        type: 'Receita',
        category: 'Mensalidade',
        description: `Mensalidade ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        amount: amount,
        status: 'Pago',
        date: new Date().toISOString()
      });

      setPaymentModalOpen(false);
      setSelectedPlayer(null);
      onRefresh(); // Reload finances via page.tsx
    } catch (err) {
      alert('Erro ao registrar pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (player: Player) => {
    setSelectedPlayer(player);
    setPaymentModalOpen(true);
  };

  // Gera cobrança de mensalidade (pendente) para todos os mensalistas do mês de uma vez
  const monthDesc = `Mensalidade ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
  const handleGenerateMonthly = async () => {
    const amount = parseFloat(monthlyFee.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) { alert('Informe um valor válido.'); return; }
    const pending = mensalistas.filter(p => !finances.some((f: any) => f.player_id === p.id && f.description === monthDesc));
    if (pending.length === 0) { alert('Todos os mensalistas já têm cobrança neste mês.'); return; }
    if (!confirm(`Gerar cobrança de R$${amount.toFixed(2)} para ${pending.length} mensalista(s) em ${monthName}?`)) return;
    setGenerating(true);
    try {
      for (const p of pending) {
        await financeRepo.create({
          group_id: groupId, player_id: p.id, type: 'Receita', category: 'Mensalidade',
          description: monthDesc, amount, status: 'Pendente',
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        });
      }
      onRefresh();
    } catch (e: any) { alert('Erro ao gerar cobranças: ' + (e?.message ?? '')); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Sub-Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        <button onClick={() => setSubTab('geral')}
          style={{ padding: '8px 16px', background: subTab === 'geral' ? `${blue}20` : 'transparent', border: 'none', borderRadius: 4, color: subTab === 'geral' ? blue : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all .2s' }}>
          <FontAwesomeIcon icon={faWallet} style={{ marginRight: 6 }} /> Entradas & Saídas
        </button>
        <button onClick={() => setSubTab('mensalistas')}
          style={{ padding: '8px 16px', background: subTab === 'mensalistas' ? `${gold}20` : 'transparent', border: 'none', borderRadius: 4, color: subTab === 'mensalistas' ? gold : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all .2s' }}>
          <FontAwesomeIcon icon={faUsers} style={{ marginRight: 6 }} /> Mensalistas
        </button>
        <button onClick={() => setSubTab('cobrancas')}
          style={{ padding: '8px 16px', background: subTab === 'cobrancas' ? `${green}20` : 'transparent', border: 'none', borderRadius: 4, color: subTab === 'cobrancas' ? green : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all .2s' }}>
          <FontAwesomeIcon icon={faQrcode} style={{ marginRight: 6 }} /> PIX & Rateio
        </button>
        <button onClick={() => setSubTab('pendencias')}
          style={{ padding: '8px 16px', background: subTab === 'pendencias' ? `${red}20` : 'transparent', border: 'none', borderRadius: 4, color: subTab === 'pendencias' ? red : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all .2s' }}>
          <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: 6 }} /> Pendências
        </button>
      </div>

      {subTab === 'cobrancas' && (
        <PixRateioPanel groupId={groupId} groupName={groupName} players={players} onRefresh={onRefresh} />
      )}

      {subTab === 'pendencias' && (
        <PendenciasPanel finances={finances} players={players} groupId={groupId} groupName={groupName} onRefresh={onRefresh} />
      )}

      {subTab === 'geral' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <FinanceCard label="Saldo Atual"   value={`R$${Math.abs(summary.balance).toFixed(2)}`}  sub={summary.balance >= 0 ? 'saldo positivo' : 'déficit'}  color={summary.balance >= 0 ? green : red}  icon={faWallet}         />
            <FinanceCard label="Recebido"      value={`R$${summary.received.toFixed(2)}`}            sub="total confirmado"                                        color={green}                                icon={faCircleCheck}    />
            <FinanceCard label="Pendente"      value={`R$${summary.pending.toFixed(2)}`}             sub="aguardando pagamento"                                    color={gold}                                 icon={faHourglassHalf}  />
            <FinanceCard label="Total Despesas" value={`R$${summary.expense.toFixed(2)}`}            sub="total de saídas"                                         color={red}                                  icon={faArrowTrendDown} />
          </div>

          <CashFlowChart finances={finances} />


          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: green }}>
                Receitas R${summary.income.toFixed(2)}
              </span>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: red }}>
                Despesas R${summary.expense.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
              {summary.income + summary.expense > 0 && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${(summary.income / (summary.income + summary.expense)) * 100}%`,
                  background: `linear-gradient(90deg,${green},${blue})`, transition: 'width .8s' }} />
              )}
            </div>
          </div>

          <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faWallet} style={{ color: blue, fontSize: 9 }} />
              Todas as Movimentações ({transactions.length})
            </h2>

            {transactions.length === 0
              ? <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Sem movimentações registradas</p>
              : <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 56px 76px', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
                    {['Descrição', 'Data', 'Valor'].map((col, i) => (
                      <span key={col} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textAlign: i === 2 ? 'right' : 'left' }}>{col}</span>
                    ))}
                  </div>
                  {transactions.map((f: any) => {
                    const isReceita = f.type === 'Receita';
                    const amount    = isReceita ? f.amount : -f.amount;
                    return (
                      <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 56px 76px', gap: 8,
                        padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isReceita ? `${green}12` : `${red}10` }}>
                            <FontAwesomeIcon icon={isReceita ? faArrowTrendUp : faArrowTrendDown}
                              style={{ fontSize: 9, color: isReceita ? green : red }} />
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {f.description ?? f.category ?? 'Movimentação'}
                            </span>
                            <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: isReceita ? `${green}80` : `${red}80`, letterSpacing: '0.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {f.type}{f.player?.name ? ` · ${f.player.name}` : ''}{f.status ? ` · ${f.status}` : ''}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(f.date ?? f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace', color: amount > 0 ? green : red, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {amount > 0 ? '+' : ''}R${Math.abs(amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </>
      )}

      {subTab === 'mensalistas' && (
        <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Seletor de Mês */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ color: gold, fontSize: 14 }} />
              Pagamentos Mês Base
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24 }}>
              <button onClick={goToPreviousMonth} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <span style={{ fontSize: 10, fontWeight: 900, color: gold, minWidth: 120, textAlign: 'center', letterSpacing: '0.1em' }}>{monthName}</span>
              <button onClick={goToNextMonth} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>

          {/* Geração automática de cobranças */}
          {mensalistas.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px', background: `${gold}08`, border: `1px solid ${gold}25`, borderRadius: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>Valor mensal</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: gold }}>R$</span>
                <input value={monthlyFee} onChange={e => updateMonthlyFee(e.target.value)} inputMode="decimal"
                  style={{ width: 70, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 900, padding: '6px 8px', borderRadius: 6, outline: 'none' }} />
              </div>
              <button onClick={handleGenerateMonthly} disabled={generating}
                style={{ marginLeft: 'auto', padding: '8px 14px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: `linear-gradient(135deg,${gold},#f5d060)`, color: '#000', border: 'none', borderRadius: 7, cursor: generating ? 'wait' : 'pointer' }}>
                {generating ? 'Gerando...' : `Gerar cobranças do mês (${mensalistas.length})`}
              </button>
            </div>
          )}

          {/* Lista de Mensalistas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {mensalistas.map(p => {
              // Verifica pagamentos no mês selecionado
              const monthlyPayments = finances.filter(f => 
                f.player_id === p.id && 
                (f.category === 'Mensalidade' || f.description?.toLowerCase().includes('mensalidade')) &&
                new Date(f.date || f.created_at).getMonth() === currentDate.getMonth() &&
                new Date(f.date || f.created_at).getFullYear() === currentDate.getFullYear() &&
                f.status === 'Pago'
              );
              
              const totalPaid = monthlyPayments.reduce((acc, f) => acc + Number(f.amount), 0);
              const isPaid = totalPaid > 0;

              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.3)', border: `1px solid ${isPaid ? green : 'rgba(255,255,255,0.05)'}`, borderLeft: `3px solid ${isPaid ? green : gold}`, transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                      {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{p.name[0]}</div>}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff', letterSpacing: '-0.01em' }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: isPaid ? green : gold, background: isPaid ? `${green}12` : `${gold}12`, padding: '2px 6px', letterSpacing: '0.1em' }}>
                          {isPaid ? 'PAGO' : 'PENDENTE'}
                        </span>
                        {isPaid && <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>R${totalPaid.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                  
                  {!isPaid && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => cobrarMensalistaWhats(p)}
                        title="Cobrar no WhatsApp"
                        style={{ padding: '8px 10px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366', fontSize: 11, cursor: 'pointer', borderRadius: 4 }}>
                        <FontAwesomeIcon icon={faCommentDots} />
                      </button>
                      <button
                        onClick={() => openPaymentModal(p)}
                        style={{ padding: '8px 12px', background: `${gold}15`, border: `1px solid ${gold}30`, color: gold, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all .2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${gold}30`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${gold}15`)}>
                        Receber
                      </button>
                    </div>
                  )}
                  {isPaid && (
                    <div style={{ padding: '8px', color: green }}>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 16 }} />
                    </div>
                  )}
                </div>
              );
            })}
            
            {mensalistas.length === 0 && (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Nenhum atleta marcado como mensalista no elenco.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pagamento Rápido */}
      {paymentModalOpen && selectedPlayer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#020810', border: `1px solid ${gold}30`, padding: 30, boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, textAlign: 'center' }}>
              Confirmar Recebimento
            </h3>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>ATLETA</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: gold, textTransform: 'uppercase' }}>{selectedPlayer.name}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                Mensalidade de {monthName}
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>Valor Recebido (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', outline: 'none', textAlign: 'center' }}
                placeholder="0.00"
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                onClick={handleRegisterPayment}
                disabled={isSubmitting}
                style={{ flex: 2, padding: '14px', background: gold, border: 'none', color: '#000', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'CONFIRMAR PAGO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
