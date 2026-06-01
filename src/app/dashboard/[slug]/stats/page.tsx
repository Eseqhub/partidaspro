'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { aggregateAllPlayers, SeasonStanding } from '@/core/services/PlayerStatsService';
import { generateSeasonImage, shareSeasonImage } from '@/core/services/seasonImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol, faHandshake, faTrophy,
  faArrowLeft, faChartBar, faMedal, faShieldHalved,
  faCrown, faChevronLeft, faChevronRight, faShareNodes, faScaleBalanced,
} from '@fortawesome/free-solid-svg-icons';

interface PlayerStat {
  id: string;
  name: string;
  photo_url?: string;
  positions: string[];
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matches: number;
  wins: number;
  mvps: number;
  score: number;
}

interface MatchRecord {
  id: string;
  date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  status: string;
  field_type?: string;
}

const groupRepo = new GroupRepository();
const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

function StatTable({ players, statKey }: { players: PlayerStat[]; statKey: keyof PlayerStat }) {
  if (!players.length) return (
    <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">Sem dados ainda</p>
  );
  const max = Number(players[0][statKey]) || 1;
  return (
    <div className="space-y-1">
      {players.map((p, i) => {
        const val = Number(p[statKey]);
        const pct = (val / max) * 100;
        const initials = p.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            background: i === 0 ? 'rgba(204,255,0,0.04)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            borderRadius: 6,
          }}>
            <div style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>
              {i < 3
                ? <FontAwesomeIcon icon={faMedal} style={{ color: medals[i], fontSize: 12 }} />
                : <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
              }
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: i === 0 ? '1.5px solid rgba(204,255,0,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
              {p.photo_url
                ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? '#ccff00' : 'rgba(255,255,255,0.4)' }}>{initials}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: i === 0 ? '#ccff00' : '#fff', marginLeft: 8, flexShrink: 0 }}>{val}</span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 1,
                  background: i === 0 ? 'linear-gradient(90deg,#ccff00,#aadd00)' : 'rgba(255,255,255,0.2)' }} />
              </div>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                {p.matches}J · {p.wins}V · {p.positions?.[0] ?? '—'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading]         = useState(true);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [view, setView] = useState<'temporada' | 'artilheiros' | 'assistencias' | 'geral' | 'partidas' | 'comparar'>('temporada');
  const [groupName, setGroupName]     = useState('');
  const [cmpA, setCmpA] = useState<string>('');
  const [cmpB, setCmpB] = useState<string>('');

  // Dados crus para a Temporada (reagregação por mês)
  const [rawEvents, setRawEvents]       = useState<any[]>([]);
  const [rawPresences, setRawPresences] = useState<any[]>([]);
  const [rawMatches, setRawMatches]     = useState<any[]>([]);
  const [playerMeta, setPlayerMeta]     = useState<Map<string, { name: string; photo_url?: string }>>(new Map());
  const [seasonMonth, setSeasonMonth]   = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  useEffect(() => {
    async function load() {
      const group = await groupRepo.findBySlug(slug);
      if (!group) { setLoading(false); return; }
      setGroupName(group.name);

      const { data: matches } = await supabase
        .from('matches')
        .select('id, date, home_team_name, away_team_name, home_score, away_score, status, field_type')
        .eq('group_id', group.id)
        .in('status', ['Finalizada', 'Em curso', 'Pausada'])
        .order('created_at', { ascending: false })
        .limit(50);

      const allMatches: MatchRecord[] = matches ?? [];
      setMatchHistory(allMatches.filter(m => m.status === 'Finalizada').slice(0, 20));

      if (!allMatches.length) { setLoading(false); return; }
      const matchIds = allMatches.map(m => m.id);

      const [{ data: events }, { data: presences }] = await Promise.all([
        supabase.from('events').select('player_id, type, match_id').in('match_id', matchIds),
        supabase.from('match_presence')
          .select('player_id, team, match_id, player:players(id, name, photo_url, positions)')
          .in('match_id', matchIds),
      ]);

      const statsMap = new Map<string, PlayerStat>();

      (presences ?? []).forEach((p: any) => {
        if (!p.player) return;
        const pid = p.player.id;
        if (!statsMap.has(pid)) {
          statsMap.set(pid, {
            id: pid, name: p.player.name, photo_url: p.player.photo_url,
            positions: p.player.positions ?? [],
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, matches: 0, wins: 0, mvps: 0, score: 0,
          });
        }
        const match = allMatches.find(m => m.id === p.match_id);
        if (match && match.status === 'Finalizada') {
          const s = statsMap.get(pid)!;
          s.matches++;
          const homeWon = match.home_score > match.away_score;
          const awayWon = match.away_score > match.home_score;
          if ((p.team === 'home' && homeWon) || (p.team === 'away' && awayWon)) s.wins++;
        }
      });

      (events ?? []).forEach((ev: any) => {
        const s = statsMap.get(ev.player_id);
        if (!s) return;
        if (ev.type === 'Gol')               s.goals++;
        else if (ev.type === 'Assistência')   s.assists++;
        else if (ev.type === 'Cartão Amarelo') s.yellowCards++;
        else if (ev.type === 'Cartão Vermelho') s.redCards++;
        else if (ev.type === 'Craque')        s.mvps++;
      });

      statsMap.forEach(s => {
        s.score = s.goals * 4 + s.assists * 2 + s.wins * 3 + s.mvps * 5 - s.yellowCards - s.redCards * 3;
      });

      setPlayerStats(Array.from(statsMap.values()).filter(s => s.matches > 0));

      // Guarda dados crus para a Temporada (reagregação por mês no cliente)
      const meta = new Map<string, { name: string; photo_url?: string }>();
      (presences ?? []).forEach((p: any) => {
        if (p.player) meta.set(p.player.id, { name: p.player.name, photo_url: p.player.photo_url });
      });
      setPlayerMeta(meta);
      setRawEvents(events ?? []);
      setRawPresences((presences ?? []).map((p: any) => ({ player_id: p.player_id, team: p.team, match_id: p.match_id })));
      setRawMatches(allMatches);
      setLoading(false);
    }
    load();
  }, [slug]);

  // Standings da temporada (mês selecionado)
  const monthMatches = rawMatches.filter(m => {
    if (m.status !== 'Finalizada' || !m.date) return false;
    const d = new Date(m.date + 'T12:00:00');
    return d.getFullYear() === seasonMonth.getFullYear() && d.getMonth() === seasonMonth.getMonth();
  });
  const monthMatchIds = new Set(monthMatches.map(m => m.id));
  const seasonStandings: SeasonStanding[] = aggregateAllPlayers(
    rawEvents.filter(e => monthMatchIds.has(e.match_id)),
    rawPresences.filter(p => monthMatchIds.has(p.match_id)),
    monthMatches,
    playerMeta,
  );
  const champion = seasonStandings[0];
  const monthLabel = seasonMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const byGoals   = [...playerStats].sort((a, b) => b.goals - a.goals   || b.assists - a.assists);
  const byAssists = [...playerStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  const byScore   = [...playerStats].sort((a, b) => b.score - a.score);

  const VIEWS = [
    { id: 'temporada',    label: 'Temporada',      icon: faCrown          },
    { id: 'artilheiros',  label: 'Artilheiros',    icon: faFutbol         },
    { id: 'assistencias', label: 'Assistências',   icon: faHandshake      },
    { id: 'geral',        label: 'Ranking',        icon: faTrophy         },
    { id: 'comparar',     label: 'Comparar',       icon: faScaleBalanced  },
    { id: 'partidas',     label: 'Partidas',       icon: faChartBar       },
  ] as const;

  // Comparação de jogadores
  const cmpDefaults = byScore;
  const pA = playerStats.find(p => p.id === (cmpA || cmpDefaults[0]?.id));
  const pB = playerStats.find(p => p.id === (cmpB || cmpDefaults[1]?.id));
  const CMP_ROWS: { label: string; key: keyof PlayerStat; pct?: boolean }[] = [
    { label: 'Jogos',         key: 'matches' },
    { label: 'Gols',          key: 'goals' },
    { label: 'Assistências',  key: 'assists' },
    { label: 'Vitórias',      key: 'wins' },
    { label: 'Craque',        key: 'mvps' },
    { label: 'Pontos',        key: 'score' },
  ];

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-lg">
            <FontAwesomeIcon icon={faArrowLeft} className="text-white/40 text-xs" />
          </button>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/25 mb-0.5">{groupName}</p>
            <h1 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-primary" style={{ fontSize: 14 }} />
              Estatísticas do Clube
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Partidas',  value: matchHistory.length,                                     color: '#00b4ff' },
                { label: 'Gols',      value: playerStats.reduce((s, p) => s + p.goals, 0),            color: '#ccff00' },
                { label: 'Craques',   value: playerStats.length,                                       color: '#a855f7' },
              ].map(k => (
                <div key={k.label} style={{
                  padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
                  borderLeft: `3px solid ${k.color}`, border: `1px solid ${k.color}15`, borderRadius: 8,
                }}>
                  <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Nav */}
            <div className="flex gap-1 mb-4 bg-white/[0.03] p-1 rounded-xl border border-white/5">
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => setView(v.id as any)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all flex-1 ${
                    view === v.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'
                  }`}>
                  <FontAwesomeIcon icon={v.icon} />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">

              {view === 'temporada' && (
                <div className="space-y-4">
                  {/* Navegação de mês */}
                  <div className="flex items-center justify-between">
                    <button onClick={() => setSeasonMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                      className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg">
                      <FontAwesomeIcon icon={faChevronLeft} className="text-white/40 text-[10px]" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{monthLabel}</span>
                    <button onClick={() => setSeasonMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                      className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg">
                      <FontAwesomeIcon icon={faChevronRight} className="text-white/40 text-[10px]" />
                    </button>
                  </div>

                  {seasonStandings.length === 0 ? (
                    <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">
                      Nenhuma partida finalizada neste mês
                    </p>
                  ) : (
                    <>
                      {/* Compartilhar resumo da temporada */}
                      <button
                        onClick={async () => {
                          try {
                            const top = (key: 'goals' | 'assists' | 'mvpCount') =>
                              [...seasonStandings].sort((a, b) => (b[key] as number) - (a[key] as number))[0];
                            const ts = top('goals'), ta = top('assists'), cr = top('mvpCount');
                            const blob = await generateSeasonImage({
                              groupName, monthLabel,
                              champion: champion ? { name: champion.name, points: champion.points, wins: champion.wins } : undefined,
                              topScorer:   ts && ts.goals    > 0 ? { name: ts.name, value: ts.goals }    : undefined,
                              topAssister: ta && ta.assists  > 0 ? { name: ta.name, value: ta.assists }  : undefined,
                              craque:      cr && cr.mvpCount > 0 ? { name: cr.name, value: cr.mvpCount } : undefined,
                            });
                            await shareSeasonImage(blob, `Resumo da temporada — ${monthLabel}`);
                          } catch (e: any) { alert('Erro ao gerar imagem: ' + (e?.message ?? '')); }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] mb-1"
                        style={{ background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}
                      >
                        <FontAwesomeIcon icon={faShareNodes} /> Compartilhar Resumo do Mês
                      </button>

                      {/* Campeão */}
                      {champion && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                          background: 'linear-gradient(135deg,rgba(255,215,0,0.1),transparent)',
                          border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12,
                        }}>
                          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                              border: '2px solid #FFD700', background: 'rgba(255,255,255,0.06)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {champion.photo_url
                                ? <img src={champion.photo_url} alt={champion.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD700' }}>{champion.name.charAt(0)}</span>}
                            </div>
                            <span style={{ position: 'absolute', top: -8, right: -6, fontSize: 18 }}>👑</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#FFD700' }}>
                              Líder da Temporada
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1.1 }}>
                              {champion.name}
                            </p>
                            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 2 }}>
                              {champion.points} pts · {champion.wins}V {champion.draws}E {champion.losses}D · {champion.goals}⚽ · {champion.mvpCount}🏆
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Legenda */}
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/20 px-1">
                        Pontos: Vitória=3 · Empate=1 · 🏆Craque=2 (bônus)
                      </p>

                      {/* Tabela */}
                      <div>
                        {seasonStandings.map((p, i) => {
                          const medal = ['#FFD700', '#C0C0C0', '#CD7F32'][i];
                          return (
                            <div key={p.playerId} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                              background: i === 0 ? 'rgba(255,215,0,0.05)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                              borderRadius: 6,
                            }}>
                              <span style={{ width: 18, textAlign: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900,
                                color: medal ?? 'rgba(255,255,255,0.25)' }}>
                                {i + 1}
                              </span>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                                background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: medal ? `1.5px solid ${medal}` : '1px solid rgba(255,255,255,0.08)' }}>
                                {p.photo_url
                                  ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{p.name.charAt(0)}</span>}
                              </div>
                              <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </span>
                              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700, flexShrink: 0 }}>
                                {p.matches}J · {p.goals}⚽
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? '#FFD700' : '#fff', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
                                {p.points}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {view === 'comparar' && (
                playerStats.length < 2 ? (
                  <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">Precisa de pelo menos 2 jogadores com partidas</p>
                ) : (
                  <div className="space-y-4">
                    {/* Seletores */}
                    <div className="grid grid-cols-2 gap-3">
                      {[{ val: cmpA || cmpDefaults[0]?.id, set: setCmpA, color: '#ccff00' },
                        { val: cmpB || cmpDefaults[1]?.id, set: setCmpB, color: '#00b4ff' }].map((s, i) => (
                        <select key={i} value={s.val} onChange={e => s.set(e.target.value)}
                          className="w-full bg-black/40 border rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-white outline-none"
                          style={{ borderColor: `${s.color}40` }}>
                          {playerStats.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                        </select>
                      ))}
                    </div>

                    {pA && pB && (
                      <>
                        {/* Cabeçalho com nomes */}
                        <div className="grid grid-cols-2 gap-3">
                          {[{ p: pA, color: '#ccff00' }, { p: pB, color: '#00b4ff' }].map(({ p, color }, i) => {
                            const ini = p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                            return (
                              <div key={i} className="flex flex-col items-center gap-2 py-3 rounded-xl" style={{ background: `${color}0c`, border: `1px solid ${color}30` }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, fontWeight: 900, color }}>{ini}</span>}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff', textAlign: 'center' }}>{p.name}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Linhas de comparação */}
                        <div className="space-y-1.5">
                          {CMP_ROWS.map(row => {
                            const a = Number(pA[row.key]); const b = Number(pB[row.key]);
                            const max = Math.max(a, b, 1);
                            return (
                              <div key={row.key}>
                                <p className="text-center text-[7px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">{row.label}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-black tabular-nums w-8 text-right" style={{ color: a >= b ? '#ccff00' : 'rgba(255,255,255,0.4)' }}>{a}</span>
                                  <div className="flex-1 flex gap-0.5 h-2">
                                    <div className="flex-1 flex justify-end"><div style={{ width: `${(a / max) * 100}%`, background: a >= b ? '#ccff00' : 'rgba(204,255,0,0.3)', borderRadius: 2 }} /></div>
                                    <div className="flex-1"><div style={{ width: `${(b / max) * 100}%`, height: '100%', background: b >= a ? '#00b4ff' : 'rgba(0,180,255,0.3)', borderRadius: 2 }} /></div>
                                  </div>
                                  <span className="text-[13px] font-black tabular-nums w-8" style={{ color: b >= a ? '#00b4ff' : 'rgba(255,255,255,0.4)' }}>{b}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              )}
              {view === 'artilheiros'  && <StatTable players={byGoals}   statKey="goals"   />}
              {view === 'assistencias' && <StatTable players={byAssists}  statKey="assists" />}
              {view === 'geral' && (
                <>
                  <p className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-3 px-2">
                    Gol=4 · Assist=2 · Vitória=3 · 🏆Craque=5 · Amarelo=-1 · Vermelho=-3
                  </p>
                  <StatTable players={byScore} statKey="score" />
                </>
              )}
              {view === 'partidas' && (
                <div className="space-y-1">
                  {matchHistory.length === 0
                    ? <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">Sem partidas finalizadas</p>
                    : matchHistory.map((m, i) => {
                      const homeWon = m.home_score > m.away_score;
                      const awayWon = m.away_score > m.home_score;
                      return (
                        <div key={m.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderRadius: 6,
                        }}>
                          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 900, minWidth: 14 }}>{i + 1}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: homeWon ? '#ccff00' : '#fff' }}>
                                {m.home_team_name || 'Time A'}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
                                {m.home_score} – {m.away_score}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: awayWon ? '#00b4ff' : 'rgba(255,255,255,0.4)' }}>
                                {m.away_team_name || 'Time B'}
                              </span>
                            </div>
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                              {m.date ? new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
                              {m.field_type ? ` · ${m.field_type}` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
