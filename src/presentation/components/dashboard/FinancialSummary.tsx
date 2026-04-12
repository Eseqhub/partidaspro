import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';

interface FinancialSummaryProps {
  isPaidModel: boolean;
  data?: {
    totalRevenue: number;
    totalExpense: number;
    defaultersCount: number;
  };
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ isPaidModel, data }) => {
  if (!isPaidModel) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-6 border-l-4 border-l-primary">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/40 text-xs uppercase font-bold tracking-wider mb-1">Receita Mensal</p>
            <h3 className="text-2xl font-black text-white">R$ {data?.totalRevenue.toFixed(2) || '0,00'}</h3>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <TrendingUp size={20} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 border-l-4 border-l-red-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/40 text-xs uppercase font-bold tracking-wider mb-1">Despesa Mensal</p>
            <h3 className="text-2xl font-black text-white">R$ {data?.totalExpense.toFixed(2) || '0,00'}</h3>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
            <TrendingDown size={20} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 border-l-4 border-l-secondary">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/40 text-xs uppercase font-bold tracking-wider mb-1">Inadimplentes</p>
            <h3 className="text-2xl font-black text-secondary">{data?.defaultersCount || 0}</h3>
          </div>
          <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <AlertCircle size={20} />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
