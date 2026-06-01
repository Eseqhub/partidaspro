import React from 'react';
import { MonthlyPoint } from '@/infra/repositories/AdminRepository';
import { ActivityChart } from '@/presentation/components/dashboard/ActivityChart';
import { KpiCard, ExportBtn } from './AdminShared';

interface Props {
  stats: {
    groupsCount: number;
    playersCount: number;
    activeMatchesCount: number;
    totalMatchesCount: number;
    totalGoals: number;
  };
  activity: MonthlyPoint[];
  onExportPlayers: () => void;
  onExportClubs: () => void;
  onExportMatches: () => void;
  onExportFinances: () => void;
}

export function AdminOverviewTab({ stats, activity, onExportPlayers, onExportClubs, onExportMatches, onExportFinances }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Clubes"    value={stats.groupsCount}        color="#ccff00" />
        <KpiCard label="Jogadores" value={stats.playersCount}       color="#00b4ff" />
        <KpiCard label="Partidas"  value={stats.totalMatchesCount}  color="#a855f7" />
        <KpiCard label="Ao Vivo"   value={stats.activeMatchesCount} color="#EF4444" sub="em curso" />
        <KpiCard label="Gols"      value={stats.totalGoals}         color="#F97316" />
      </div>

      <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Atividade (últimos 6 meses)</h3>
        </div>
        <ActivityChart data={activity} />
      </div>

      <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Exportar Dados (CSV)</h3>
        <div className="flex flex-wrap gap-2">
          <ExportBtn onClick={onExportPlayers}  label="Jogadores" />
          <ExportBtn onClick={onExportClubs}    label="Clubes" />
          <ExportBtn onClick={onExportMatches}  label="Partidas" />
          <ExportBtn onClick={onExportFinances} label="Financeiro" />
        </div>
      </div>
    </div>
  );
}
