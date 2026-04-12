'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Trophy, Target, Ban, Hash, TrendingUp, TrendingDown } from 'lucide-react';

const MOCK_STATS = {
    totalGoals: 46,
    totalYellowCards: 3,
    totalRedCards: 1,
    topPlayer: { name: 'Aennson', count: 85, photo_url: null },
    winnerPlayer: { name: 'Aennson', count: 16, photo_url: null },
    loserPlayer: { name: 'Anderson Pinheiro', count: 15, photo_url: null },
};

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<'totals' | 'scorers'>('totals');

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl font-black text-white tracking-tighter">
          Estatísticas <span className="text-primary italic">Globais</span>
        </h1>
        <p className="text-white/40">Desempenho histórico do grupo</p>
      </div>

      <div className="flex border-b border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('totals')}
          className={`flex-1 py-4 font-bold uppercase text-xs tracking-widest transition-all ${
            activeTab === 'totals' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-white/40'
          }`}
        >
          Totais
        </button>
        <button
          onClick={() => setActiveTab('scorers')}
          className={`flex-1 py-4 font-bold uppercase text-xs tracking-widest transition-all ${
            activeTab === 'scorers' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-white/40'
          }`}
        >
          Artilharia
        </button>
      </div>

      {activeTab === 'totals' && (
        <div className="space-y-6">
          {/* Main Counters */}
          <GlassCard className="p-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Target className="text-white/60 mb-2" size={24} />
              <div className="text-4xl font-black text-white">{MOCK_STATS.totalGoals}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Gols</div>
            </div>
            <div className="flex flex-col items-center gap-2 border-x border-white/5">
              <div className="w-4 h-6 bg-yellow-400 rounded-sm mb-2 shadow-lg shadow-yellow-500/20" />
              <div className="text-4xl font-black text-white">{MOCK_STATS.totalYellowCards}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Amarelos</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-6 bg-red-500 rounded-sm mb-2 shadow-lg shadow-red-500/20" />
              <div className="text-4xl font-black text-white">{MOCK_STATS.totalRedCards}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Vermelhos</div>
            </div>
          </GlassCard>

          {/* Ranking Cards */}
          <div className="grid grid-cols-1 gap-4">
             <StatRankingCard 
                title="Jogador que mais jogou" 
                name={MOCK_STATS.topPlayer.name} 
                extra={`${MOCK_STATS.topPlayer.count} Partidas`}
                icon={Hash}
                color="primary"
             />
             <StatRankingCard 
                title="Jogador que mais venceu" 
                name={MOCK_STATS.winnerPlayer.name} 
                extra={`${MOCK_STATS.winnerPlayer.count} Vitórias`}
                icon={TrendingUp}
                color="secondary"
             />
             <StatRankingCard 
                title="Jogador que mais perdeu" 
                name={MOCK_STATS.loserPlayer.name} 
                extra={`${MOCK_STATS.loserPlayer.count} Derrotas`}
                icon={TrendingDown}
                color="warning"
             />
          </div>
        </div>
      )}
    </div>
  );
}

function StatRankingCard({ title, name, extra, icon: Icon, color }: any) {
    const colorClasses: any = {
        primary: 'text-primary bg-primary/10',
        secondary: 'text-emerald-400 bg-emerald-500/10',
        warning: 'text-orange-400 bg-orange-500/10'
    };
    return (
        <GlassCard className="p-6 flex items-center gap-4 hover:border-white/20 transition-all">
            <div className={`w-16 h-16 rounded-full bg-slate-800 border-2 border-white/5 flex items-center justify-center text-white/10 text-xl font-bold overflow-hidden`}>
                {name.charAt(0)}
            </div>
            <div className="flex-1">
                <p className="text-xs text-white/40 mb-1">{title}</p>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-bold text-white">{name}</h4>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5`}>{extra}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                        <Icon size={20} />
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
