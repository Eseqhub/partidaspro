'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';

const MOCK_FINANCE = {
    balance: 25.50,
    income: 76.50,
    expense: 200.00,
    received: 25.50,
    paid: 0.00,
    transactions: [
        { id: '1', title: 'Mensalidade', description: 'Sem descrição', player: 'José Neto', amount: 25.50, status: 'Pago', type: 'Receita', date: '01/01/2026' },
        { id: '2', title: 'Mensalidade', description: 'Sem descrição', player: 'Aennson', amount: 25.50, status: 'Pendente', type: 'Receita', date: '01/01/2026' },
        { id: '3', title: 'Ajuda de custo', description: 'Sem descrição', amount: 25.50, status: 'Pendente', type: 'Receita', date: '09/01/2026' },
        { id: '4', title: 'Aluguel do campo', description: 'Sem descrição', amount: -200.00, status: 'Pendente', type: 'Despesa', date: '21/01/2026' },
    ]
};

export default function FinancePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Resumo <span className="text-secondary italic">Financeiro</span>
          </h1>
          <p className="text-white/40">Controle de caixa e mensalidades</p>
        </div>
        <Button className="gap-2 bg-secondary hover:bg-secondary/80">
          <Plus size={20} /> Novo Lançamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <SummaryCard title="Saldo em Caixa" amount={MOCK_FINANCE.balance} icon={Wallet} color="secondary" />
        <SummaryCard title="Receita (Mês)" amount={MOCK_FINANCE.income} icon={TrendingUp} color="secondary" />
        <SummaryCard title="Despesa (Mês)" amount={MOCK_FINANCE.expense * -1} icon={TrendingDown} color="warning" />
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white tracking-tight">Lançamentos Recentes</h2>
        <div className="flex gap-2">
             <span className="text-[10px] font-black uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40">Janeiro 2026</span>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_FINANCE.transactions.map(t => (
          <TransactionLine key={t.id} transaction={t} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color }: any) {
    const isPositive = amount >= 0;
    return (
        <GlassCard className="p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <Icon size={64} />
            </div>
            <p className="text-xs text-white/40 mb-2 uppercase tracking-widest font-bold">{title}</p>
            <div className={`text-3xl font-black ${isPositive ? 'text-emerald-400' : 'text-orange-500'}`}>
                R$ {Math.abs(amount).toFixed(2).replace('.', ',')}
            </div>
            <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${isPositive ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`} />
                ))}
            </div>
        </GlassCard>
    );
}

function TransactionLine({ transaction: t }: any) {
    const isIncome = t.type === 'Receita';
    return (
        <GlassCard className="p-5 flex items-center justify-between hover:border-white/10 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`w-1 h-12 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                <div>
                    <h4 className="font-bold text-white tracking-tight">{t.title}</h4>
                    <p className="text-xs text-white/30">{t.date} • {t.player || 'Grupo'}</p>
                </div>
            </div>
            <div className="text-right">
                <div className={`font-black ${isIncome ? 'text-emerald-400' : 'text-orange-500'}`}>
                    {isIncome ? '' : '-'} R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
                </div>
                <div className="flex justify-end gap-1 mt-1">
                    {t.status === 'Pago' ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-secondary">
                            <CheckCircle2 size={10} /> Pago
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-white/20">
                            <Clock size={10} /> Pendente
                        </span>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
