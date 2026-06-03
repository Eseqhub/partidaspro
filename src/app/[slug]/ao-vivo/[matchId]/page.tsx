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
import { faShareNodes, faCheck, faSpinner, faComment, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { filterProfanity } from '@/core/services/profanityFilter';

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
  // Chat de espectadores
  const [comments, setComments] = useState<any[]>([]);
  const [specName, setSpecName] = useState('');
  const [commentText, setCommentText] = useState('');

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
      const cmts = await matchRepo.getComments(matchId).catch(() => []);
      setComments(cmts);
      setLoading(false);
    }
    load();
    try { const n = localStorage.getItem('pp_spectator_name'); if (n) setSpecName(n); } catch { /* ignore */ }
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
    const subC = matchRepo.subscribeToComments(matchId, (raw: any) => {
      setComments(prev => prev.some(c => c.id === raw.id) ? prev : [raw, ...prev]);
    });
    return () => { supabase.removeChannel(subM); supabase.removeChannel(subE); supabase.removeChannel(subC); };
  }, [matchId, allPlayers]);

  const sendComment = async () => {
    const text = filterProfanity(commentText.trim());
    const name = specName.trim();
    if (!text) return;
    if (!name) { alert('Digite seu nome para comentar.'); return; }
    try { localStorage.setItem('pp_spectator_name', name); } catch { /* ignore */ }
    try {
      const newC = await matchRepo.addComment({ match_id: matchId, author_name: `${name} 👀`, message: text });
      setComments(prev => prev.some(c => c.id === newC.id) ? prev : [newC, ...prev]);
      setCommentText('');
    } catch (e: any) {
      alert('Erro ao comentar: ' + (e?.message ?? ''));
    }
  };

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

        {/* Chat de espectadores */}
        <div className="mt-6 border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <FontAwesomeIcon icon={faComment} className="text-violet-400" style={{ fontSize: 9 }} /> Torcida ao vivo
            </h4>
            <span className="text-[8px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded">{comments.length}</span>
          </div>

          {/* Envio */}
          <div className="px-3 py-2.5 border-b border-white/5 space-y-2">
            <input
              value={specName}
              onChange={e => setSpecName(e.target.value)}
              maxLength={20}
              placeholder="Seu nome"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-violet-400/40"
            />
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendComment(); }}
                maxLength={240}
                placeholder="Manda a torcida..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-violet-400/40"
              />
              <button onClick={sendComment} disabled={!commentText.trim() || !specName.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-300 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-30">
                <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 11 }} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-center py-8 text-[9px] font-black text-white/10 uppercase tracking-widest">Seja o primeiro a torcer</p>
            ) : comments.map((c: any) => (
              <div key={c.id} className="px-4 py-2.5 border-b border-white/[0.04]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-violet-300 flex-shrink-0">{c.author_name}</span>
                  <span className="text-[7px] font-bold text-white/20 flex-shrink-0">
                    {c.created_at ? new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-[12px] text-white/80 mt-0.5 break-words">{c.message}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center mt-8 text-[8px] text-white/15 font-bold uppercase tracking-[0.4em]">
          Transmissão Partidas Pro
        </p>
      </div>
    </div>
  );
}
