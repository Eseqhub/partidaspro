'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { Player } from '@/core/entities/player';
import { SportType } from '@/core/entities/match';
import { TacticalBoardV2 } from '@/presentation/components/dashboard/TacticalBoardV2';
import { LiveFeed } from '@/presentation/components/dashboard/matches/LiveFeed';
import { LogoMark } from '@/presentation/components/ui/Logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

const groupRepo = new GroupRepository();
const matchRepo = new MatchRepository();

const CAMPO_MAP: Record<string, { sportType: SportType; playersPerTeam: number; label: string }> = {
  'Futsal 5x5':  { sportType: 'Futsal',  playersPerTeam: 5,  label: 'Futsal 5×5'  },
  'Society 6x6': { sportType: 'Society', playersPerTeam: 6,  label: 'Society 6×6' },
  'Society 7x7': { sportType: 'Society', playersPerTeam: 7,  label: 'Society 7×7' },
  'Campo 11x11': { sportType: 'Campo',   playersPerTeam: 11, label: 'Campo 11×11' },
  'Futsal':      { sportType: 'Futsal',  playersPerTeam: 5,  label: 'Futsal 5×5'  },
  'Society':     { sportType: 'Society', playersPerTeam: 7,  label: 'Society 7×7' },
  'Campo':       { sportType: 'Campo',   playersPerTeam: 11, label: 'Campo 11×11' },
};

export default function LiveMatchPage() {
  const params = useParams();
  const slug = params.slug as string;
  const matchId = params.matchId as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [home, setHome] = useState<Player[]>([]);
  const [away, setAway] = useState<Player[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [status, setStatus] = useState('Agendada');
  const [timer, setTimer] = useState(0);
  const [groupName, setGroupName] = useState('');
  const [copied, setCopied] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Map<string, Player>>(new Map());

  useEffect(() => {
    async function load() {
      const group = await groupRepo.findBySlug(slug);
      if (!group) { setNotFound(true); setLoading(false); return; }
      setGroupName(group.name);

      const { data: m } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
      if (!m) { setNotFound(true); setLoading(false); return; }
      setMatch(m);
      setScore({ home: m.home_score ?? 0, away: m.away_score ?? 0 });
      setStatus(m.status ?? 'Agendada');
      setTimer(m.timer_seconds ?? 0);

      const presence = await matchRepo.getPresence(matchId);
      const pmap = new Map<string, Player>();
      presence.forEach((p: any) => { if (p.player) pmap.set(p.player.id, p.player); });
      setAllPlayers(pmap);
      setHome(presence.filter((p: any) => p.team === 'home' && p.player).map((p: any) => p.player));
      setAway(presence.filter((p: any) => p.team === 'away' && p.player).map((p: any) => p.player));

      const evs = await matchRepo.getEvents(matchId);
      setEvents(evs);
      setLoading(false);
    }
    load();
  }, [slug, matchId]);

  // Realtime: placar/status + eventos
  useEffect(() => {
    if (!matchId) return;
    const subM = matchRepo.subscribeToMatch(matchId, (u: any) => {
      setScore({ home: u.home_score, away: u.away_score });
      setStatus(u.status);
      setTimer(u.timer_seconds ?? 0);
    });
    const subE = matchRepo.subscribeToEvents(matchId, (raw: any) => {
      setEvents(prev => {
        if (prev.some(e => e.id === raw.id)) return prev;
        const player = allPlayers.get(raw.player_id);
        return [{ ...raw, player: player ? { name: player.name } : undefined }, ...prev];
      });
    });
    return () => { supabase.removeChannel(subM); supabase.removeChannel(subE); };
  }, [matchId, allPlayers]);

  const share = () => {
    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020810] flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-3xl" />
    </div>
  );
  if (notFound || !match) return (
    <div className="min-h-screen bg-[#020810] flex flex-col items-center justify-center gap-3">
      <LogoMark size={48} />
      <p className="text-white/50 font-black uppercase tracking-widest text-xs">Partida não encontrada</p>
    </div>
  );

  const campoCfg = CAMPO_MAP[match.field_type ?? match.sport_type ?? 'Society 7x7']
    ?? { sportType: 'Society' as SportType, playersPerTeam: 7, label: 'Society 7×7' };
  const hasTeams = home.length > 0 || away.length > 0;

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-primary">Ao Vivo</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{groupName}</p>
            </div>
          </div>
          <button onClick={share}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(0,180,255,0.1)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(0,180,255,0.3)'}`, color: copied ? '#22c55e' : '#00b4ff' }}>
            <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} />
            {copied ? 'Copiado' : 'Compartilhar'}
          </button>
        </div>

        {/* Campo + placar (broadcast HUD) */}
        {hasTeams ? (
          <div className="flex justify-center mb-6">
            <div style={{ width: '100%', maxWidth: 320 }}>
              <TacticalBoardV2
                homeTeam={home} awayTeam={away}
                homeTeamName={match.home_team_name || 'Time A'}
                awayTeamName={match.away_team_name || 'Time B'}
                homeScore={score.home} awayScore={score.away}
                timer={timer} matchStatus={status as any}
                sportType={campoCfg.sportType} playersPerTeam={campoCfg.playersPerTeam}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl mb-6">
            <p className="text-3xl font-black text-white mb-1">{score.home} <span className="text-white/20">-</span> {score.away}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{status}</p>
          </div>
        )}

        {/* Feed ao vivo */}
        <LiveFeed events={events} homeTeamName={match.home_team_name || 'Time A'} awayTeamName={match.away_team_name || 'Time B'} />

        <p className="text-center mt-8 text-[8px] text-white/15 font-bold uppercase tracking-[0.4em]">
          Transmissão Partidas Pro
        </p>
      </div>
    </div>
  );
}
