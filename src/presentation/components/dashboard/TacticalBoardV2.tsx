'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player } from '@/core/entities/player';

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface TacticalBoardV2Props {
  homeTeam: Player[];
  awayTeam: Player[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  timer?: number;
  matchStatus?: 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';
  sportType?: 'Futsal' | 'Society' | 'Campo';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getLineLimit = (sport: string) => {
  if (sport === 'Futsal') return 5;
  if (sport === 'Campo') return 11;
  return 7; // Society
};

const FORMATIONS: Record<string, number[][]> = {
  Futsal: [[1], [2], [1]],       // 1-2-1
  Society: [[1], [2], [3], [1]], // 1-2-3-1 (GK, DEF, MID, ATK)
  Campo:   [[1], [4], [3], [3]], // 1-4-3-3
};

/**
 * Retorna coordenadas percentuais (x, y) para cada posição no campo.
 * Campo renderizado de baixo (GK) para cima (ataque).
 */
const getFormationCoords = (
  index: number,
  total: number,
  sport: string
): { x: number; y: number } => {
  if (index === 0) return { x: 50, y: 88 }; // Goleiro na base

  const rows = FORMATIONS[sport] ?? FORMATIONS.Society;
  // Flatten: cada row pode ter N jogadores
  const slots: { row: number; posInRow: number; rowCount: number }[] = [];
  rows.forEach((rowDef, ri) => {
    const count = rowDef[0];
    for (let p = 0; p < count; p++) {
      slots.push({ row: ri, posInRow: p, rowCount: count });
    }
  });

  const slot = slots[index - 1]; // index 0 é GK, restante nos slots
  if (!slot) return { x: 50, y: 50 };

  const totalRows = rows.length;
  // Y: distribui de 72% (1ª linha de campo) a 20% (ataque)
  const y = 72 - (slot.row / (totalRows - 1)) * 58;
  // X: distribui horizontalmente
  const xStep = 80 / (slot.rowCount + 1);
  const x = xStep * (slot.posInRow + 1) + 10;

  return { x, y };
};

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─── PlayerNodeV2 ─────────────────────────────────────────────────────────────
interface PlayerNodeV2Props {
  player: Player;
  x: number;
  y: number;
  shirtNumber: number;
  isReserve?: boolean;
}

const PlayerNodeV2: React.FC<PlayerNodeV2Props> = ({ player, x, y, shirtNumber }) => {
  const shortName = player.name.split(' ')[0].substring(0, 12).toUpperCase();
  const mainPos = (player.positions?.[0] ?? 'SA').toUpperCase();
  const rating = (player.rating ?? 3.0).toFixed(1);

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20 group"
      style={{ left: `${x}%`, top: `${y}%`, transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {/* Radial glow sob o jogador */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 56, height: 56,
          background: 'radial-gradient(circle, rgba(0,180,255,0.25) 0%, transparent 70%)',
          filter: 'blur(6px)',
          transform: 'translateY(4px)',
        }}
      />

      {/* Rating Badge — acima da foto */}
      <div
        className="mb-1 px-1.5 py-0.5 text-[9px] font-black tracking-wider z-10"
        style={{
          background: 'linear-gradient(135deg, #d4a017 0%, #f5d060 50%, #c8860a 100%)',
          color: '#000',
          borderRadius: 2,
          boxShadow: '0 0 8px rgba(212,160,23,0.6)',
        }}
      >
        {rating}
      </div>

      {/* Foto / Avatar */}
      <div
        className="relative"
        style={{
          width: 52, height: 52,
          borderRadius: '50%',
          border: '2.5px solid rgba(0,180,255,0.8)',
          boxShadow: '0 0 14px rgba(0,180,255,0.5), inset 0 0 6px rgba(0,180,255,0.15)',
          overflow: 'hidden',
          background: '#0a1628',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(160deg, #0a2040 0%, #071428 100%)' }}
          >
            {/* Silhueta genérica */}
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,180,255,0.25)', marginBottom: 2 }} />
            <div style={{ width: 28, height: 14, borderRadius: '40% 40% 0 0', background: 'rgba(0,180,255,0.2)' }} />
          </div>
        )}

        {/* Número da camisa — canto inferior direito */}
        <div
          className="absolute bottom-0 right-0 text-[8px] font-black leading-none"
          style={{
            background: 'linear-gradient(135deg, #0057b8 0%, #003d82 100%)',
            color: '#fff',
            padding: '2px 4px',
            borderTopLeftRadius: 4,
          }}
        >
          #{shirtNumber}
        </div>
      </div>

      {/* Nome + Posição */}
      <div
        className="mt-1.5 flex flex-col items-center"
        style={{ maxWidth: 72 }}
      >
        <div
          className="px-2 py-0.5 text-center"
          style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(0,180,255,0.3)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span
            className="text-[8px] font-black uppercase tracking-widest leading-none"
            style={{ color: '#fff', textShadow: '0 0 8px rgba(0,180,255,0.5)' }}
          >
            {shortName}
          </span>
        </div>
        <span
          className="text-[7px] font-black uppercase mt-0.5"
          style={{ color: 'rgba(0,180,255,0.7)', letterSpacing: '0.15em' }}
        >
          {mainPos}
        </span>
      </div>
    </div>
  );
};

// ─── ReserveNodeV2 ───────────────────────────────────────────────────────────
const ReserveNodeV2: React.FC<{ player: Player; shirtNumber: number }> = ({ player, shirtNumber }) => {
  const shortName = player.name.split(' ')[0].substring(0, 10).toUpperCase();
  const rating = (player.rating ?? 3.0).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1 group" style={{ minWidth: 44 }}>
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1.5px solid rgba(0,180,255,0.3)',
          overflow: 'hidden',
          background: '#0a1628',
          opacity: 0.65,
        }}
      >
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] font-black" style={{ color: 'rgba(0,180,255,0.3)' }}>
            {shirtNumber}
          </div>
        )}
      </div>
      <span className="text-[7px] font-bold uppercase truncate text-center" style={{ color: 'rgba(255,255,255,0.3)', maxWidth: 44 }}>
        {shortName}
      </span>
      <span className="text-[6px] font-black" style={{ color: 'rgba(212,160,23,0.6)' }}>{rating}</span>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export const TacticalBoardV2: React.FC<TacticalBoardV2Props> = ({
  homeTeam,
  awayTeam,
  homeTeamName = 'MANDANTE',
  awayTeamName = 'VISITANTE',
  homeScore = 0,
  awayScore = 0,
  timer = 0,
  matchStatus = 'Agendada',
  sportType = 'Society',
}) => {
  const [viewingTeam, setViewingTeam] = useState<'home' | 'away'>('home');
  const [flare1, setFlare1] = useState({ x: 15, y: 20 });
  const [flare2, setFlare2] = useState({ x: 82, y: 75 });
  const limit = getLineLimit(sportType);

  // Anima leve drift dos lens flares
  useEffect(() => {
    const id = setInterval(() => {
      setFlare1({ x: 10 + Math.random() * 10, y: 10 + Math.random() * 20 });
      setFlare2({ x: 75 + Math.random() * 10, y: 65 + Math.random() * 20 });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const activeTeam = viewingTeam === 'home' ? homeTeam : awayTeam;
  const activeTeamName = viewingTeam === 'home' ? homeTeamName : awayTeamName;
  const starters = activeTeam.slice(0, limit);
  const reserves = activeTeam.slice(limit);

  const stats = useMemo(() => {
    if (!activeTeam.length) return { avg: 0, best: null as Player | null };
    const avg = activeTeam.reduce((a, p) => a + (p.rating ?? 3), 0) / activeTeam.length;
    const best = [...activeTeam].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
    return { avg, best };
  }, [activeTeam]);

  // ── Paleta broadcast ──────────────────────────────────────────────────────
  const neonBlue = '#00b4ff';
  const gold = '#d4a017';
  const goldLight = '#f5d060';
  const fieldGreen = '#0c2d1a';
  const fieldGreenMid = '#0a2616';

  return (
    <div className="w-full flex flex-col items-center select-none" style={{ fontFamily: 'inherit' }}>

      {/* ── BROADCAST HEADER ───────────────────────────────────────────────── */}
      <div
        className="w-full max-w-2xl mb-4 flex items-center justify-between px-4 py-2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,12,30,0.95) 50%, rgba(0,0,0,0.95) 100%)',
          borderBottom: `1.5px solid ${gold}`,
          borderTop: `1.5px solid rgba(0,180,255,0.3)`,
        }}
      >
        {/* Placar esquerdo */}
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1"
            style={{ background: 'rgba(0,180,255,0.1)', border: `1px solid ${neonBlue}40` }}
          >
            <div className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: `${neonBlue}99` }}>
              {homeTeamName.substring(0, 14)}
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: homeScore > awayScore ? gold : '#fff', lineHeight: 1 }}>
              {homeScore} <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span> {awayScore}
            </div>
          </div>
        </div>

        {/* Título central */}
        <div className="flex flex-col items-center">
          <h1 className="text-base md:text-xl font-black uppercase tracking-tighter" style={{ color: '#fff' }}>
            MINHA PELADA <span style={{ color: gold, textShadow: `0 0 12px ${gold}` }}>PRO</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="h-[1px] w-6" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
            <span className="text-[7px] font-black uppercase tracking-[0.25em]" style={{ color: `${neonBlue}80` }}>
              HUD DE ESCALAÇÃO PROFISSIONAL | {sportType} {limit}x{limit}
            </span>
            <div className="h-[1px] w-6" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
          </div>
        </div>

        {/* Timer direito */}
        <div
          className="px-3 py-1 text-right"
          style={{ border: `1px solid ${neonBlue}30`, background: 'rgba(0,20,50,0.6)' }}
        >
          <div className="text-xl font-black font-mono tabular-nums" style={{ color: matchStatus === 'Em curso' ? gold : neonBlue }}>
            {formatTimer(timer)}
          </div>
          <div className="text-[7px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {matchStatus.toUpperCase()}
          </div>
        </div>

        {/* Borda animada (scanline) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.04) 50%, transparent 100%)',
            animation: 'hud-scan-h 4s linear infinite',
          }}
        />
      </div>

      {/* ── SELETOR DE TIMES ───────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 p-0.5" style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid rgba(0,180,255,0.1)` }}>
        {([['home', homeTeamName], ['away', awayTeamName]] as const).map(([side, name]) => (
          <button
            key={side}
            onClick={() => setViewingTeam(side)}
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
            style={viewingTeam === side
              ? { background: `linear-gradient(135deg, ${neonBlue}22, ${gold}22)`, color: gold, borderBottom: `2px solid ${gold}`, boxShadow: `0 0 12px ${gold}22` }
              : { color: 'rgba(255,255,255,0.3)' }
            }
          >
            {name}
          </button>
        ))}
      </div>

      {/* ── LABEL TIME ATIVO ───────────────────────────────────────────────── */}
      <div
        className="w-full max-w-2xl mb-3 py-2 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(0,180,255,0.06), transparent)`,
          borderTop: `1px solid ${neonBlue}30`,
          borderBottom: `1px solid ${neonBlue}30`,
        }}
      >
        <h2
          className="text-base md:text-xl font-black uppercase tracking-[0.2em]"
          style={{ color: '#fff', textShadow: `0 0 20px ${neonBlue}40` }}
        >
          {activeTeamName}
        </h2>
      </div>

      {/* ── CAMPO TÁTICO ───────────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-2xl overflow-hidden"
        style={{ aspectRatio: '16/10' }}
      >
        {/* BORDA ANIMADA (neon pulse) */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            border: `2px solid ${neonBlue}`,
            boxShadow: `0 0 18px ${neonBlue}40, inset 0 0 18px ${neonBlue}15`,
            animation: 'border-glow-blue 3s ease-in-out infinite',
          }}
        />
        {/* Cantoneiras douradas */}
        {[
          { top: -1, left: -1, borderWidth: '3px 0 0 3px' },
          { top: -1, right: -1, borderWidth: '3px 3px 0 0' },
          { bottom: -1, left: -1, borderWidth: '0 0 3px 3px' },
          { bottom: -1, right: -1, borderWidth: '0 3px 3px 0' },
        ].map((style, i) => (
          <div key={i} className="absolute w-5 h-5 pointer-events-none z-40" style={{ ...style, borderStyle: 'solid', borderColor: gold }} />
        ))}

        {/* GRAMADO */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${fieldGreen} 0%, ${fieldGreenMid} 50%, #071e10 100%)`,
          }}
        >
          {/* Listras do gramado */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-x-0"
              style={{
                top: `${i * 12.5}%`,
                height: '12.5%',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              }}
            />
          ))}

          {/* Iluminação lateral azul (refletores) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 40% 50% at 0% 50%, rgba(0,100,255,0.18) 0%, transparent 70%),
                           radial-gradient(ellipse 40% 50% at 100% 50%, rgba(0,100,255,0.18) 0%, transparent 70%),
                           radial-gradient(ellipse 60% 30% at 50% 0%, rgba(0,180,255,0.08) 0%, transparent 60%)`,
            }}
          />

          {/* Iluminação central dourada suave */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 50% 40% at 50% 55%, rgba(212,160,23,0.06) 0%, transparent 70%)`,
            }}
          />

          {/* ── LINHAS DO CAMPO ──────────────────────────────── */}
          {/* Borda interna */}
          <div
            className="absolute"
            style={{
              top: '5%', left: '4%', right: '4%', bottom: '5%',
              border: `1.5px solid rgba(0,180,255,0.5)`,
              boxShadow: `0 0 8px rgba(0,180,255,0.2)`,
            }}
          />

          {/* Linha do meio campo */}
          <div
            className="absolute"
            style={{
              top: '5%', bottom: '5%', left: '50%',
              width: 1.5,
              transform: 'translateX(-50%)',
              background: `rgba(0,180,255,0.5)`,
              boxShadow: `0 0 6px rgba(0,180,255,0.3)`,
            }}
          />

          {/* Círculo central */}
          <div
            className="absolute"
            style={{
              width: '22%', aspectRatio: '1',
              borderRadius: '50%',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              border: `1.5px solid rgba(0,180,255,0.45)`,
              boxShadow: `0 0 10px rgba(0,180,255,0.2), inset 0 0 10px rgba(0,180,255,0.05)`,
            }}
          />

          {/* Área grande (ataque — topo) */}
          <div
            className="absolute"
            style={{
              top: '5%', left: '22%', right: '22%', height: '22%',
              border: `1.5px solid rgba(0,180,255,0.4)`,
              borderTop: 'none',
              boxShadow: `0 0 6px rgba(0,180,255,0.15)`,
            }}
          />

          {/* Área pequena (goleiro — base) */}
          <div
            className="absolute"
            style={{
              bottom: '5%', left: '36%', right: '36%', height: '14%',
              border: `1.5px solid rgba(0,180,255,0.35)`,
              borderBottom: 'none',
              boxShadow: `0 0 5px rgba(0,180,255,0.1)`,
            }}
          />

          {/* Ponto central */}
          <div
            className="absolute rounded-full"
            style={{
              width: 5, height: 5,
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              background: `rgba(0,180,255,0.7)`,
              boxShadow: `0 0 6px ${neonBlue}`,
            }}
          />
        </div>

        {/* ── LENS FLARES ────────────────────────────────────── */}
        {/* Flare 1 — canto superior esquerdo */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: `${flare1.x}%`,
            top: `${flare1.y}%`,
            transition: 'left 3s ease-in-out, top 3s ease-in-out',
          }}
        >
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.35) 0%, transparent 70%)', filter: 'blur(8px)', transform: 'translate(-50%,-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 120, height: 3, background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)', transform: 'translate(-50%,-50%) rotate(-30deg)', filter: 'blur(2px)' }} />
        </div>

        {/* Flare 2 — canto inferior direito */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: `${flare2.x}%`,
            top: `${flare2.y}%`,
            transition: 'left 3s ease-in-out, top 3s ease-in-out',
          }}
        >
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)', filter: 'blur(10px)', transform: 'translate(-50%,-50%)' }} />
        </div>

        {/* Flare 3 — reflexo de refletor (topo direito fixo) */}
        <div
          className="absolute pointer-events-none z-10"
          style={{ top: '2%', right: '8%' }}
        >
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(5px)' }} />
        </div>
        <div
          className="absolute pointer-events-none z-10"
          style={{ top: '2%', left: '8%' }}
        >
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(5px)' }} />
        </div>

        {/* ── JOGADORES NO CAMPO ──────────────────────────────── */}
        {starters.map((player, i) => {
          const { x, y } = getFormationCoords(i, starters.length, sportType);
          return (
            <PlayerNodeV2
              key={player.id}
              player={player}
              x={x}
              y={y}
              shirtNumber={i + 1}
            />
          );
        })}

        {/* Overlay de scanline broadcast */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
          }}
        />
      </div>

      {/* ─── HUD FOOTER STATS ─────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl mt-4 grid grid-cols-2 gap-3">
        {/* Média */}
        <div
          className="relative overflow-hidden p-3"
          style={{
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid rgba(0,180,255,0.2)`,
            borderLeft: `3px solid ${neonBlue}`,
          }}
        >
          <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            OPÇÕES DE TIME: <span style={{ color: gold }}>SORTEIO INTELIGENTE</span>
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black italic" style={{ color: '#fff' }}>{stats.avg.toFixed(1)}</span>
            <span className="text-[8px] font-black mb-1" style={{ color: `${neonBlue}80` }}>/10</span>
            <span className="text-[8px] font-black uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>MÉDIA DO TIME</span>
          </div>
        </div>

        {/* Destaque */}
        <div
          className="relative overflow-hidden p-3"
          style={{
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid rgba(212,160,23,0.2)`,
            borderLeft: `3px solid ${gold}`,
          }}
        >
          <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            JOGADOR DESTAQUE
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase italic truncate" style={{ color: '#fff' }}>
              {stats.best?.name.split(' ')[0] ?? '---'}
            </span>
            <div className="px-2 py-0.5 text-[8px] font-black" style={{ background: `${gold}22`, border: `1px solid ${gold}44`, color: gold }}>
              {stats.best ? `${(stats.best.rating ?? 0).toFixed(1)}` : '---'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BANCO DE RESERVAS ────────────────────────────────────────────── */}
      {reserves.length > 0 && (
        <div
          className="w-full max-w-2xl mt-6 py-4 px-4"
          style={{ borderTop: `1px solid rgba(0,180,255,0.1)`, borderBottom: `1px solid rgba(0,180,255,0.1)` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              BANCO ({reserves.length})
            </span>
            <div className="flex-1 h-[1px]" style={{ background: 'rgba(0,180,255,0.1)' }} />
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {reserves.map((p, i) => (
              <ReserveNodeV2 key={p.id} player={p} shirtNumber={limit + i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* ─── BROADCAST WATERMARK ─────────────────────────────────────────── */}
      <div className="mt-6 flex items-center gap-3" style={{ opacity: 0.25 }}>
        <div className="h-[1px] w-12" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
        <span className="text-[7px] font-black uppercase tracking-[0.4em]" style={{ color: gold }}>
          BROADCAST PRO HUD v2.0
        </span>
        <div className="h-[1px] w-12" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
      </div>

      {/* ─── KEYFRAMES INLINE ────────────────────────────────────────────── */}
      <style>{`
        @keyframes border-glow-blue {
          0%, 100% { box-shadow: 0 0 18px rgba(0,180,255,0.4), inset 0 0 18px rgba(0,180,255,0.1); border-color: rgba(0,180,255,0.9); }
          50%       { box-shadow: 0 0 32px rgba(0,180,255,0.7), 0 0 60px rgba(0,180,255,0.2), inset 0 0 24px rgba(0,180,255,0.15); border-color: rgba(0,180,255,1); }
        }
        @keyframes hud-scan-h {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
