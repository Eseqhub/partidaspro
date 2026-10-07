'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { Player } from '@/core/entities/player';
import { ScorerEventType, recordScorerEvent, validateScorerToken } from '@/infra/actions/scorerActions';
import { LogoMark } from '@/presentation/components/ui/Logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faHandshake, faSquare, faStar, faSpinner, faCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

const groupRepo = new GroupRepository();
const matchRepo = new MatchRepository();

const EVENTS: { type: ScorerEventType; label: string; emoji: string; color: string }[] = [
  { type: 'Gol', label: 'Gol', emoji: '⚽', color: '#ccff00' },
  { type: 'Assistência', label: 'Assist.', emoji: '🎯', color: '#00b4ff' },
  { type: 'Cartão Amarelo', label: 'Amarelo', emoji: '🟨', color: '#EAB308' },
  { type: 'Cartão Vermelho', label: 'Vermelho', emoji: '🟥', color: '#EF4444' },
  { type: 'Craque', label: 'Craque', emoji: '🏆', color: '#FFD700' },
];

const fmtTime = (s: number) => {
  const total = Math.max(0, Math.floor(s || 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export default function ApontadorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [home, setHome] = useState<Player[]>([]);
  const [away, setAway] = useState<Player[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [picked, setPicked] = useState<{ player: Player; team: 'home' | 'away' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const lastEventRef = useRef<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      try {
        const scorer = await validateScorerToken(token);
        const group = await groupRepo.findBySlug(slug);
        if (!scorer || !group) { setDenied(true); return; }
        const { data: m } = await supabase.from('matches').select('*').eq('id', scorer.match_id).eq('group_id', group.id).maybeSingle();
        if (!m) { setDenied(true); return; }
        setMatch(m);
        setScore({ home: m.home_score ?? 0, away: m.away_score ?? 0 });
        const presence = await matchRepo.getPresence(m.id);
        setHome(presence.filter((p: any) => p.team === 'home' && p.player).map((p: any) => p.player));
        setAway(presence.filter((p: any) => p.team === 'away' && p.player).map((p: any) => p.player));
        setEvents(await matchRepo.getEvents(m.id).catch(() => []));
      } catch { setDenied(true); } finally { setLoading(false); }
    }
    load();
  }, [slug, token]);

  useEffect(() => {
    if (!match?.id) return;
    const subM = matchRepo.subscribeToMatch(match.id, (u: any) => {
      setMatch((prev: any) => ({ ...prev, ...u }));
      setScore({ home: u.home_score ?? 0, away: u.away_score ?? 0 });
    });
    const subE = matchRepo.subscribeToEvents(match.id, async () => {
      setEvents(await matchRepo.getEvents(match.id).catch(() => []));
    });
    return () => { supabase.removeChannel(subM); supabase.removeChannel(subE); };
  }, [match?.id]);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 1800);
  };

  const register = async (type: ScorerEventType) => {
    if (!picked || saving || !match) return;
    const key = `${type}-${picked.player.id}`;
    const now = Date.now();
    if (lastEventRef.current[key] && now - lastEventRef.current[key] < 8000) {
      showToast('Lance duplicado ignorado', false); setPicked(null); return;
    }
    lastEventRef.current[key] = now;
    setSaving(true);
    try {
      const elapsed = match.status === 'Em curso' && match.timer_started_at
        ? Math.floor((match.timer_seconds ?? 0) + (Date.now() - new Date(match.timer_started_at).getTime()) / 1000)
        : (match.timer_seconds ?? 0);
      const result = await recordScorerEvent({ token, playerId: picked.player.id, type, team: picked.team, minute: elapsed });
      setEvents(prev => [{ ...result.event, player: picked.player }, ...prev.filter(e => e.id !== result.event.id)]);
      setScore(result.score);
      showToast(`${type} · ${picked.player.name}`);
      setPicked(null);
    } catch (e: any) {
      showToast(e?.message ?? 'Falha ao registrar', false);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#020810] flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} spin className="text-primary text-3xl" /></div>;
  if (denied || !match) return <div className="min-h-screen bg-[#020810] text-white flex flex-col items-center justify-center p-6 text-center"><LogoMark size={48} /><h1 className="mt-5 text-xl font-black uppercase">Link inválido</h1><p className="mt-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">Apontador inexistente, expirado ou desativado.</p></div>;

  const renderTeam = (players: Player[], teamId: 'home' | 'away', accent: string, label: string) => (
    <div>
      <div className="mb-2 px-2 py-2 rounded-lg text-center border" style={{ color: accent, borderColor: `${accent}30`, background: `${accent}08` }}><span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
      <div className="space-y-1.5">
        {players.map(p => {
          const selected = picked?.player.id === p.id && picked.team === teamId;
          const count = events.filter(e => e.player_id === p.id).length;
          return <button key={p.id} onClick={() => setPicked(selected ? null : { player: p, team: teamId })} className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left" style={{ background: selected ? `${accent}18` : 'rgba(255,255,255,.03)', border: `1.5px solid ${selected ? accent : 'rgba(255,255,255,.07)'}` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: `${accent}12` }}>
              {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-black" style={{ color: accent }}>{p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>}
            </div>
            <span className="flex-1 min-w-0 text-[10px] font-black uppercase text-white truncate">{p.name}</span>
            {count > 0 && <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ color: accent, background: `${accent}18` }}>{count}</span>}
          </button>;
        })}
      </div>
    </div>
  );

  return <div className="min-h-screen bg-[#020810] text-white pb-36">
    <div className="max-w-lg mx-auto px-3 py-5">
      <div className="flex items-center gap-3 mb-5">
        <LogoMark size={30} /><div className="flex-1"><p className="text-[8px] font-black uppercase tracking-[.3em] text-primary">Partidas Pro · Apontador</p><p className="text-[11px] font-black uppercase text-white/50">{match.location || 'Partida'}</p></div>
        <span className="px-2.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest">AO VIVO</span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div><p className="text-[10px] font-black uppercase text-white/50">{match.home_team_name || 'Time A'}</p><p className="text-5xl font-black mt-1">{score.home}</p></div>
          <div className="text-white/20 font-black">×</div>
          <div><p className="text-[10px] font-black uppercase text-white/50">{match.away_team_name || 'Time B'}</p><p className="text-5xl font-black mt-1">{score.away}</p></div>
        </div>
        <p className="text-center mt-3 text-[9px] font-mono text-white/25">{fmtTime(match.timer_seconds ?? 0)} · {match.status}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">{renderTeam(home, 'home', '#ccff00', match.home_team_name || 'Time A')}{renderTeam(away, 'away', '#00b4ff', match.away_team_name || 'Time B')}</div>
      <div className="mt-5 border border-white/5 rounded-xl overflow-hidden"><div className="px-3 py-2 bg-white/[.02] text-[8px] font-black uppercase tracking-widest text-white/25">Últimos lances</div>{events.slice(0, 8).map(e => <div key={e.id} className="px-3 py-2 border-t border-white/5 flex items-center gap-2"><span>{EVENTS.find(x => x.type === e.type)?.emoji || '📌'}</span><span className="text-[10px] font-black uppercase flex-1">{e.player?.name || 'Jogador'}</span><span className="text-[8px] font-mono text-white/25">{fmtTime(e.minute)}</span></div>)}</div>
    </div>
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#050e1f]/95 backdrop-blur border-t border-white/10 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto">{picked ? <><div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10"><div><p className="text-[7px] uppercase tracking-widest text-white/30">Registrar para</p><p className="text-[12px] font-black uppercase text-primary">{picked.player.name}</p></div><button onClick={() => setPicked(null)} className="text-[8px] uppercase font-black text-white/30">Cancelar</button></div><div className="grid grid-cols-5 gap-1.5">{EVENTS.map(e => <button key={e.type} disabled={saving} onClick={() => register(e.type)} className="rounded-xl py-3 flex flex-col items-center gap-1.5 disabled:opacity-40" style={{ color: e.color, background: `${e.color}12`, border: `1px solid ${e.color}35` }}><span className="text-xl">{e.emoji}</span><span className="text-[7px] font-black uppercase">{e.label}</span></button>)}</div></> : <p className="text-center py-2 text-[9px] font-black uppercase tracking-widest text-white/25">Selecione um jogador para registrar o lance</p>}</div>
    </div>
    {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ background: toast.ok ? '#ccff00' : '#ef4444', color: toast.ok ? '#000' : '#fff' }}><FontAwesomeIcon icon={toast.ok ? faCheck : faRotateLeft} className="mr-2" />{toast.text}</div>}
  </div>;
}
