'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/infra/supabase/client';
import { AdminRepository, MonthlyPoint } from '@/infra/repositories/AdminRepository';
import { exportToCsv } from '@/core/services/ExportService';
import { AdminPlayerEditModal } from '@/presentation/components/dashboard/AdminPlayerEditModal';
import { AdminEditModal, EditField } from '@/presentation/components/dashboard/AdminEditModal';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown, faShieldHalved, faFutbol,
  faArrowLeft, faChartPie, faSearch, faTimes,
  faCircle, faUsers, faWallet, faKey, faBell,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

import { AdminOverviewTab } from './_components/AdminOverviewTab';
import { AdminEngagement } from './_components/AdminEngagement';
import { AdminClubsTab } from './_components/AdminClubsTab';
import { AdminMatchesTab } from './_components/AdminMatchesTab';
import { AdminPlayersTab } from './_components/AdminPlayersTab';
import { AdminFinancesTab } from './_components/AdminFinancesTab';
import { AdminAccessTab } from './_components/AdminAccessTab';
import { AdminPushTab } from './_components/AdminPushTab';

const adminRepo = new AdminRepository();

type Tab = 'overview' | 'clubs' | 'matches' | 'players' | 'finances' | 'acessos' | 'avisos';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab, setTab]                   = useState<Tab>('overview');
  const [search, setSearch]             = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  const [stats, setStats]       = useState({ groupsCount: 0, playersCount: 0, activeMatchesCount: 0, totalMatchesCount: 0, totalGoals: 0 });
  const [activity, setActivity] = useState<MonthlyPoint[]>([]);
  const [groups, setGroups]     = useState<any[]>([]);
  const [matches, setMatches]   = useState<any[]>([]);
  const [players, setPlayers]   = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [admins, setAdmins]     = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>({ topClubs: [], topScorers: [], topPresence: [], perDay: [] });
  const [pushStats, setPushStats]   = useState<{ total: number; perGroup: { group_id: string; count: number }[] }>({ total: 0, perGroup: [] });

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupDetails, setGroupDetails]   = useState<Record<string, any>>({});
  const [deleting, setDeleting]           = useState<string | null>(null);
  const [playerGroupBy, setPlayerGroupBy] = useState<'club' | 'flat'>('club');
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [editingGroup, setEditingGroup]   = useState<any | null>(null);
  const [editingMatch, setEditingMatch]   = useState<any | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const groupNameById = new Map(groups.map(g => [g.id, g.name]));
  const playerNameById = new Map(players.map(p => [p.id, p.name]));

  const loadAll = useCallback(async () => {
    const [s, act, g, m, p, f, a, eng, push] = await Promise.all([
      adminRepo.getGlobalStats(),
      adminRepo.getActivitySeries(6),
      adminRepo.getAllGroups(),
      adminRepo.getAllMatches(),
      adminRepo.getAllPlayers(),
      adminRepo.getAllFinances(),
      adminRepo.listAdmins(),
      adminRepo.getEngagement(),
      adminRepo.getPushStats(),
    ]);
    setStats(s); setActivity(act); setGroups(g); setMatches(m); setPlayers(p); setFinances(f); setAdmins(a);
    setEngagement(eng); setPushStats(push);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const ok = await adminRepo.isSuperAdmin(user?.email);
      if (!ok) {
        setAccessDenied(true);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }
      setCurrentEmail(user?.email ?? '');
      await loadAll();
    }
    init();
  }, [router, loadAll]);

  const expandGroup = async (id: string) => {
    if (expandedGroup === id) { setExpandedGroup(null); return; }
    setExpandedGroup(id);
    if (!groupDetails[id]) {
      const details = await adminRepo.getGroupDetails(id);
      setGroupDetails(prev => ({ ...prev, [id]: details }));
    }
  };

  const handleDelete = async (type: 'group' | 'match' | 'player', id: string, label: string) => {
    if (!confirm(`Confirma exclusão de "${label}"?\n\nEssa ação não pode ser desfeita.`)) return;
    setDeleting(id);
    try {
      if (type === 'group')  await adminRepo.deleteGroup(id);
      if (type === 'match')  await adminRepo.deleteMatch(id);
      if (type === 'player') await adminRepo.deletePlayer(id);
      await loadAll();
    } catch (e: any) { alert(`Erro: ${e.message}`); }
    finally { setDeleting(null); }
  };

  const handleSavePlayer = async (id: string, updates: Record<string, any>) => {
    await adminRepo.updatePlayer(id, updates);
    await loadAll();
  };

  const handleSaveGroup = async (updates: Record<string, any>) => {
    await adminRepo.updateGroup(editingGroup.id, updates);
    await loadAll();
  };

  const handleSaveMatch = async (updates: Record<string, any>) => {
    await adminRepo.updateMatch(editingMatch.id, updates);
    await loadAll();
  };

  const handleFinalizeMatch = async (id: string) => {
    try {
      await adminRepo.updateMatch(id, { status: 'Finalizada', timer_started_at: null });
      await loadAll();
    } catch (e: any) { alert(`Erro ao finalizar: ${e.message}`); }
  };

  const handleFinalizeAll = async () => {
    const open = matches.filter(m => m.status !== 'Finalizada');
    if (!open.length) return;
    if (!confirm(`Finalizar ${open.length} partida(s) em aberto?`)) return;
    try {
      await Promise.all(open.map(m => adminRepo.updateMatch(m.id, { status: 'Finalizada', timer_started_at: null })));
      await loadAll();
    } catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) { alert('E-mail inválido.'); return; }
    try { await adminRepo.addAdmin(email, currentEmail); setNewAdminEmail(''); setAdmins(await adminRepo.listAdmins()); }
    catch (e: any) { alert(`Erro (a tabela super_admins existe?): ${e.message}`); }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Remover acesso admin de ${email}?`)) return;
    try { await adminRepo.removeAdmin(email); setAdmins(await adminRepo.listAdmins()); }
    catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  // ── Exports ─────────────────────────────────────────────────────────────────
  const exportPlayers = () => exportToCsv('jogadores', players.map(p => ({
    nome: p.name, nome_completo: p.full_name, telefone: p.phone, posicoes: p.positions,
    nivel: p.skill_level ?? Math.round((p.rating ?? 3) * 2), status: p.status,
    mensalista: p.is_mensalista ? 'Sim' : 'Não', clube: groupNameById.get(p.group_id) ?? '', cadastro: p.created_at,
  })));
  const exportClubs = () => exportToCsv('clubes', groups.map(g => ({
    nome: g.name, slug: g.slug, esporte: g.sport_type_default, fundacao: g.founded_year, criado: g.created_at,
  })));
  const exportMatches = () => exportToCsv('partidas', matches.map(m => ({
    casa: m.home_team_name, visitante: m.away_team_name, placar: `${m.home_score}-${m.away_score}`,
    status: m.status, modalidade: m.modality, campo: m.field_type, clube: groupNameById.get(m.group_id) ?? '', data: m.date,
  })));
  const exportFinances = () => exportToCsv('financeiro', finances.map(f => ({
    tipo: f.type, categoria: f.category, descricao: f.description, valor: f.amount, status: f.status,
    data: f.date, clube: groupNameById.get(f.group_id) ?? '',
  })));

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const ft = search.toLowerCase();
  const fGroups   = groups.filter(g => g.name?.toLowerCase().includes(ft) || g.slug?.toLowerCase().includes(ft));
  const fMatches  = matches.filter(m => `${m.home_team_name}${m.away_team_name}`.toLowerCase().includes(ft));
  const fPlayers  = players.filter(p => p.name?.toLowerCase().includes(ft) || p.phone?.includes(ft));
  const fFinances = finances.filter(f => `${f.description}${f.category}`.toLowerCase().includes(ft));

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (accessDenied) return (
    <div className="min-h-screen bg-[#020810] flex flex-col items-center justify-center gap-4">
      <FontAwesomeIcon icon={faShieldHalved} className="text-red-500 text-5xl" />
      <p className="text-white font-black uppercase tracking-widest text-sm">Acesso Negado</p>
      <p className="text-white/30 text-[9px] uppercase tracking-widest">Redirecionando...</p>
    </div>
  );
  if (loading) return (
    <div className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-primary text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Carregando plataforma...</p>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: faChartPie },
    { id: 'clubs',    label: 'Clubes',       icon: faShieldHalved, count: groups.length },
    { id: 'matches',  label: 'Partidas',     icon: faFutbol,       count: matches.length },
    { id: 'players',  label: 'Jogadores',    icon: faUsers,        count: players.length },
    { id: 'finances', label: 'Financeiro',   icon: faWallet,       count: finances.length },
    { id: 'avisos',   label: 'Avisos',       icon: faBell,         count: pushStats.total },
    { id: 'acessos',  label: 'Acessos',      icon: faKey,          count: admins.length },
  ];

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg">
                <FontAwesomeIcon icon={faArrowLeft} className="text-white/40 text-xs" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FontAwesomeIcon icon={faCrown} className="text-primary" style={{ fontSize: 10 }} />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Super Admin Console</span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight">PARTIDAS<span className="text-primary italic">.PRO</span></h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 border border-primary/20 bg-primary/5 rounded-lg">
            <FontAwesomeIcon icon={faCircle} className="text-primary animate-pulse" style={{ fontSize: 6 }} />
            <span className="text-[8px] font-black uppercase tracking-widest text-primary">Online</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] p-1 rounded-xl border border-white/5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex-1 whitespace-nowrap ${
                tab === t.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'}`}>
              <FontAwesomeIcon icon={t.icon} />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black ${tab === t.id ? 'bg-black/20' : 'bg-white/10 text-white/30'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {(tab === 'clubs' || tab === 'matches' || tab === 'players' || tab === 'finances') && (
          <div className="relative mb-5">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Buscar ${tab === 'clubs' ? 'clube' : tab === 'matches' ? 'partida' : tab === 'players' ? 'jogador / telefone' : 'lançamento'}...`}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl pl-9 pr-10 py-2.5 text-[10px] font-bold text-white placeholder:text-white/20 uppercase tracking-wider outline-none focus:border-primary/30" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            )}
          </div>
        )}

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <AdminOverviewTab
              stats={stats}
              activity={activity}
              onExportPlayers={exportPlayers}
              onExportClubs={exportClubs}
              onExportMatches={exportMatches}
              onExportFinances={exportFinances}
            />
            <AdminEngagement
              engagement={engagement}
              groupNameById={groupNameById}
              playerNameById={playerNameById}
            />
          </div>
        )}

        {tab === 'avisos' && (
          <AdminPushTab pushStats={pushStats} groupNameById={groupNameById} />
        )}

        {tab === 'clubs' && (
          <AdminClubsTab
            groups={fGroups}
            groupDetails={groupDetails}
            expandedGroup={expandedGroup}
            deleting={deleting}
            onExpand={expandGroup}
            onEdit={setEditingGroup}
            onDelete={(id, name) => handleDelete('group', id, name)}
            onExport={exportClubs}
          />
        )}

        {tab === 'matches' && (
          <AdminMatchesTab
            matches={fMatches}
            groupNameById={groupNameById}
            deleting={deleting}
            onEdit={setEditingMatch}
            onDelete={(id, label) => handleDelete('match', id, label)}
            onFinalize={handleFinalizeMatch}
            onFinalizeAll={handleFinalizeAll}
            onExport={exportMatches}
          />
        )}

        {tab === 'players' && (
          <AdminPlayersTab
            players={fPlayers}
            groupNameById={groupNameById}
            playerGroupBy={playerGroupBy}
            onGroupByChange={setPlayerGroupBy}
            deleting={deleting}
            onEdit={setEditingPlayer}
            onDelete={(id, name) => handleDelete('player', id, name)}
            onExport={exportPlayers}
          />
        )}

        {tab === 'finances' && (
          <AdminFinancesTab
            finances={fFinances}
            groupNameById={groupNameById}
            onExport={exportFinances}
          />
        )}

        {tab === 'acessos' && (
          <AdminAccessTab
            admins={admins}
            newAdminEmail={newAdminEmail}
            onEmailChange={setNewAdminEmail}
            onAddAdmin={handleAddAdmin}
            onRemoveAdmin={handleRemoveAdmin}
          />
        )}
      </div>

      {/* Modal de edição de jogador */}
      {editingPlayer && (
        <AdminPlayerEditModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={handleSavePlayer} />
      )}

      {/* Modal de edição de clube */}
      {editingGroup && (
        <AdminEditModal
          title="Editar Clube" subtitle={editingGroup.name} accent="#ccff00"
          onClose={() => setEditingGroup(null)} onSave={handleSaveGroup}
          initial={{ name: editingGroup.name, slug: editingGroup.slug, description: editingGroup.description, founded_year: editingGroup.founded_year, sport_type_default: editingGroup.sport_type_default ?? 'Society' }}
          fields={[
            { key: 'name', label: 'Nome do clube' },
            { key: 'slug', label: 'Slug (URL)' },
            { key: 'sport_type_default', label: 'Esporte', type: 'select', options: [
              { value: 'Society', label: 'Society' }, { value: 'Futsal', label: 'Futsal' }, { value: 'Campo', label: 'Campo' },
            ] },
            { key: 'founded_year', label: 'Fundação', type: 'number' },
            { key: 'description', label: 'Descrição', span2: true },
          ] as EditField[]}
        />
      )}

      {/* Modal de edição de partida */}
      {editingMatch && (
        <AdminEditModal
          title="Editar Partida" subtitle={`${editingMatch.home_team_name} vs ${editingMatch.away_team_name}`} accent="#00b4ff"
          onClose={() => setEditingMatch(null)} onSave={handleSaveMatch}
          initial={{ home_team_name: editingMatch.home_team_name, away_team_name: editingMatch.away_team_name, home_score: editingMatch.home_score, away_score: editingMatch.away_score, status: editingMatch.status }}
          fields={[
            { key: 'home_team_name', label: 'Time A' },
            { key: 'away_team_name', label: 'Time B' },
            { key: 'home_score', label: 'Gols A', type: 'number' },
            { key: 'away_score', label: 'Gols B', type: 'number' },
            { key: 'status', label: 'Status', type: 'select', span2: true, options: [
              { value: 'Agendada', label: 'Agendada' }, { value: 'Em curso', label: 'Em curso' },
              { value: 'Pausada', label: 'Pausada' }, { value: 'Finalizada', label: 'Finalizada' },
            ] },
          ] as EditField[]}
        />
      )}
    </div>
  );
}
