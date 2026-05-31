'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/infra/supabase/client';
import { AdminRepository } from '@/infra/repositories/AdminRepository';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown, faUsers, faShieldHalved, faFutbol,
  faArrowLeft, faChartPie, faTrash, faEye,
  faSearch, faTimes, faChevronRight, faCircle,
  faLayerGroup, faTag,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const SUPER_ADMIN_EMAIL = 'eseqmotion@gmail.com';
const adminRepo = new AdminRepository();

type Tab = 'overview' | 'clubs' | 'matches' | 'players';

const STATUS_COLOR: Record<string, string> = {
  'Em curso':  '#ccff00',
  'Agendada':  '#00b4ff',
  'Pausada':   '#F97316',
  'Finalizada':'#6B7280',
};

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 3,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      background: `${color ?? '#fff'}15`,
      border: `1px solid ${color ?? '#fff'}30`,
      color: color ?? 'rgba(255,255,255,0.5)',
    }}>{label}</span>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{
      padding: '18px 20px', background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${color}18`, borderLeft: `3px solid ${color}`, borderRadius: 8,
    }}>
      <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1, marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const router  = useRouter();
  const [loading,      setLoading]      = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab,          setTab]          = useState<Tab>('overview');
  const [search,       setSearch]       = useState('');
  const [stats,        setStats]        = useState({ groupsCount: 0, playersCount: 0, activeMatchesCount: 0, totalMatchesCount: 0, totalGoals: 0 });
  const [groups,       setGroups]       = useState<any[]>([]);
  const [matches,      setMatches]      = useState<any[]>([]);
  const [players,      setPlayers]      = useState<any[]>([]);
  const [expandedGroup,setExpandedGroup]= useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<Record<string, any>>({});
  const [deleting,     setDeleting]     = useState<string | null>(null);
  const [playerGroupBy, setPlayerGroupBy] = useState<'club' | 'flat'>('club');

  const loadAll = useCallback(async () => {
    const [s, g, m, p] = await Promise.all([
      adminRepo.getGlobalStats(),
      adminRepo.getAllGroups(),
      adminRepo.getAllMatches(),
      adminRepo.getAllPlayers(),
    ]);
    setStats(s);
    setGroups(g);
    setMatches(m);
    setPlayers(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== SUPER_ADMIN_EMAIL) {
        setAccessDenied(true);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }
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
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const filterText = search.toLowerCase();
  const filteredGroups  = groups.filter(g  => g.name?.toLowerCase().includes(filterText)  || g.slug?.toLowerCase().includes(filterText));
  const filteredMatches = matches.filter(m => (m.home_team_name + m.away_team_name)?.toLowerCase().includes(filterText));
  const filteredPlayers = players.filter(p => p.name?.toLowerCase().includes(filterText));

  // ── Guards ────────────────────────────────────────────────────────────────
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
    { id: 'overview', label: 'Visão Geral',  icon: faChartPie                   },
    { id: 'clubs',    label: 'Clubes',        icon: faShieldHalved, count: groups.length   },
    { id: 'matches',  label: 'Partidas',      icon: faFutbol,       count: matches.length  },
    { id: 'players',  label: 'Jogadores',     icon: faUsers,        count: players.length  },
  ];

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-lg">
                <FontAwesomeIcon icon={faArrowLeft} className="text-white/40 text-xs" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FontAwesomeIcon icon={faCrown} className="text-primary" style={{ fontSize: 10 }} />
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Super Admin Console</span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                PARTIDAS<span className="text-primary italic">.PRO</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-primary/20 bg-primary/5 rounded-lg">
            <FontAwesomeIcon icon={faCircle} className="text-primary animate-pulse" style={{ fontSize: 6 }} />
            <span className="text-[8px] font-black uppercase tracking-widest text-primary">Sistema Online</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex-1 ${
                tab === t.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'
              }`}>
              <FontAwesomeIcon icon={t.icon} />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black ${tab === t.id ? 'bg-black/20' : 'bg-white/10 text-white/30'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar (exceto overview) */}
        {tab !== 'overview' && (
          <div className="relative mb-5">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Buscar ${tab === 'clubs' ? 'clube' : tab === 'matches' ? 'partida' : 'jogador'}...`}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl pl-9 pr-10 py-2.5 text-[10px] font-bold text-white placeholder:text-white/20 uppercase tracking-wider outline-none focus:border-primary/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            )}
          </div>
        )}

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard label="Clubes"           value={stats.groupsCount}        color="#ccff00" />
              <KpiCard label="Jogadores"        value={stats.playersCount}       color="#00b4ff" />
              <KpiCard label="Partidas Total"   value={stats.totalMatchesCount}  color="#a855f7" />
              <KpiCard label="Ao Vivo Agora"    value={stats.activeMatchesCount} color="#EF4444" sub="em curso" />
              <KpiCard label="Gols Registrados" value={stats.totalGoals}         color="#F97316" />
            </div>

            {/* Últimos clubes */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Clubes Recentes</h3>
                <button onClick={() => setTab('clubs')} className="text-[8px] font-black uppercase text-primary/60 hover:text-primary transition-colors">
                  Ver todos <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[7px]" />
                </button>
              </div>
              {groups.slice(0, 5).map((g, i) => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {g.logo_url
                      ? <img src={g.logo_url} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#ccff00', fontSize: 13 }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{g.name}</p>
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>/{g.slug}</p>
                  </div>
                  <Link href={`/dashboard/${g.slug}`}>
                    <button style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(204,255,0,0.5)', letterSpacing: '0.1em' }}>
                      ACESSAR
                    </button>
                  </Link>
                </div>
              ))}
            </div>

            {/* Últimas partidas */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Partidas Recentes</h3>
                <button onClick={() => setTab('matches')} className="text-[8px] font-black uppercase text-primary/60 hover:text-primary transition-colors">
                  Ver todas <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[7px]" />
                </button>
              </div>
              {matches.slice(0, 5).map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[m.status] ?? '#fff' }} />
                  <p style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>
                    {m.home_team_name || 'Time A'} <span style={{ color: 'rgba(255,255,255,0.3)' }}>{m.home_score}–{m.away_score}</span> {m.away_team_name || 'Time B'}
                  </p>
                  <Chip label={m.status} color={STATUS_COLOR[m.status]} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CLUBS ─────────────────────────────────────────────────────────── */}
        {tab === 'clubs' && (
          <div className="space-y-2">
            {filteredGroups.length === 0 && (
              <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum clube encontrado</p>
            )}
            {filteredGroups.map((g, i) => {
              const expanded = expandedGroup === g.id;
              const details  = groupDetails[g.id];
              return (
                <div key={g.id} className="border border-white/5 rounded-xl overflow-hidden">
                  {/* Club row */}
                  <div
                    onClick={() => expandGroup(g.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                      background: expanded ? 'rgba(204,255,0,0.03)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}>
                    <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                      background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: expanded ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                      {g.logo_url
                        ? <img src={g.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <FontAwesomeIcon icon={faShieldHalved} style={{ color: expanded ? '#ccff00' : 'rgba(255,255,255,0.15)', fontSize: 14 }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{g.name}</p>
                      <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                        /{g.slug} · {g.sport_type_default || 'Society'} · {new Date(g.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Link href={`/dashboard/${g.slug}`} onClick={e => e.stopPropagation()}>
                        <button style={{ padding: '4px 10px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                          background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', color: '#00b4ff',
                          borderRadius: 4, letterSpacing: '0.1em', cursor: 'pointer' }}>
                          <FontAwesomeIcon icon={faEye} style={{ marginRight: 4 }} />ACESSAR
                        </button>
                      </Link>
                      <button
                        disabled={deleting === g.id}
                        onClick={e => { e.stopPropagation(); handleDelete('group', g.id, g.name); }}
                        style={{ padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.5)',
                          borderRadius: 4, cursor: 'pointer', transition: 'all .15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.5)'; }}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }} />
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', background: 'rgba(0,0,0,0.3)' }}>
                      {!details ? (
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Carregando...</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {/* Players */}
                          <div>
                            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                              Elenco ({details.players.length})
                            </p>
                            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                              {details.players.map((p: any) => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>{p.name}</span>
                                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{p.positions?.[0]}</span>
                                  <span style={{ fontSize: 9, fontWeight: 900, color: '#ccff00', minWidth: 16, textAlign: 'right' }}>{p.skill_level ?? Math.round((p.rating ?? 3) * 2)}</span>
                                </div>
                              ))}
                              {details.players.length === 0 && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Sem jogadores</p>}
                            </div>
                          </div>
                          {/* Matches */}
                          <div>
                            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                              Partidas ({details.matchCount})
                            </p>
                            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                              {details.matches.map((m: any) => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[m.status] ?? '#fff', flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 8, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                                    {m.home_score}–{m.away_score}
                                  </span>
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

        {/* ── MATCHES ───────────────────────────────────────────────────────── */}
        {tab === 'matches' && (
          <div className="border border-white/5 rounded-xl overflow-hidden">
            {filteredMatches.length === 0 && (
              <p className="text-center py-16 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhuma partida encontrada</p>
            )}
            {filteredMatches.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[m.status] ?? '#fff' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>
                    {m.home_team_name || 'Time A'}{' '}
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{m.home_score}–{m.away_score}</span>{' '}
                    {m.away_team_name || 'Time B'}
                  </p>
                  <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                    {m.date ? new Date(m.date).toLocaleDateString('pt-BR') : ''}
                    {m.field_type ? ` · ${m.field_type}` : ''}
                    {m.modality ? ` · ${m.modality}` : ''}
                  </p>
                </div>
                <Chip label={m.status} color={STATUS_COLOR[m.status]} />
                <button
                  disabled={deleting === m.id}
                  onClick={() => handleDelete('match', m.id, `${m.home_team_name} vs ${m.away_team_name}`)}
                  style={{ padding: '4px 8px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.4)',
                    borderRadius: 4, cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── PLAYERS ───────────────────────────────────────────────────────── */}
        {tab === 'players' && (() => {
          // Mapa posição → cor de tag
          const POS_CLR: Record<string, string> = {
            G:'#EAB308', ZAG:'#16A34A', ZGD:'#16A34A', ZGE:'#16A34A',
            LD:'#22C55E', LE:'#22C55E', VOL:'#2563EB', MC:'#3B82F6',
            MD:'#3B82F6', ME:'#3B82F6', MO:'#8B5CF6',
            PD:'#F97316', PE:'#F97316', SA:'#ccff00', CA:'#EF4444',
          };

          function PlayerRow({ p, i }: { p: any; i: number }) {
            const lvl = p.skill_level ?? Math.round((p.rating ?? 3) * 2);
            const initials = p.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {/* Avatar */}
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.07)' }}>
                  {p.photo_url
                    ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>{initials}</span>
                  }
                </div>
                {/* Nome */}
                <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                {/* Tags de posição */}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {(p.positions ?? []).slice(0, 2).map((pos: string) => (
                    <span key={pos} style={{
                      fontSize: 6, fontWeight: 900, padding: '1px 4px', borderRadius: 3,
                      background: `${POS_CLR[pos] ?? '#6B7280'}18`,
                      border: `1px solid ${POS_CLR[pos] ?? '#6B7280'}35`,
                      color: POS_CLR[pos] ?? '#6B7280', textTransform: 'uppercase',
                    }}>{pos}</span>
                  ))}
                </div>
                {/* Nível */}
                <span style={{ fontSize: 12, fontWeight: 900, minWidth: 18, textAlign: 'right', flexShrink: 0,
                  color: lvl >= 8 ? '#ccff00' : lvl >= 6 ? '#00b4ff' : 'rgba(255,255,255,0.3)' }}>{lvl}</span>
                {/* Status */}
                <Chip label={p.status ?? 'Ativo'} color={p.status !== 'Inativo' ? '#22C55E' : '#6B7280'} />
                {/* Delete */}
                <button disabled={deleting === p.id}
                  onClick={() => handleDelete('player', p.id, p.name)}
                  style={{ padding: '3px 7px', fontSize: 9, background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.4)',
                    borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {/* Controles de agrupamento */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
                  {[
                    { id: 'club', label: 'Por Clube', icon: faLayerGroup },
                    { id: 'flat', label: 'Lista',     icon: faTag        },
                  ].map(v => (
                    <button key={v.id} onClick={() => setPlayerGroupBy(v.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${
                        playerGroupBy === v.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'
                      }`}>
                      <FontAwesomeIcon icon={v.icon} />
                      {v.label}
                    </button>
                  ))}
                </div>
                <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">
                  {filteredPlayers.length} jogadores
                </span>
              </div>

              {filteredPlayers.length === 0 && (
                <p className="text-center py-12 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum jogador encontrado</p>
              )}

              {/* Agrupado por clube */}
              {playerGroupBy === 'club' && (() => {
                const byClub = new Map<string, { group: any; players: any[] }>();
                filteredPlayers.forEach(p => {
                  const gid = p.group_id ?? '__sem_clube__';
                  if (!byClub.has(gid)) {
                    const grp = groups.find(g => g.id === gid);
                    byClub.set(gid, { group: grp, players: [] });
                  }
                  byClub.get(gid)!.players.push(p);
                });

                return (
                  <div className="space-y-3">
                    {Array.from(byClub.entries()).map(([gid, { group: grp, players: grpPlayers }]) => (
                      <div key={gid} className="border border-white/5 rounded-xl overflow-hidden">
                        {/* Club header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                          background: 'rgba(204,255,0,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ width: 28, height: 28, borderRadius: 5, overflow: 'hidden', flexShrink: 0,
                            background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(204,255,0,0.2)' }}>
                            {grp?.logo_url
                              ? <img src={grp.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#ccff00', fontSize: 11 }} />
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#ccff00' }}>
                              {grp?.name ?? 'Sem clube'}
                            </p>
                            <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                              {grp?.slug ? `/${grp.slug}` : ''} · {grp?.sport_type_default ?? ''}
                            </p>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(204,255,0,0.6)',
                            background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)',
                            padding: '2px 8px', borderRadius: 20 }}>
                            {grpPlayers.length} craques
                          </span>
                          {grp && (
                            <Link href={`/dashboard/${grp.slug}`}>
                              <button style={{ padding: '3px 8px', fontSize: 7, fontWeight: 900, textTransform: 'uppercase',
                                background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)',
                                color: '#00b4ff', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.1em' }}>
                                <FontAwesomeIcon icon={faEye} style={{ marginRight: 3 }} />ACESSAR
                              </button>
                            </Link>
                          )}
                        </div>
                        {/* Players list */}
                        {grpPlayers.map((p, i) => <PlayerRow key={p.id} p={p} i={i} />)}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Lista plana */}
              {playerGroupBy === 'flat' && (
                <div className="border border-white/5 rounded-xl overflow-hidden">
                  {filteredPlayers.map((p, i) => <PlayerRow key={p.id} p={p} i={i} />)}
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
