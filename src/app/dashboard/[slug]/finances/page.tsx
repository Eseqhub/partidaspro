'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Transaction, FinanceSummary } from '@/core/entities/finance';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { useParams, useRouter } from 'next/navigation';
import { ManageTransactionModal } from '@/presentation/components/dashboard/ManageTransactionModal';

export default function FinancePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({ balance: 0, income: 0, expense: 0, received: 0, pending: 0 });
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const financeRepo = new FinanceRepository();
  const groupRepo = new GroupRepository();

  const loadData = async (id: string) => {
    setLoading(true);
    try {
      const [tData, sData] = await Promise.all([
        financeRepo.findAllByGroupId(id),
        financeRepo.getSummary(id)
      ]);
      setTransactions(tData);
      setSummary(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const group = await groupRepo.findBySlug(slug);
      if (group) {
        setGroupId(group.id);
        loadData(group.id);
      } else {
        router.push('/dashboard');
      }
    }
    init();
  }, [slug]);

  const handleSave = async (data: any) => {
    if (selectedTransaction) {
      await financeRepo.update(selectedTransaction.id, data);
    } else {
      await financeRepo.create(data);
    }
    if (groupId) await loadData(groupId);
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      await financeRepo.delete(id);
      if (groupId) await loadData(groupId);
    }
  };

  const toggleStatus = async (transaction: Transaction) => {
    const newStatus = transaction.status === 'Pago' ? 'Pendente' : 'Pago';
    await financeRepo.update(transaction.id, { status: newStatus });
    if (groupId) await loadData(groupId);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Resumo <span className="text-secondary italic">Financeiro</span>
          </h1>
          <p className="text-white/40">Controle de caixa e mensalidades</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedTransaction(null);
            setIsModalOpen(true);
          }}
          className="gap-2 bg-secondary hover:bg-secondary/80 text-black font-black uppercase tracking-widest text-xs"
        >
          <Plus size={20} /> Novo Lançamento
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Acessando Caixa...</p>
        </div>
      ) : (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <SummaryCard title="Saldo em Caixa" amount={summary.balance} icon={Wallet} color="secondary" />
                <SummaryCard title="Receita (Mês)" amount={summary.income} icon={TrendingUp} color="secondary" />
                <SummaryCard title="Despesa (Mês)" amount={summary.expense * -1} icon={TrendingDown} color="warning" />
            </div>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">Lançamentos Recentes</h2>
                <div className="flex gap-2">
                    <span className="text-[10px] font-black uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40">Tempo Real</span>
                </div>
            </div>

            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <GlassCard className="py-12 text-center text-white/20 text-xs font-bold border-dashed">
                        NENHUM LANÇAMENTO ENCONTRADO
                    </GlassCard>
                ) : (
                    transactions.map((t: Transaction) => (
                        <TransactionLine 
                            key={t.id} 
                            transaction={t} 
                            onDelete={handleDelete}
                            onEdit={(t: Transaction) => {
                                setSelectedTransaction(t);
                                setIsModalOpen(true);
                            }}
                            onToggleStatus={toggleStatus}
                        />
                    ))
                )}
            </div>
        </>
      )}

      {groupId && (
        <ManageTransactionModal
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setSelectedTransaction(null);
            }}
            onSave={handleSave}
            groupId={groupId}
            initialData={selectedTransaction}
        />
      )}
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color }: any) {
    const isPositive = amount >= 0;
    return (
        <GlassCard className="p-6 relative overflow-hidden group border-white/5">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon size={48} className={isPositive ? 'text-emerald-400' : 'text-orange-400'} />
            </div>
            <p className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-black">{title}</p>
            <div className={`text-2xl font-black ${isPositive ? 'text-emerald-400' : 'text-orange-500'}`}>
                R$ {Math.abs(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
        </GlassCard>
    );
}

function TransactionLine({ transaction: t, onDelete, onEdit, onToggleStatus }: any) {
    const isIncome = t.type === 'Receita';
    const [showActions, setShowActions] = useState(false);

    return (
        <GlassCard className="p-5 flex items-center justify-between hover:border-white/10 transition-colors group relative">
            <div className="flex items-center gap-4">
                <div className={`w-1 h-12 rounded-full ${isIncome ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`} />
                <div>
                    <h4 className="font-bold text-white tracking-tight uppercase text-sm">{t.category}</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                        {new Date(t.date).toLocaleDateString('pt-BR')} • {t.player?.name || 'GRUPO'}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className={`font-black ${isIncome ? 'text-emerald-400' : 'text-orange-500'}`}>
                        {isIncome ? '' : '-'} R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <button 
                        onClick={() => onToggleStatus(t)}
                        className="flex justify-end gap-1 mt-1 ml-auto"
                    >
                        {t.status === 'Pago' ? (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-secondary">
                                <CheckCircle2 size={10} /> Pago
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-white/30 hover:text-white transition-colors">
                                <Clock size={10} /> Pendente
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onEdit(t)}
                        className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-none text-white/40 hover:text-white transition-all"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        onClick={() => onDelete(t.id)}
                        className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-none text-white/40 hover:text-orange-500 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </GlassCard>
    );
}
