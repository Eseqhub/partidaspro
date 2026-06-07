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
import {
  faFutbol, faHandshake, faSquare, faStar, faSpinner, faCheck,
  faClipboardList, faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';

const groupRepo = new GroupRepository();
const matchRepo = new MatchRepository();

const EVENTS: { type: EventType; label: string; icon: any; color: string; emoji: string }[] = [
  { type: 'Gol',             label: 'Gol',        icon: faFutbol,       color: '#ccff00', emoji: '⚽' },
  { type: 'Assistência',     label: 'Assist.',    icon: faHandshake,    color: '#00b4ff', emoji: '🎯' },
  { type: 'Cartão Amarelo',  label: 'Amarelo',    icon: faSquare,       color: '#EAB308', emoji: '🟨' },
  { type: 'Cartão Vermelho', label: 'Vermelho',   icon: faSquare,       color: '#EF4444', emoji: '🟥' },
  { type: 'Craque',          label: 'Craque',     icon: faStar,         color: '#FFD700', emoji: '🏆' },
];

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60), sc = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
};

export default function ArbitroPage() {
  const params  = useParams();
  const slug    = params.slug as string;
  const matchId = params.matchId as string;

  const [loading,   setLoading]   = useState(true);
  const [denied,    setDenied]    = useState(false);
  const [match,     setMatch]     = useState<any>(null);
  const [home,      setHome]      = useState<Player[]>([]);
  const [away,      setAway]      = useState<Player[]>([]);
  const [score,     setScore]     = useState({ home: 0, away: 0 });
  const [picked,    setPicked]    = useState<{ player: Player; team: 'home' | 'away' } | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [refName,   setRefName]   = useState('');
  const [events,    setEvents]    = useState<any[]>([]);
  const [showFeed,  setShowFeed]  = useState(false);
  const lastEventRef = useRef<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const group = await groupRepo.findBySlug(slug);
      if (!group || !user) { setDenied(true); setLoading(false); return; }

      const isOwner  = group.owner_id === user.id;
      const isEditor = isOwner ? true : await groupRepo.isEditor(group.id, user.email || '');
      if (!isOwner && !isEditor) { setDenied(true); setLoading(false); return; }

      // Nome do árbitro: tenta casar pelo email no grupo
      const { data: players } = await supabase
        .from('players').select('name, email').eq('group_id', group.id);
      const matched = players?.find((p: any) => p.email?.toLowerCase() === user.email?.toLowerCase());
      setRefName(
        matched?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] || 'Árbitro',
      );

      const { data: m } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
      if (!m) { setDenied(true); setLoading(false); return; }
      setMatch(m);
      setScore({ home: m.home_score ?? 0, away: m.away_score ?? 0 });

      const presence = await matchRepo.getPresence(matchId);
      setHome(presence.filter((p: any) => p.team === 'home' && p.player).map((p: any) => p.player));
      setAway(presence.filter((p: any) => p.team === 'away' && p.player).map((p: any) => p.player));

      const evs = await matchRepo.getEvents(matchId).catch(() => []);
      setEvents(evs);

      setLoading(false);
    }
    load();
  }, [slug, matchId]);

  // Realtime placar + eventos
  useEffect(() => {
    if (!matchId) return;
    const sub = matchRepo.subscribeToMatch(matchId, (u: any) => {
      setScore({ home: u.home_score, away: u.away_score });
      setMatch((prev: any) => ({ ...prev, ...u }));
    });
    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2000);
  };

  const register = async (type: EventType) => {
    if (!picked || saving) return;
    const key  = `${type}-${picked.player.id}`;
    const now  = Date.now();
    if (lastEventRef.current[key] && now - lastEventRef.current[key] < 10000) {
      showToast('Duplicado ignorado', false);
      setPicked(null); return;
    }
    lastEventRef.current[key] = now;
    setSaving(true);
    try {
      const elapsed = match?.status === 'Em curso' && match?.timer_started_at
        ? Math.floor((match.timer_seconds ?? 0) + (Date.now() - new Date(match.timer_started_at).getTime()) / 1000)
        : (match?.timer_seconds ?? 0);
      const newEv = await matchRepo.addEvent({
        match_id: matchId, player_id: picked.player.id, type, team: picked.team, minute: elapsed,
      });
      setEvents(prev => [{ ...newEv, player: picked.player }, ...prev]);

      if (type === 'Gol') {
        const ns = {
          home: picked.team === 'home' ? score.home + 1 : score.home,
          away: picked.team === 'away' ? score.away + 1 : score.away,
        };
        setScore(ns);
        await matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
      }
      if (match?.group_id) {
        const titles: Record<string, string> = {
          'Gol': '⚽ GOL!', 'Assistência': '🎯 Assistência',
          'Cartão Amarelo': '🟨 Cartão Amarelo', 'Cartão Vermelho': '🟥 Cartão Vermelho',
          'Craque': '🏆 Craque da Partida',
        };
        sendPush({
          groupId: match.group_id, title: titles[type] ?? type,
          body: `${picked.player.name} · ${match.home_team_name || 'Time A'} ${score.home} x ${score.away} ${match.away_team_name || 'Time B'}`,
          url: `/${slug}/ao-vivo/${matchId}`,
        });
      }
      const ev = EVENTS.find(e => e.type === type);
      showToast(`${ev?.emoji ?? ''} ${type} · ${picked.player.name.split(' ')[0]}`);
      setPicked(null);
    } catch (e: any) {
      showToast('Erro: ' + e.message, false);
    } finally {
      setSaving(false);
    }
  };

  // Contagem de eventos por jogador
  const playerEventCount = (pid: string) => events.filter(e => e.player_id === pid).length;

  if (loading) return (
    <div className="min-h-screen bg-[#020810] flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-3xl" />
    </div>
  );
  if (denied) return (
    <div className="min-h-screen bg-[#020810] flex flex-col items-center justify-center gap-3 px-6 text-center">
      <LogoMark size={48} />
      <p className="text-white/60 font-black uppercase tracking-widest text-xs">Acesso restrito</p>
      <p className="text-white/30 text-[10px] uppercase tracking-wider">
        Faça login como organizador ou editor do clube para arbitrar.
      </p>
    </div>
  );

  const homeColor = match.home_color || 'Branco';
  const awayColor = match.away_color || 'Preto';

  return (
    <div style={{ minHeight: '100dvh', background: '#020810', color: '#fff', paddingBottom: picked ? 'calc(200px + env(safe-area-inset-bottom, 0px))' : 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 0' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={22} />
            <div>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#ccff00' }}>
                Mesa / Árbitro
              </p>
              <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                {refName}
              </p>
            </div>
          </div>
          {/* Botão sumula */}
          <button onClick={() => setShowFeed(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', cursor: 'pointer',
              background: showFeed ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showFeed ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: showFeed ? '#A855F7' : 'rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 9, fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: 11 }} />
            Súmula {events.length > 0 && `(${events.length})`}
          </button>
        </div>

        {/* ── Placar ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 14,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 900, textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.home_team_name || 'Time A'}
          </span>
          <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em', flexShrink: 0 }}>
            {score.home}
            <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>·</span>
            {score.away}
          </span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 900, textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
            {match.away_team_name || 'Time B'}
          </span>
        </div>

        {/* ── Súmula inline ──────────────────────────────────────────── */}
        {showFeed && (
          <div style={{ marginBottom: 14, background: 'rgba(168,85,247,0.06)',
            border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(168,85,247,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.2em', color: '#A855F7' }}>📋 Súmula da Partida</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{events.length} eventos</span>
            </div>
            {events.length === 0 ? (
              <p style={{ padding: '16px', textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)',
                fontWeight: 700, textTransform: 'uppercase' }}>Nenhum evento ainda</p>
            ) : (
              <div style={{ maxHeight: 'min(180px, 28vh)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                {events.map((ev: any) => {
                  const meta = EVENTS.find(e => e.type === ev.type);
                  return (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{meta?.emoji ?? '📌'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase',
                          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.player?.name ?? '—'}
                        </span>
                        <span style={{ fontSize: 8, color: meta?.color ?? 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase' }}>
                          {ev.type}
                        </span>
                      </div>
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                        {fmtTime(ev.minute ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Instrução ──────────────────────────────────────────────── */}
        {!picked && (
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 14,
            padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.06)' }}>
            Toque no jogador para registrar um lance
          </p>
        )}

        {/* ── Times ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { players: home, team: 'home' as const, label: match.home_team_name || 'Time A', accent: '#ccff00' },
            { players: away, team: 'away' as const, label: match.away_team_name || 'Time B', accent: '#00b4ff' },
          ]).map(({ players, team, label, accent }) => (
            <div key={team}>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                color: accent, textAlign: 'center', marginBottom: 8,
                padding: '6px 0', background: `${accent}0a`, borderRadius: 6, border: `1px solid ${accent}20` }}>
                {label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {players.map(p => {
                  const sel   = picked?.player.id === p.id;
                  const count = playerEventCount(p.id);
                  const initials = p.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
                  return (
                    <button key={p.id} onClick={() => setPicked(sel ? null : { player: p, team })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px',
                        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        background: sel ? `${accent}20` : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${sel ? accent : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: sel ? `0 0 12px ${accent}44` : 'none',
                        transition: 'all 0.12s',
                      }}>
                      {/* Avatar */}
                      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                        background: sel ? `${accent}22` : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${sel ? accent : 'rgba(255,255,255,0.1)'}` }}>
                        {p.photo_url
                          ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 11, fontWeight: 900, color: sel ? accent : 'rgba(255,255,255,0.4)' }}>{initials}</span>
                        }
                      </div>
                      {/* Nome + posição */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: sel ? accent : '#fff',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                          {p.name}
                        </p>
                        {(p.posicao_principal || p.positions?.[0]) && (
                          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 1 }}>
                            {p.posicao_principal || p.positions?.[0]}
                          </p>
                        )}
                      </div>
                      {/* Badge de eventos */}
                      {count > 0 && (
                        <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4,
                          background: `${accent}20`, color: accent, border: `1px solid ${accent}30`, flexShrink: 0 }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Barra de ação fixa ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'linear-gradient(to top, #050e1f 85%, transparent)',
        paddingTop: 8, paddingLeft: 14, paddingRight: 14,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {picked ? (
            <>
              {/* Jogador selecionado */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', marginBottom: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                <div>
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 1 }}>
                    Lançar para
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#ccff00' }}>
                    {picked.player.name}
                  </p>
                </div>
                <button onClick={() => setPicked(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)', padding: '5px 10px', borderRadius: 6,
                    fontSize: 9, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>
                  Cancelar
                </button>
              </div>
              {/* Botões de evento — maiores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {EVENTS.map(e => (
                  <button key={e.type} onClick={() => register(e.type)} disabled={saving}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '12px 4px', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
                      background: `${e.color}16`, border: `1.5px solid ${e.color}44`, color: e.color,
                      opacity: saving ? 0.5 : 1, transition: 'all 0.12s',
                    }}>
                    <span style={{ fontSize: 20 }}>{e.emoji}</span>
                    <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {e.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '12px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
                ← Selecione um jogador acima
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          padding: '10px 20px', borderRadius: 50, fontWeight: 900, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          background: toast.ok ? '#ccff00' : '#ef4444', color: toast.ok ? '#000' : '#fff',
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}>
          <FontAwesomeIcon icon={toast.ok ? faCheck : faRotateLeft} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
