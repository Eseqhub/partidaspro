'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp, faArrowTrendDown, faWallet,
  faCircleCheck, faHourglassHalf, faUsers,
  faCalendarAlt, faChevronLeft, faChevronRight,
  faSpinner, faQrcode
} from '@fortawesome/free-solid-svg-icons';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { Player } from '@/core/entities/player';
import { PixRateioPanel } from '@/presentation/components/clube/components/PixRateioPanel';
import { PendenciasPanel } from '@/presentation/components/clube/components/PendenciasPanel';

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            <FinanceCard label="Saldo Atual"   value={`R$${Math.abs(summary.balance).toFixed(2)}`}  sub={summary.balance >= 0 ? 'saldo positivo' : 'déficit'}  color={summary.balance >= 0 ? green : red}  icon={faWallet}         />
            <FinanceCard label="Recebido"      value={`R$${summary.received.toFixed(2)}`}            sub="total confirmado"                                        color={green}                                icon={faCircleCheck}    />
            <FinanceCard label="Pendente"      value={`R$${summary.pending.toFixed(2)}`}             sub="aguardando pagamento"                                    color={gold}                                 icon={faHourglassHalf}  />
            <FinanceCard label="Total Despesas" value={`R$${summary.expense.toFixed(2)}`}            sub="total de saídas"                                         color={red}                                  icon={faArrowTrendDown} />
          </div>

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
                    <button 
                      onClick={() => openPaymentModal(p)}
                      style={{ padding: '8px 12px', background: `${gold}15`, border: `1px solid ${gold}30`, color: gold, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all .2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${gold}30`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${gold}15`)}>
                      Receber
                    </button>
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
