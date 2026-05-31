'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/infra/supabase/client';
import { AdminRepository, MonthlyPoint } from '@/infra/repositories/AdminRepository';
import { exportToCsv } from '@/core/services/ExportService';
import { ActivityChart } from '@/presentation/components/dashboard/ActivityChart';
import { AdminPlayerEditModal } from '@/presentation/components/dashboard/AdminPlayerEditModal';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown, faUsers, faShieldHalved, faFutbol,
  faArrowLeft, faChartPie, faTrash, faEye, faPen,
  faSearch, faTimes, faChevronRight, faCircle,
  faLayerGroup, faTag, faDownload, faKey, faPlus, faWallet,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const adminRepo = new AdminRepository();

type Tab = 'overview' | 'clubs' | 'matches' | 'players' | 'finances' | 'acessos';

const STATUS_COLOR: Record<string, string> = {
  'Em curso':  '#ccff00', 'Agendada': '#00b4ff', 'Pausada': '#F97316', 'Finalizada': '#6B7280',
};
const POS_CLR: Record<string, string> = {
  G:'#EAB308', ZAG:'#16A34A', ZGD:'#16A34A', ZGE:'#16A34A', LD:'#22C55E', LE:'#22C55E',
  VOL:'#2563EB', MC:'#3B82F6', MD:'#3B82F6', ME:'#3B82F6', MO:'#8B5CF6',
  PD:'#F97316', PE:'#F97316', SA:'#ccff00', CA:'#EF4444',
};

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase',
      letterSpacing: '0.1em', background: `${color ?? '#fff'}15`, border: `1px solid ${color ?? '#fff'}30`,
      color: color ?? 'rgba(255,255,255,0.5)' }}>{label}</span>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}18`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
      <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{sub}</p>}
    </div>
  );
}

function ExportBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e',
      borderRadius: 6, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
      <FontAwesomeIcon icon={faDownload} /> {label}
    </button>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading]         = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab, setTab]                 = useState<Tab>('overview');
  const [search, setSearch]           = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  const [stats, setStats]       = useState({ groupsCount: 0, playersCount: 0, activeMatchesCount: 0, totalMatchesCount: 0, totalGoals: 0 });
  const [activity, setActivity] = useState<MonthlyPoint[]>([]);
  const [groups, setGroups]     = useState<any[]>([]);
  const [matches, setMatches]   = useState<any[]>([]);
  const [players, setPlayers]   = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [admins, setAdmins]     = useState<any[]>([]);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupDetails, setGroupDetails]   = useState<Record<string, any>>({});
  const [deleting, setDeleting]           = useState<string | null>(null);
  const [playerGroupBy, setPlayerGroupBy] = useState<'club' | 'flat'>('club');
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const groupNameById = new Map(groups.map(g => [g.id, g.name]));

  const loadAll = useCallback(async () => {
    const [s, act, g, m, p, f, a] = await Promise.all([
      adminRepo.getGlobalStats(),
      adminRepo.getActivitySeries(6),
      adminRepo.getAllGroups(),
      adminRepo.getAllMatches(),
      adminRepo.getAllPlayers(),
      adminRepo.getAllFinances(),
      adminRepo.listAdmins(),
    ]);
    setStats(s); setActivity(act); setGroups(g); setMatches(m); setPlayers(p); setFinances(f); setAdmins(a);
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

  // ── Exports ─────────────────────────────────────────────────────────────
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

  // ── Filtros ─────────────────────────────────────────────────────────────
  const ft = search.toLowerCase();
  const fGroups   = groups.filter(g => g.name?.toLowerCase().includes(ft) || g.slug?.toLowerCase().includes(ft));
  const fMatches  = matches.filter(m => `${m.home_team_name}${m.away_team_name}`.toLowerCase().includes(ft));
  const fPlayers  = players.filter(p => p.name?.toLowerCase().includes(ft) || p.phone?.includes(ft));
  const fFinances = finances.filter(f => `${f.description}${f.category}`.toLowerCase().includes(ft));

  // ── Guards ──────────────────────────────────────────────────────────────
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
    { id: 'acessos',  label: 'Acessos',      icon: faKey,          count: admins.length },
  ];

  const PlayerRow = ({ p }: { p: any }) => {
    const lvl = p.skill_level ?? Math.round((p.rating ?? 3) * 2);
    const initials = p.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>{initials}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
          {p.phone && <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>📞 {p.phone}</p>}
        </div>
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {(p.positions ?? []).slice(0, 2).map((pos: string) => (
            <span key={pos} style={{ fontSize: 6, fontWeight: 900, padding: '1px 4px', borderRadius: 3,
              background: `${POS_CLR[pos] ?? '#6B7280'}18`, border: `1px solid ${POS_CLR[pos] ?? '#6B7280'}35`, color: POS_CLR[pos] ?? '#6B7280' }}>{pos}</span>
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 900, minWidth: 18, textAlign: 'right', flexShrink: 0,
          color: lvl >= 8 ? '#ccff00' : lvl >= 6 ? '#00b4ff' : 'rgba(255,255,255,0.3)' }}>{lvl}</span>
        <button onClick={() => setEditingPlayer(p)} style={{ padding: '3px 7px', fontSize: 9, background: 'rgba(204,255,0,0.08)',
          border: '1px solid rgba(204,255,0,0.2)', color: '#ccff00', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button disabled={deleting === p.id} onClick={() => handleDelete('player', p.id, p.name)}
          style={{ padding: '3px 7px', fontSize: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)',
            color: 'rgba(239,68,68,0.5)', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    );
  };

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
              {t.count !== undefined && <span className={`px-1.5 py-0.5 rounded text-[7px] font-black ${tab === t.id ? 'bg-black/20' : 'bg-white/10 text-white/30'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Search (exceto overview/acessos) */}
        {(tab === 'clubs' || tab === 'matches' || tab === 'players' || tab === 'finances') && (
          <div className="relative mb-5">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Buscar ${tab === 'clubs' ? 'clube' : tab === 'matches' ? 'partida' : tab === 'players' ? 'jogador / telefone' : 'lançamento'}...`}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl pl-9 pr-10 py-2.5 text-[10px] font-bold text-white placeholder:text-white/20 uppercase tracking-wider outline-none focus:border-primary/30" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"><FontAwesomeIcon icon={faTimes} className="text-xs" /></button>}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard label="Clubes"        value={stats.groupsCount}        color="#ccff00" />
              <KpiCard label="Jogadores"     value={stats.playersCount}       color="#00b4ff" />
              <KpiCard label="Partidas"      value={stats.totalMatchesCount}  color="#a855f7" />
              <KpiCard label="Ao Vivo"       value={stats.activeMatchesCount} color="#EF4444" sub="em curso" />
              <KpiCard label="Gols"          value={stats.totalGoals}         color="#F97316" />
            </div>

            {/* Gráfico de atividade */}
            <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Atividade (últimos 6 meses)</h3>
              </div>
              <ActivityChart data={activity} />
            </div>

            {/* Exportar tudo */}
            <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Exportar Dados (CSV)</h3>
              <div className="flex flex-wrap gap-2">
                <ExportBtn onClick={exportPlayers}  label="Jogadores" />
                <ExportBtn onClick={exportClubs}    label="Clubes" />
                <ExportBtn onClick={exportMatches}  label="Partidas" />
                <ExportBtn onClick={exportFinances} label="Financeiro" />
              </div>
            </div>
          </div>
        )}

        {/* ── CLUBS ── */}
        {tab === 'clubs' && (
          <div className="space-y-2">
            <div className="flex justify-end mb-1"><ExportBtn onClick={exportClubs} label="Exportar" /></div>
            {fGroups.length === 0 && <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum clube</p>}
            {fGroups.map((g, i) => {
              const expanded = expandedGroup === g.id;
              const details = groupDetails[g.id];
              return (
                <div key={g.id} className="border border-white/5 rounded-xl overflow-hidden">
                  <div onClick={() => expandGroup(g.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                    background: expanded ? 'rgba(204,255,0,0.03)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: expanded ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                      {g.logo_url ? <img src={g.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <FontAwesomeIcon icon={faShieldHalved} style={{ color: expanded ? '#ccff00' : 'rgba(255,255,255,0.15)', fontSize: 14 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{g.name}</p>
                      <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>/{g.slug} · {g.sport_type_default || 'Society'}</p>
                    </div>
                    <Link href={`/dashboard/${g.slug}`} onClick={e => e.stopPropagation()}>
                      <button style={{ padding: '4px 10px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', background: 'rgba(0,180,255,0.1)',
                        border: '1px solid rgba(0,180,255,0.2)', color: '#00b4ff', borderRadius: 4, cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faEye} style={{ marginRight: 4 }} />ACESSAR
                      </button>
                    </Link>
                    <button disabled={deleting === g.id} onClick={e => { e.stopPropagation(); handleDelete('group', g.id, g.name); }}
                      style={{ padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.5)', borderRadius: 4, cursor: 'pointer' }}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }} />
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', background: 'rgba(0,0,0,0.3)' }}>
                      {!details ? <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Elenco ({details.players.length})</p>
                            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                              {details.players.map((p: any) => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>{p.positions?.[0]}</span>
                                  <span style={{ fontSize: 9, fontWeight: 900, color: '#ccff00', minWidth: 16, textAlign: 'right' }}>{p.skill_level ?? Math.round((p.rating ?? 3) * 2)}</span>
                                </div>
                              ))}
                              {details.players.length === 0 && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Sem jogadores</p>}
                            </div>
                          </div>
                          <div>
                            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Partidas ({details.matchCount})</p>
                            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                              {details.matches.map((m: any) => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[m.status] ?? '#fff', flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 8, fontWeight: 700, color: '#fff' }}>{m.home_score}–{m.away_score}</span>
                                  <Chip label={m.status} color={STATUS_COLOR[m.status]} />
                                </div>
                              ))}
                              {details.matches.length === 0 && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Sem partidas</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MATCHES ── */}
        {tab === 'matches' && (
          <div>
            <div className="flex justify-end mb-2"><ExportBtn onClick={exportMatches} label="Exportar" /></div>
            <div className="border border-white/5 rounded-xl overflow-hidden">
              {fMatches.length === 0 && <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhuma partida</p>}
              {fMatches.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[m.status] ?? '#fff' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.home_team_name || 'A'} <span style={{ color: 'rgba(255,255,255,0.5)' }}>{m.home_score}–{m.away_score}</span> {m.away_team_name || 'B'}
                    </p>
                    <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{groupNameById.get(m.group_id) ?? ''}{m.date ? ` · ${new Date(m.date).toLocaleDateString('pt-BR')}` : ''}</p>
                  </div>
                  <Chip label={m.status} color={STATUS_COLOR[m.status]} />
                  <button disabled={deleting === m.id} onClick={() => handleDelete('match', m.id, `${m.home_team_name} vs ${m.away_team_name}`)}
                    style={{ padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.4)', borderRadius: 4, cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PLAYERS ── */}
        {tab === 'players' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
                {[{ id: 'club', label: 'Por Clube', icon: faLayerGroup }, { id: 'flat', label: 'Lista', icon: faTag }].map(v => (
                  <button key={v.id} onClick={() => setPlayerGroupBy(v.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${playerGroupBy === v.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'}`}>
                    <FontAwesomeIcon icon={v.icon} />{v.label}
                  </button>
                ))}
              </div>
              <ExportBtn onClick={exportPlayers} label="Exportar" />
            </div>

            {fPlayers.length === 0 && <p className="text-center py-12 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum jogador</p>}

            {playerGroupBy === 'club' ? (() => {
              const byClub = new Map<string, any[]>();
              fPlayers.forEach(p => { const k = p.group_id ?? '__'; if (!byClub.has(k)) byClub.set(k, []); byClub.get(k)!.push(p); });
              return (
                <div className="space-y-3">
                  {Array.from(byClub.entries()).map(([gid, grpPlayers]) => (
                    <div key={gid} className="border border-white/5 rounded-xl overflow-hidden">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(204,255,0,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#ccff00', fontSize: 12 }} />
                        <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#ccff00' }}>{groupNameById.get(gid) ?? 'Sem clube'}</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(204,255,0,0.6)', background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)', padding: '2px 8px', borderRadius: 20 }}>{grpPlayers.length}</span>
                      </div>
                      {grpPlayers.map(p => <PlayerRow key={p.id} p={p} />)}
                    </div>
                  ))}
                </div>
              );
            })() : (
              <div className="border border-white/5 rounded-xl overflow-hidden">
                {fPlayers.map(p => <PlayerRow key={p.id} p={p} />)}
              </div>
            )}
          </div>
        )}

        {/* ── FINANCES ── */}
        {tab === 'finances' && (
          <div>
            <div className="flex justify-end mb-2"><ExportBtn onClick={exportFinances} label="Exportar" /></div>
            <div className="border border-white/5 rounded-xl overflow-hidden">
              {fFinances.length === 0 && <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum lançamento</p>}
              {fFinances.map((f, i) => {
                const isReceita = f.type === 'Receita';
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description ?? f.category}</p>
                      <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{groupNameById.get(f.group_id) ?? ''} · {f.category} · {f.status}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace', color: isReceita ? '#22c55e' : '#ef4444', flexShrink: 0 }}>
                      {isReceita ? '+' : '-'}R${Math.abs(Number(f.amount)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACESSOS ── */}
        {tab === 'acessos' && (
          <div className="space-y-4">
            <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faKey} className="text-primary" /> Conceder acesso de admin
              </h3>
              <p className="text-[8px] text-white/30 font-bold mb-3 uppercase tracking-wide">Quem você adicionar terá acesso total a este painel.</p>
              <div className="flex gap-2">
                <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="email@exemplo.com"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] text-white outline-none focus:border-primary/30" />
                <button onClick={handleAddAdmin} className="px-4 py-2.5 bg-primary text-black font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={faPlus} /> Add
                </button>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Administradores ({admins.length})</h3>
              </div>
              {admins.map((a, i) => (
                <div key={a.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <FontAwesomeIcon icon={a.owner ? faCrown : faShieldHalved} style={{ color: a.owner ? '#FFD700' : 'rgba(255,255,255,0.3)', fontSize: 12, width: 16 }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</span>
                  {a.owner ? <Chip label="Owner" color="#FFD700" /> : (
                    <button onClick={() => handleRemoveAdmin(a.email)} style={{ padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.5)', borderRadius: 4, cursor: 'pointer' }}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border border-amber-500/15 bg-amber-500/[0.04] rounded-xl">
              <p className="text-[9px] text-amber-300/70 font-bold leading-relaxed">
                ⚠️ Para a delegação funcionar, a tabela <code className="text-amber-300">super_admins</code> precisa existir no Supabase.
                Se ainda não criou, rode o SQL que o desenvolvedor te passou. Você (owner) sempre terá acesso, com ou sem a tabela.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de edição de jogador */}
      {editingPlayer && (
        <AdminPlayerEditModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={handleSavePlayer} />
      )}
    </div>
  );
}
