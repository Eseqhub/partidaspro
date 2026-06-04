'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { aggregateAllPlayers, SeasonStanding } from '@/core/services/PlayerStatsService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol, faHandshake, faTrophy,
  faArrowLeft, faChartBar, faShieldHalved,
  faCrown, faScaleBalanced,
} from '@fortawesome/free-solid-svg-icons';

import { StatTable } from './_components/StatTable';
import { SeasonView } from './_components/SeasonView';
import { CompareView } from './_components/CompareView';
import { MatchHistoryView } from './_components/MatchHistoryView';

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
  draws: number;
  losses: number;
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

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading]           = useState(true);
  const [playerStats, setPlayerStats]   = useState<PlayerStat[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [view, setView]                 = useState<'temporada' | 'artilheiros' | 'assistencias' | 'geral' | 'partidas' | 'comparar'>('temporada');
  const [groupName, setGroupName]       = useState('');
  const [cmpA, setCmpA]                 = useState('');
  const [cmpB, setCmpB]                 = useState('');

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
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, matches: 0, wins: 0, draws: 0, losses: 0, mvps: 0, score: 0,
          });
        }
        const match = allMatches.find(m => m.id === p.match_id);
        if (match && match.status === 'Finalizada') {
          const s = statsMap.get(pid)!;
          s.matches++;
          const homeWon = match.home_score > match.away_score;
          const awayWon = match.away_score > match.home_score;
          const isDraw  = match.home_score === match.away_score;
          if ((p.team === 'home' && homeWon) || (p.team === 'away' && awayWon)) s.wins++;
          else if (isDraw) s.draws++;
          else s.losses++;
        }
      });

      (events ?? []).forEach((ev: any) => {
        const s = statsMap.get(ev.player_id);
        if (!s) return;
        if (ev.type === 'Gol')                s.goals++;
        else if (ev.type === 'Assistência')    s.assists++;
        else if (ev.type === 'Cartão Amarelo') s.yellowCards++;
        else if (ev.type === 'Cartão Vermelho') s.redCards++;
        else if (ev.type === 'Craque')         s.mvps++;
      });

      statsMap.forEach(s => {
        s.score = s.goals * 4 + s.assists * 2 + s.wins * 3 + s.mvps * 5 - s.yellowCards - s.redCards * 3;
      });

      setPlayerStats(Array.from(statsMap.values()).filter(s => s.matches > 0));

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
  const champion  = seasonStandings[0];
  const monthLabel = seasonMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const byGoals   = [...playerStats].sort((a, b) => b.goals   - a.goals   || b.assists - a.assists);
  const byAssists = [...playerStats].sort((a, b) => b.assists - a.assists || b.goals   - a.goals);
  const byScore   = [...playerStats].sort((a, b) => b.score   - a.score);

  const VIEWS = [
    { id: 'temporada',    label: 'Temporada',    icon: faCrown         },
    { id: 'artilheiros',  label: 'Artilheiros',  icon: faFutbol        },
    { id: 'assistencias', label: 'Assistências', icon: faHandshake     },
    { id: 'geral',        label: 'Ranking',      icon: faTrophy        },
    { id: 'comparar',     label: 'Comparar',     icon: faScaleBalanced },
    { id: 'partidas',     label: 'Partidas',     icon: faChartBar      },
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
                { label: 'Partidas', value: matchHistory.length,                            sub: 'finalizadas', color: '#00b4ff' },
                { label: 'Gols',     value: playerStats.reduce((s, p) => s + p.goals, 0),  sub: 'no total',    color: '#ccff00' },
                { label: 'Atletas',  value: playerStats.length,                             sub: 'com dados',   color: '#a855f7' },
              ].map(k => (
                <div key={k.label} style={{
                  padding: '14px 12px', background: 'rgba(255,255,255,0.02)',
                  borderLeft: `3px solid ${k.color}`, border: `1px solid ${k.color}18`, borderRadius: 10,
                }}>
                  <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>{k.label}</p>
                  <p style={{ fontSize: 30, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 3 }}>{k.value}</p>
                  <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Nav — labels sempre visíveis no mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => setView(v.id as any)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 5, padding: '12px 6px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                    background: view === v.id ? '#ccff00' : 'rgba(255,255,255,0.03)',
                    border: view === v.id ? 'none' : '1px solid rgba(255,255,255,0.07)',
                    color: view === v.id ? '#000' : 'rgba(255,255,255,0.4)',
                  }}>
                  <FontAwesomeIcon icon={v.icon} style={{ fontSize: 16 }} />
                  <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>
                    {v.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              {view === 'temporada' && (
                <SeasonView
                  seasonMonth={seasonMonth}
                  seasonStandings={seasonStandings}
                  champion={champion}
                  monthLabel={monthLabel}
                  groupName={groupName}
                  onPrevMonth={() => setSeasonMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  onNextMonth={() => setSeasonMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                />
              )}

              {view === 'comparar' && (
                <CompareView
                  playerStats={playerStats}
                  cmpA={cmpA}
                  cmpB={cmpB}
                  onSetCmpA={setCmpA}
                  onSetCmpB={setCmpB}
                />
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

              {view === 'partidas' && <MatchHistoryView matchHistory={matchHistory} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
