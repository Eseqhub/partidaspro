'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { JoinRequestRepository, JoinRequest } from '@/infra/repositories/JoinRequestRepository';
import { JoinRequestsPanel } from '@/presentation/components/clube/components/JoinRequestsPanel';
import { generateRecruitmentLink } from '@/infra/actions/draftActions';
import { Group } from '@/core/entities/group';
import { Player } from '@/core/entities/player';
import { OverviewTab }     from '@/presentation/components/clube/tabs/OverviewTab';
import { ElencoTab }       from '@/presentation/components/clube/tabs/ElencoTab';
import { FinancesTab }     from '@/presentation/components/clube/tabs/FinancesTab';
import { ClubSettingsTab } from '@/presentation/components/clube/tabs/ClubSettingsTab';
import { ClubHeader }      from '@/presentation/components/clube/components/ClubHeader';
import { NovaPartidaModal } from '@/presentation/components/clube/components/NovaPartidaModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie, faUsers, faWallet, faCog,
  faFutbol, faShieldHalved, faChartSimple,
} from '@fortawesome/free-solid-svg-icons';

type Tab = 'overview' | 'elenco' | 'financeiro' | 'configuracoes';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview',      label: 'Dashboard',    icon: faChartPie  },
  { id: 'elenco',        label: 'Elenco',        icon: faUsers     },
  { id: 'financeiro',    label: 'Financeiro',    icon: faWallet    },
  { id: 'configuracoes', label: 'Configurações', icon: faCog       },
];

// Links rápidos para sub-módulos operacionais
const QUICK_LINKS = (slug: string) => [
  { label: 'Partidas',    icon: faFutbol,      href: `/dashboard/${slug}/matches`,  color: '#ccff00' },
  { label: 'Atletas',     icon: faUsers,       href: `/dashboard/${slug}/players`,  color: '#00b4ff' },
  { label: 'Financeiro',  icon: faWallet,      href: `/dashboard/${slug}/finances`, color: '#22c55e' },
  { label: 'Estatísticas',icon: faChartSimple, href: `/dashboard/${slug}/stats`,    color: '#d4a017' },
];

