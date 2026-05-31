'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol, faHandshake, faTrophy,
  faArrowLeft, faChartBar, faMedal, faShieldHalved,
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
  const [view, setView] = useState<'artilheiros' | 'assistencias' | 'geral' | 'partidas'>('artilheiros');
  const [groupName, setGroupName]     = useState('');

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
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, matches: 0, wins: 0, score: 0,
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
      });

      statsMap.forEach(s => {
        s.score = s.goals * 4 + s.assists * 2 + s.wins * 3 - s.yellowCards - s.redCards * 3;
      });

      setPlayerStats(Array.from(statsMap.values()).filter(s => s.matches > 0));
      setLoading(false);
    }
    load();
  }, [slug]);

  const byGoals   = [...playerStats].sort((a, b) => b.goals - a.goals   || b.assists - a.assists);
  const byAssists = [...playerStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  const byScore   = [...playerStats].sort((a, b) => b.score - a.score);

  const VIEWS = [
    { id: 'artilheiros',  label: 'Artilheiros',   icon: faFutbol    },
    { id: 'assistencias', label: 'Assistências',   icon: faHandshake },
    { id: 'geral',        label: 'Ranking',        icon: faTrophy    },
    { id: 'partidas',     label: 'Partidas',       icon: faChartBar  },
  ] as const;

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
              {view === 'artilheiros'  && <StatTable players={byGoals}   statKey="goals"   />}
              {view === 'assistencias' && <StatTable players={byAssists}  statKey="assists" />}
              {view === 'geral' && (
                <>
                  <p className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-3 px-2">
                    Gol=4pts · Assist=2pts · Vitória=3pts · Amarelo=-1 · Vermelho=-3
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
