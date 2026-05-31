'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { generateRecruitmentLink } from '@/infra/actions/draftActions';
import { Group } from '@/core/entities/group';
import { Player } from '@/core/entities/player';
import { OverviewTab }     from '@/presentation/components/clube/tabs/OverviewTab';
import { ElencoTab }       from '@/presentation/components/clube/tabs/ElencoTab';
import { FinancesTab }     from '@/presentation/components/clube/tabs/FinancesTab';
import { ClubSettingsTab } from '@/presentation/components/clube/tabs/ClubSettingsTab';
import { ClubHeader }      from '@/presentation/components/clube/components/ClubHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie, faUsers, faWallet, faCog,
} from '@fortawesome/free-solid-svg-icons';

type Tab = 'overview' | 'elenco' | 'financeiro' | 'configuracoes';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview',      label: 'Dashboard',    icon: faChartPie },
  { id: 'elenco',        label: 'Elenco',        icon: faUsers    },
  { id: 'financeiro',    label: 'Financeiro',    icon: faWallet   },
  { id: 'configuracoes', label: 'Configurações', icon: faCog      },
];

export default function ClubDashboardPage() {
  const params  = useParams();
  const router  = useRouter();
  const groupId = params.id as string;

  const [group,    setGroup]    = useState<Group | null>(null);
  const [players,  setPlayers]  = useState<Player[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [summary,  setSummary]  = useState({ balance: 0, income: 0, expense: 0, received: 0, pending: 0 });
  const [matches,  setMatches]  = useState<any[]>([]);
  const [editors,  setEditors]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>('overview');
  const [isOwner,  setIsOwner]  = useState(false);

  const [copied,      setCopied]      = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const groupRepo   = new GroupRepository();
  const financeRepo = new FinanceRepository();
  const playerRepo  = new PlayerRepository();

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const [g, p, f, s, m, roles] = await Promise.all([
        groupRepo.findById(groupId),
        playerRepo.findAllByGroupId(groupId),
        financeRepo.findAllByGroupId(groupId),
        financeRepo.getSummary(groupId),
        supabase.from('matches').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).limit(10),
        supabase.from('group_roles').select('*').eq('group_id', groupId),
      ]);

      setGroup(g);
      setPlayers(p ?? []);
      setFinances(f ?? []);
      setSummary(s);
      setMatches(m.data ?? []);
      setEditors(roles.data ?? []);
      setIsOwner(user?.id === g?.owner_id);
    } catch (err) {
      console.error('[ClubDashboard]', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const handleCopyLink = async () => {
    if (!group) return;
    setLinkLoading(true);
    try {
      let hash = group.recruitment_link_hash;
      if (!hash) {
        const result = await generateRecruitmentLink(groupId);
        if (!result.success || !result.hash) throw new Error(result.error);
        hash = result.hash!;
        setGroup(prev => prev ? { ...prev, recruitment_link_hash: hash! } : prev);
      }
      await navigator.clipboard.writeText(`${window.location.origin}/${group.slug}/register?h=${hash}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { alert('Erro ao gerar link.'); }
    finally { setLinkLoading(false); }
  };

  const handleSaveGroup = async (updates: Partial<Group>) => {
    if (!group) return;
    const updated = await groupRepo.update(groupId, updates);
    setGroup(updated);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">CARREGANDO CLUBE...</p>
      </div>
    </div>
  );

  if (!group) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-red-400 font-black uppercase">CLUBE NÃO ENCONTRADO</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      {/* Glows de fundo */}
      <div className="fixed top-0 left-0 w-[700px] h-[700px] bg-primary/[0.025] rounded-full blur-[220px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.025] rounded-full blur-[200px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-amber-600/[0.015] rounded-full blur-[200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">

        {/* Header do clube */}
        <ClubHeader
          group={group}
          players={players}
          summary={summary}
          isOwner={isOwner}
          copied={copied}
          linkLoading={linkLoading}
          onCopyLink={handleCopyLink}
          onNavigate={router.push}
        />

        {/* Tabs de navegação */}
        <div className="flex gap-1 mt-8 mb-8 border-b border-white/5 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white/30 hover:text-white/60'
              }`}
            >
              <FontAwesomeIcon icon={t.icon} className="text-[9px]" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        {tab === 'overview'      && <OverviewTab      group={group} players={players} finances={finances} summary={summary} matches={matches} onCopyLink={handleCopyLink} onNavigate={router.push} />}
        {tab === 'elenco'        && <ElencoTab        players={players} groupId={groupId} onNavigate={router.push} onRefresh={load} />}
        {tab === 'financeiro'    && <FinancesTab      finances={finances} summary={summary} groupId={groupId} onRefresh={load} />}
        {tab === 'configuracoes' && <ClubSettingsTab  group={group} editors={editors} isOwner={isOwner} groupId={groupId} groupRepo={groupRepo} supabase={supabase} onSave={handleSaveGroup} />}

        <p className="text-center mt-16 text-[9px] text-white/10 font-bold uppercase tracking-[0.5em]">
          PARTIDAS PRO © 2026 — {group.name}
        </p>
      </div>
    </div>
  );
}
