'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { Player } from '@/core/entities/player';
import { EventType } from '@/core/entities/match';
import { LogoMark } from '@/presentation/components/ui/Logo';
import { sendPush } from '@/infra/services/pushClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faHandshake, faSquare, faStar, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';

const groupRepo = new GroupRepository();
const matchRepo = new MatchRepository();

const EVENTS: { type: EventType; label: string; icon: any; color: string }[] = [
  { type: 'Gol',             label: 'Gol',        icon: faFutbol,    color: '#ccff00' },
  { type: 'Assistência',     label: 'Assist.',    icon: faHandshake, color: '#00b4ff' },
  { type: 'Cartão Amarelo',  label: 'Amarelo',    icon: faSquare,    color: '#EAB308' },
  { type: 'Cartão Vermelho', label: 'Vermelho',   icon: faSquare,    color: '#EF4444' },
  { type: 'Craque',          label: 'Craque',     icon: faStar,      color: '#FFD700' },
];

export default function ArbitroPage() {
  const params = useParams();
  const slug = params.slug as string;
  const matchId = params.matchId as string;

  const [loading, setLoading]   = useState(true);
  const [denied, setDenied]     = useState(false);
  const [match, setMatch]       = useState<any>(null);
  const [home, setHome]         = useState<Player[]>([]);
  const [away, setAway]         = useState<Player[]>([]);
  const [score, setScore]       = useState({ home: 0, away: 0 });
  const [picked, setPicked]     = useState<{ player: Player; team: 'home' | 'away' } | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const lastEventRef = useRef<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const group = await groupRepo.findBySlug(slug);
      if (!group || !user) { setDenied(true); setLoading(false); return; }

      // Só owner ou editor podem arbitrar
      const isOwner = group.owner_id === user.id;
      const isEditor = isOwner ? true : await groupRepo.isEditor(group.id, user.email || '');
      if (!isOwner && !isEditor) { setDenied(true); setLoading(false); return; }

      const { data: m } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
      if (!m) { setDenied(true); setLoading(false); return; }
      setMatch(m);
      setScore({ home: m.home_score ?? 0, away: m.away_score ?? 0 });

      const presence = await matchRepo.getPresence(matchId);
      setHome(presence.filter((p: any) => p.team === 'home' && p.player).map((p: any) => p.player));
      setAway(presence.filter((p: any) => p.team === 'away' && p.player).map((p: any) => p.player));
      setLoading(false);
    }
    load();
  }, [slug, matchId]);

  // Realtime do placar
  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToMatch(matchId, (u: any) => {
      setScore({ home: u.home_score, away: u.away_score });
      setMatch((prev: any) => ({ ...prev, ...u }));
    });
    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  const register = async (type: EventType) => {
    if (!picked || saving) return;
    // Anti-duplicado: mesmo jogador + tipo em até 10s é ignorado
    const key = `${type}-${picked.player.id}`;
    const nowMs = Date.now();
    if (lastEventRef.current[key] && nowMs - lastEventRef.current[key] < 10000) {
      setToast('Evento duplicado ignorado'); setTimeout(() => setToast(null), 1500);
      setPicked(null); return;
    }
    lastEventRef.current[key] = nowMs;
    setSaving(true);
    try {
      // Tempo exato do evento em segundos (formatado mm:ss na exibição)
      const elapsedSeconds = match?.status === 'Em curso' && match?.timer_started_at
        ? Math.floor((match.timer_seconds ?? 0) + (Date.now() - new Date(match.timer_started_at).getTime()) / 1000)
        : (match?.timer_seconds ?? 0);
      await matchRepo.addEvent({ match_id: matchId, player_id: picked.player.id, type, team: picked.team, minute: elapsedSeconds });
      if (type === 'Gol') {
        const ns = { home: picked.team === 'home' ? score.home + 1 : score.home, away: picked.team === 'away' ? score.away + 1 : score.away };
        setScore(ns);
        await matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
      }
      // Push para o grupo (app fechado)
      if (match?.group_id) {
        const titles: Record<string, string> = {
          'Gol': '⚽ GOL!', 'Assistência': '🎯 Assistência',
          'Cartão Amarelo': '🟨 Cartão Amarelo', 'Cartão Vermelho': '🟥 Cartão Vermelho',
          'Craque': '🏆 Craque da Partida',
        };
        sendPush({
          groupId: match.group_id,
          title: titles[type] ?? type,
          body: `${picked.player.name} · ${match.home_team_name || 'Time A'} ${score.home} x ${score.away} ${match.away_team_name || 'Time B'}`,
          url: `/${slug}/ao-vivo/${matchId}`,
        });
      }
      setToast(`${type} · ${picked.player.name.split(' ')[0]}`);
      setTimeout(() => setToast(null), 2000);
      setPicked(null);
    } catch (e: any) {
      alert('Erro ao registrar: ' + (e?.message ?? ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#020810] flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} spin className="text-primary text-3xl" /></div>;
  if (denied) return (
    <div className="min-h-screen bg-[#020810] flex flex-col items-center justify-center gap-3 px-6 text-center">
      <LogoMark size={48} />
      <p className="text-white/60 font-black uppercase tracking-widest text-xs">Acesso restrito</p>
      <p className="text-white/30 text-[10px] uppercase tracking-wider">Faça login como organizador ou editor do clube para arbitrar.</p>
    </div>
  );

  const Team = ({ players, team, label, accent }: { players: Player[]; team: 'home' | 'away'; label: string; accent: string }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: accent, textAlign: 'center', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {players.map(p => {
          const sel = picked?.player.id === p.id;
          return (
            <button key={p.id} onClick={() => setPicked({ player: p, team })}
              style={{ padding: '10px 8px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                background: sel ? `${accent}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sel ? accent : 'rgba(255,255,255,0.08)'}`,
                color: sel ? accent : '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020810] text-white pb-40">
      <div className="max-w-md mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <LogoMark size={24} />
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-primary">Modo Árbitro</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Registrar lances</p>
          </div>
        </div>

        {/* Placar */}
        <div className="flex items-center justify-center gap-4 py-3 mb-4 rounded-xl bg-white/[0.03] border border-white/8">
          <span className="text-[10px] font-black uppercase text-white/60 truncate max-w-[90px]">{match.home_team_name || 'Time A'}</span>
          <span className="text-2xl font-black tabular-nums">{score.home} <span className="text-white/20">-</span> {score.away}</span>
          <span className="text-[10px] font-black uppercase text-white/60 truncate max-w-[90px]">{match.away_team_name || 'Time B'}</span>
        </div>

        {/* Times */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Team players={home} team="home" label={match.home_team_name || 'Time A'} accent="#ccff00" />
          <Team players={away} team="away" label={match.away_team_name || 'Time B'} accent="#00b4ff" />
        </div>
      </div>

      {/* Barra de ação fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#050e1f] border-t border-white/10 p-3">
        <div className="max-w-md mx-auto">
          {picked ? (
            <>
              <p className="text-center text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
                Lance de <span className="text-primary">{picked.player.name}</span>
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {EVENTS.map(e => (
                  <button key={e.type} onClick={() => register(e.type)} disabled={saving}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-lg"
                    style={{ background: `${e.color}14`, border: `1px solid ${e.color}40`, color: e.color }}>
                    <FontAwesomeIcon icon={e.icon} className="text-sm" />
                    <span className="text-[7px] font-black uppercase">{e.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-white/25 py-3">
              Toque num jogador para registrar um lance
            </p>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-primary text-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <FontAwesomeIcon icon={faCheck} /> {toast}
        </div>
      )}
    </div>
  );
}