export default function DashboardSlugPage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = params.slug as string;

  const [group,    setGroup]    = useState<Group | null>(null);
  const [players,  setPlayers]  = useState<Player[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [summary,  setSummary]  = useState({ balance: 0, income: 0, expense: 0, received: 0, pending: 0 });
  const [matches,  setMatches]  = useState<any[]>([]);
  const [editors,  setEditors]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>('overview');
  const [isOwner,  setIsOwner]  = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [copied,      setCopied]      = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [novaPartidaOpen, setNovaPartidaOpen] = useState(false);

  const groupRepo   = new GroupRepository();
  const financeRepo = new FinanceRepository();
  const playerRepo  = new PlayerRepository();
  const joinRepo    = new JoinRequestRepository();

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const g = await groupRepo.findBySlug(slug);
      if (!g) { setLoading(false); return; }

      const [p, f, s, m, roles] = await Promise.all([
        playerRepo.findAllByGroupId(g.id),
        financeRepo.findAllByGroupId(g.id),
        financeRepo.getSummary(g.id),
        supabase.from('matches').select('*').eq('group_id', g.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('group_roles').select('*').eq('group_id', g.id),
      ]);

      setGroup(g);
      setPlayers(p ?? []);
      setFinances(f ?? []);
      setSummary(s);
      setMatches(m.data ?? []);
      setEditors(roles.data ?? []);
      const owner = user?.id === g.owner_id;
      setIsOwner(owner);

      // Quem pode gerenciar solicitações: dono OU editor delegado
      const editor = owner ? true : !!(user?.email && await groupRepo.isEditor(g.id, user.email).catch(() => false));
      setCanManage(owner || editor);
      if (owner || editor) {
        const reqs = await joinRepo.findPendingByGroup(g.id).catch(() => []);
        setPendingRequests(reqs);
      }
    } catch (err) {
      console.error('[DashboardSlug]', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  // Realtime: atualiza solicitações de entrada quando chegam/saem
  useEffect(() => {
    if (!group || !canManage) return;
    const sub = joinRepo.subscribeToGroup(group.id, async () => {
      const reqs = await joinRepo.findPendingByGroup(group.id).catch(() => []);
      setPendingRequests(reqs);
    });
    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, canManage]);

  const handleCopyLink = async () => {
    if (!group) return;
    setLinkLoading(true);
    try {
      let hash = group.recruitment_link_hash;
      if (!hash) {
        const result = await generateRecruitmentLink(group.id);
        if (!result.success || !result.hash) throw new Error(result.error);
        hash = result.hash!;
        setGroup(prev => prev ? { ...prev, recruitment_link_hash: hash! } : prev);
      }
      await navigator.clipboard.writeText(`${window.location.origin}/${group.slug}/join?h=${hash}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { alert('Erro ao gerar link.'); }
    finally { setLinkLoading(false); }
  };

  const handleSaveGroup = async (updates: Partial<Group>) => {
    if (!group) return;
    const updated = await groupRepo.update(group.id, updates);
    setGroup(updated);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">CARREGANDO CLUBE...</p>
      </div>
    </div>
  );

  if (!group) return (
    <div className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon icon={faShieldHalved} className="text-white/10 text-5xl mb-4" />
        <p className="text-red-400 font-black uppercase">CLUBE NÃO ENCONTRADO</p>
        <p className="text-white/30 text-xs mt-2">Slug: <span className="font-mono">{slug}</span></p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      {/* Glows */}
      <div className="fixed top-0 left-0 w-[700px] h-[700px] bg-primary/[0.025] rounded-full blur-[220px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.025] rounded-full blur-[200px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <ClubHeader
          group={group} players={players} summary={summary} isOwner={isOwner}
          copied={copied} linkLoading={linkLoading}
          onCopyLink={handleCopyLink} onNavigate={router.push}
        />

        {/* Botão Nova Partida + links rápidos */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setNovaPartidaOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px',
              background: 'linear-gradient(135deg,#ccff00,#aadd00)',
              color: '#000', fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '0.2em', border: 'none', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 0 20px rgba(204,255,0,0.2)' }}>
            <FontAwesomeIcon icon={faFutbol} />
            NOVA PARTIDA
          </button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {QUICK_LINKS(slug).map(({ label, icon, href, color }) => (
              <button key={href} onClick={() => router.push(href)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}18`,
                  color: 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
                  transition: 'all .2s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}>
                <FontAwesomeIcon icon={icon} style={{ color }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Solicitações de entrada pendentes (dono/editor) */}
        {canManage && pendingRequests.length > 0 && (
          <div className="mt-8">
            <JoinRequestsPanel requests={pendingRequests} onChanged={load} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-8 mb-8 border-b border-white/5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-white/30 hover:text-white/60'
              }`}>
              <FontAwesomeIcon icon={t.icon} className="text-[9px]" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {tab === 'overview'      && <OverviewTab      group={group} players={players} finances={finances} summary={summary} matches={matches} onCopyLink={handleCopyLink} onNavigate={router.push} />}
        {tab === 'elenco'        && <ElencoTab        players={players} groupId={group.id} onNavigate={router.push} onRefresh={load} />}
        {tab === 'financeiro'    && <FinancesTab      finances={finances} summary={summary} groupId={group.id} groupName={group.name} players={players} onRefresh={load} />}
        {tab === 'configuracoes' && <ClubSettingsTab  group={group} editors={editors} isOwner={isOwner} groupId={group.id} groupRepo={groupRepo} supabase={supabase} onSave={handleSaveGroup} />}

        <p className="text-center mt-16 text-[9px] text-white/10 font-bold uppercase tracking-[0.5em]">
          PARTIDAS PRO © 2026 — {group.name}
        </p>
      </div>

      {/* Modal Nova Partida */}
      <NovaPartidaModal
        isOpen={novaPartidaOpen}
        groupId={group.id}
        groupSlug={slug}
        onClose={() => setNovaPartidaOpen(false)}
        onSuccess={(matchId) => {
          setNovaPartidaOpen(false);
          router.push(`/dashboard/${slug}/matches`);
        }}
      />
    </div>
  );
}
