'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player } from '@/core/entities/player';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
type SportKey = 'Futsal' | 'Society' | 'Campo';

export interface TacticalBoardV2Props {
  homeTeam: Player[];
  awayTeam: Player[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  timer?: number;
  matchStatus?: 'Agendada' | 'Em curso' | 'Pausada' | 'Finalizada';
  sportType?: SportKey;
  playersPerTeam?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO POR MODALIDADE
// fieldW / fieldH: dimensões reais em metros (usadas como viewBox do SVG)
// maxW: largura máx em pixels na tela (altura = maxW * fieldH / fieldW)
// limit: nº de titulares
// ─────────────────────────────────────────────────────────────────────────────
interface FieldCfg {
  fieldW: number; fieldH: number;
  maxW: number;
  limit: number;
  // medidas das áreas em metros
  bigBoxW: number; bigBoxH: number;
  smallBoxW: number; smallBoxH: number;
  goalW: number;
  circleR: number;
  penaltyY: number; // distância do gol até o ponto de pênalti
}

const getFieldCfg = (sport: SportKey, ppt: number): FieldCfg => {
  const limit = sport === 'Futsal' ? Math.min(ppt, 5)
              : sport === 'Campo'  ? Math.min(ppt, 11)
              : Math.min(ppt, 7);
  if (sport === 'Futsal') return {
    fieldW: 20, fieldH: 40, maxW: 190, limit,
    bigBoxW: 10, bigBoxH: 6, smallBoxW: 6, smallBoxH: 3,
    goalW: 3, circleR: 3, penaltyY: 6,
  };
  if (sport === 'Campo') return {
    fieldW: 68, fieldH: 105, maxW: 260, limit,
    bigBoxW: 40.32, bigBoxH: 16.5, smallBoxW: 18.32, smallBoxH: 5.5,
    goalW: 7.32, circleR: 9.15, penaltyY: 11,
  };
  // Society — varia conforme nº de jogadores
  const isSmall = limit <= 5;
  const isMid   = limit === 6;
  return {
    fieldW: isSmall ? 25 : isMid ? 28 : 30,
    fieldH: isSmall ? 42 : isMid ? 46 : 50,
    maxW: isSmall ? 195 : isMid ? 215 : 235,
    limit,
    bigBoxW: isSmall ? 13 : isMid ? 15 : 16,
    bigBoxH: isSmall ? 7  : isMid ? 8  : 9,
    smallBoxW: isSmall ? 7 : 9, smallBoxH: 4,
    goalW: 5, circleR: 4, penaltyY: 7,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAPA DE POSIÇÕES → coordenadas táticas (% do campo, Y: 0=gol adversário topo)
// ─────────────────────────────────────────────────────────────────────────────
const POS_MAP: Record<string, { y: number; xBase: number }> = {
  G:   { y: 91, xBase: 50 },
  ZAG: { y: 75, xBase: 50 },
  ZGD: { y: 75, xBase: 63 }, ZGE: { y: 75, xBase: 37 },
  LD:  { y: 65, xBase: 85 }, LE:  { y: 65, xBase: 15 },
  VOL: { y: 57, xBase: 50 },
  MC:  { y: 48, xBase: 50 },
  MD:  { y: 48, xBase: 70 }, ME:  { y: 48, xBase: 30 },
  MO:  { y: 37, xBase: 50 },
  PD:  { y: 26, xBase: 80 }, PE:  { y: 26, xBase: 20 },
  SA:  { y: 18, xBase: 50 },
  CA:  { y: 10, xBase: 50 },
};
const FALLBACK = { y: 50, xBase: 50 };

// Distribui múltiplos jogadores na mesma posição tática
// Agrupa somente jogadores com MESMO y E MESMO xBase (mesma função tática)
const computeCoords = (players: Player[]) => {
  const mapped = players.map(p => {
    const pos = p.positions?.[0] ?? 'MO';
    const pm  = POS_MAP[pos] ?? FALLBACK;
    return { player: p, y: pm.y, xBase: pm.xBase, pos };
  });

  // Agrupa por posição exata (mesmo y + xBase) — evita misturar ZAG com ZGD/ZGE
  const groups = new Map<string, typeof mapped>();
  mapped.forEach(item => {
    const key = `${item.y}_${item.xBase}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });

  const result: { player: Player; x: number; y: number }[] = [];
  groups.forEach(group => {
    if (group.length === 1) {
      result.push({ player: group[0].player, x: group[0].xBase, y: group[0].y });
    } else {
      // Múltiplos jogadores na mesma função: espalha lateralmente de forma simétrica
      const spread = Math.min(28, group.length * 10);
      const step   = spread / (group.length - 1 || 1);
      const startX = group[0].xBase - spread / 2;
      group.forEach((item, i) =>
        result.push({
          player: item.player,
          x: group.length === 1 ? item.xBase : startX + step * i,
          y: item.y,
        })
      );
    }
  });
  return result;
};

const fmtTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

// ─────────────────────────────────────────────────────────────────────────────
// SVG DE LINHAS DO CAMPO (usa metros reais como viewBox → sem distorção)
// ─────────────────────────────────────────────────────────────────────────────
const FieldSVG: React.FC<{ cfg: FieldCfg; sport: SportKey }> = ({ cfg, sport }) => {
  const { fieldW: W, fieldH: H, bigBoxW, bigBoxH, smallBoxW, smallBoxH,
          goalW, circleR, penaltyY } = cfg;
  const cx = W / 2;
  const cy = H / 2;
  const blue      = 'rgba(0,180,255,0.65)';
  const blueFaint = 'rgba(0,180,255,0.32)';
  const sw = W * 0.012;

  // Área semicircular do Futsal (raio = bigBoxH, centrada no gol)
  const futsalArcR = bigBoxH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
    >
      <defs>
        <filter id="fglow2">
          <feGaussianBlur stdDeviation={W * 0.014} result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>

      {/* Borda do campo */}
      <rect x={W*0.03} y={H*0.015} width={W*0.94} height={H*0.97}
        fill="none" stroke={blue} strokeWidth={sw*1.5} filter="url(#fglow2)" />

      {/* Linha de meio-campo */}
      <line x1={W*0.03} y1={cy} x2={W*0.97} y2={cy}
        stroke={blueFaint} strokeWidth={sw} />

      {/* Círculo central */}
      <circle cx={cx} cy={cy} r={circleR}
        fill="none" stroke={blueFaint} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={sw * 0.9} fill="rgba(0,180,255,0.75)" />

      {/* === ÁREA ADVERSÁRIA (topo) === */}
      {sport === 'Futsal' ? (
        <>
          {/* Futsal: semicírculo de área */}
          <path
            d={`M ${cx - futsalArcR} ${H * 0.015}
                A ${futsalArcR} ${futsalArcR} 0 0 1 ${cx + futsalArcR} ${H * 0.015}`}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.9}
          />
          {/* Área pequena (retângulo do goleiro no futsal) */}
          <rect
            x={cx - smallBoxW / 2} y={H * 0.015}
            width={smallBoxW} height={smallBoxH}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.7}
          />
          {/* Ponto de penalti */}
          <circle cx={cx} cy={H * 0.015 + penaltyY} r={sw * 0.7} fill={blueFaint} />
          {/* Ponto de penalti duplo (futsal: 10m) */}
          <circle cx={cx} cy={H * 0.015 + penaltyY * 1.65} r={sw * 0.5} fill={`${blueFaint.replace('0.32','0.2')}`} />
        </>
      ) : (
        <>
          <rect
            x={cx - bigBoxW / 2} y={H * 0.015}
            width={bigBoxW} height={bigBoxH}
            fill="none" stroke={blueFaint} strokeWidth={sw}
          />
          <rect
            x={cx - smallBoxW / 2} y={H * 0.015}
            width={smallBoxW} height={smallBoxH}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.8}
          />
          <circle cx={cx} cy={H * 0.015 + penaltyY} r={sw * 0.7} fill={blueFaint} />
          <path
            d={`M ${cx - circleR * 0.92} ${H * 0.015 + bigBoxH}
                A ${circleR} ${circleR} 0 0 1 ${cx + circleR * 0.92} ${H * 0.015 + bigBoxH}`}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.7}
          />
        </>
      )}

      {/* === ÁREA DO GOLEIRO (base) === */}
      {sport === 'Futsal' ? (
        <>
          <path
            d={`M ${cx - futsalArcR} ${H * 0.985}
                A ${futsalArcR} ${futsalArcR} 0 0 0 ${cx + futsalArcR} ${H * 0.985}`}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.9}
          />
          <rect
            x={cx - smallBoxW / 2} y={H * 0.985 - smallBoxH}
            width={smallBoxW} height={smallBoxH}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.7}
          />
          <circle cx={cx} cy={H * 0.985 - penaltyY} r={sw * 0.7} fill={blueFaint} />
          <circle cx={cx} cy={H * 0.985 - penaltyY * 1.65} r={sw * 0.5} fill={`${blueFaint.replace('0.32','0.2')}`} />
        </>
      ) : (
        <>
          <rect
            x={cx - bigBoxW / 2} y={H * 0.985 - bigBoxH}
            width={bigBoxW} height={bigBoxH}
            fill="none" stroke={blueFaint} strokeWidth={sw}
          />
          <rect
            x={cx - smallBoxW / 2} y={H * 0.985 - smallBoxH}
            width={smallBoxW} height={smallBoxH}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.8}
          />
          <circle cx={cx} cy={H * 0.985 - penaltyY} r={sw * 0.7} fill={blueFaint} />
          <path
            d={`M ${cx - circleR * 0.92} ${H * 0.985 - bigBoxH}
                A ${circleR} ${circleR} 0 0 0 ${cx + circleR * 0.92} ${H * 0.985 - bigBoxH}`}
            fill="none" stroke={blueFaint} strokeWidth={sw * 0.7}
          />
        </>
      )}

      {/* Traves */}
      <line x1={cx - goalW/2} y1={H*0.015} x2={cx + goalW/2} y2={H*0.015}
        stroke={blue} strokeWidth={sw * 2.2} />
      <line x1={cx - goalW/2} y1={H*0.985} x2={cx + goalW/2} y2={H*0.985}
        stroke={blue} strokeWidth={sw * 2.2} />

      {/* Arcos de canto (Campo) */}
      {sport === 'Campo' && (
        <>
          <path d={`M ${W*0.03+2} ${H*0.015+2} A 2 2 0 0 1 ${W*0.03+4} ${H*0.015}`}
            fill="none" stroke={blueFaint} strokeWidth={sw} />
          <path d={`M ${W*0.97-2} ${H*0.015+2} A 2 2 0 0 0 ${W*0.97-4} ${H*0.015}`}
            fill="none" stroke={blueFaint} strokeWidth={sw} />
          <path d={`M ${W*0.03+2} ${H*0.985-2} A 2 2 0 0 0 ${W*0.03+4} ${H*0.985}`}
            fill="none" stroke={blueFaint} strokeWidth={sw} />
          <path d={`M ${W*0.97-2} ${H*0.985-2} A 2 2 0 0 1 ${W*0.97-4} ${H*0.985}`}
            fill="none" stroke={blueFaint} strokeWidth={sw} />
        </>
      )}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER NODE
// ─────────────────────────────────────────────────────────────────────────────
const PlayerNode: React.FC<{ player: Player; x: number; y: number; num: number; scale?: number }> = ({
  player, x, y, num, scale = 1,
}) => {
  const name   = player.name.split(' ')[0].substring(0, 11).toUpperCase();
  const pos    = (player.positions?.[0] ?? 'SA').toUpperCase();
  const rating = (player.rating ?? 3.0).toFixed(1);
  const sz     = Math.round(34 * scale); // tamanho do avatar em px
  const gold   = '#d4a017';
  const blue   = '#00b4ff';

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20"
      style={{ left: `${x}%`, top: `${y}%`, transition: 'all 0.7s cubic-bezier(.34,1.56,.64,1)' }}
    >
      {/* Glow no chão */}
      <div style={{ position:'absolute', width: sz, height: sz, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,180,255,0.2) 0%,transparent 70%)',
        filter:'blur(5px)', transform:'translateY(3px)' }} />

      {/* Badge rating */}
      <div style={{ marginBottom: 2, padding:'1px 5px', fontSize: 8, fontWeight: 900,
        background: `linear-gradient(135deg,${gold},#f5d060,#c8860a)`, color:'#000',
        borderRadius: 2, boxShadow:`0 0 6px ${gold}88`, lineHeight: 1.4 }}>
        {rating}
      </div>

      {/* Avatar */}
      <div style={{ position:'relative', width: sz, height: sz, borderRadius:'50%',
        border:`2px solid ${blue}`, boxShadow:`0 0 10px ${blue}66`,
        overflow:'hidden', background:'#0a1628', flexShrink:0 }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            background:'linear-gradient(160deg,#0a2040,#071428)' }}>
            <div style={{ width:sz*.38, height:sz*.38, borderRadius:'50%', background:`${blue}33`, marginBottom:2 }} />
            <div style={{ width:sz*.55, height:sz*.28, borderRadius:'40% 40% 0 0', background:`${blue}22` }} />
          </div>
        )}
        {/* Nº camisa */}
        <div style={{ position:'absolute', bottom:0, right:0, fontSize:6, fontWeight:900,
          background:'#0057b8', color:'#fff', padding:'1px 3px', borderTopLeftRadius:3 }}>
          #{num}
        </div>
      </div>

      {/* Nome + posição */}
      <div style={{ marginTop: 3, display:'flex', flexDirection:'column', alignItems:'center', maxWidth: 64 }}>
        <div style={{ padding:'1px 5px', background:'rgba(0,0,0,0.9)',
          border:`1px solid ${blue}33`, textAlign:'center' }}>
          <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.12em', color:'#fff', textShadow:`0 0 6px ${blue}44` }}>
            {name}
          </span>
        </div>
        <span style={{ fontSize:6, fontWeight:900, textTransform:'uppercase',
          marginTop:1, color:`${blue}aa`, letterSpacing:'0.1em' }}>
          {pos}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RESERVA NODE
// ─────────────────────────────────────────────────────────────────────────────
const ReserveNode: React.FC<{ player: Player; num: number }> = ({ player, num }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:40 }}>
    <div style={{ width:30, height:30, borderRadius:'50%',
      border:'1px solid rgba(0,180,255,0.25)', overflow:'hidden',
      background:'#0a1628', opacity:0.65 }}>
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:8, fontWeight:900, color:'rgba(0,180,255,0.3)' }}>{num}</div>
      }
    </div>
    <span style={{ fontSize:6, fontWeight:700, textTransform:'uppercase',
      color:'rgba(255,255,255,0.3)', maxWidth:42, overflow:'hidden',
      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
      {player.name.split(' ')[0].substring(0,9)}
    </span>
    <span style={{ fontSize:6, fontWeight:900, color:'rgba(212,160,23,0.55)' }}>
      {(player.rating ?? 3).toFixed(1)}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export const TacticalBoardV2: React.FC<TacticalBoardV2Props> = ({
  homeTeam, awayTeam,
  homeTeamName = 'MANDANTE', awayTeamName = 'VISITANTE',
  homeScore = 0, awayScore = 0,
  timer = 0, matchStatus = 'Agendada',
  sportType = 'Society', playersPerTeam = 7,
}) => {
  const [view, setView] = useState<'home'|'away'>('home');
  const [flare, setFlare] = useState({ x: 18, y: 15 });

  // drift suave do lens flare
  useEffect(() => {
    const id = setInterval(() =>
      setFlare({ x: 10 + Math.random()*15, y: 8 + Math.random()*18 }), 3500);
    return () => clearInterval(id);
  }, []);

  const cfg        = getFieldCfg(sportType, playersPerTeam);
  const activeTeam = view === 'home' ? homeTeam : awayTeam;
  const activeName = view === 'home' ? homeTeamName : awayTeamName;
  const starters   = activeTeam.slice(0, cfg.limit);
  const reserves   = activeTeam.slice(cfg.limit);
  const coords     = useMemo(() => computeCoords(starters), [starters]);

  const stats = useMemo(() => {
    if (!activeTeam.length) return { avg: 0, best: null as Player | null };
    const avg  = activeTeam.reduce((a,p) => a + (p.rating ?? 3), 0) / activeTeam.length;
    const best = [...activeTeam].sort((a,b) => (b.rating??0)-(a.rating??0))[0];
    return { avg, best };
  }, [activeTeam]);

  // Escala do avatar: Campo tem jogadores menores para caber no campo
  const nodeScale = sportType === 'Campo' ? 0.82 : sportType === 'Futsal' ? 1.05 : 1;

  const gold    = '#d4a017';
  const blue    = '#00b4ff';
  // Razão de aspecto real do campo (largura/altura em metros)
  const fieldAR = `${cfg.fieldW}/${cfg.fieldH}`;
  // Altura em px derivada da largura máxima e do aspect ratio
  const fieldH_px = Math.round(cfg.maxW * cfg.fieldH / cfg.fieldW);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      userSelect:'none', fontFamily:'inherit', width:'100%',
      maxWidth: cfg.maxW, /* ← responsivo: nunca ultrapassa o maxW do esporte */
    }}>

      {/* ── BROADCAST HEADER ─────────────────────────────────────────────── */}
      <div style={{ width:'100%', display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'5px 8px', marginBottom:6,
        background:'linear-gradient(90deg,rgba(0,0,0,0.97),rgba(0,12,30,0.97),rgba(0,0,0,0.97))',
        borderBottom:`1.5px solid ${gold}`, borderTop:`1px solid ${blue}33` }}>

        {/* Placar */}
        <div style={{ padding:'2px 8px', background:`${blue}11`, border:`1px solid ${blue}33` }}>
          <div style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.2em', color:`${blue}88`, lineHeight:1.2 }}>
            {homeTeamName.substring(0,12)}
          </div>
          <div style={{ fontSize:18, fontWeight:900, color: homeScore>awayScore ? gold:'#fff',
            lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
            {homeScore}&nbsp;<span style={{color:'rgba(255,255,255,0.2)'}}>-</span>&nbsp;{awayScore}
          </div>
        </div>

        {/* Título */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'-0.02em', color:'#fff' }}>
            PELADA <span style={{ color:gold, textShadow:`0 0 10px ${gold}` }}>PRO</span>
          </span>
          <span style={{ fontSize:6.5, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.18em', color:`${blue}66`, marginTop:1 }}>
            {sportType} {cfg.limit}x{cfg.limit}
          </span>
        </div>

        {/* Timer */}
        <div style={{ padding:'2px 8px', border:`1px solid ${blue}25`,
          background:'rgba(0,20,50,0.7)', textAlign:'right' }}>
          <div style={{ fontSize:16, fontWeight:900, fontFamily:'monospace',
            color: matchStatus==='Em curso' ? gold : blue, lineHeight:1 }}>
            {fmtTime(timer)}
          </div>
          <div style={{ fontSize:6.5, fontWeight:900, textTransform:'uppercase',
            color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em' }}>
            {matchStatus}
          </div>
        </div>
      </div>

      {/* ── SELETOR DE TIMES ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:2, marginBottom:6, padding:2,
        background:'rgba(0,0,0,0.6)', border:`1px solid ${blue}18` }}>
        {(['home','away'] as const).map(side => (
          <button key={side} onClick={() => setView(side)}
            style={{ padding:'4px 16px', fontSize:9, fontWeight:900,
              textTransform:'uppercase', letterSpacing:'0.15em', border:'none', cursor:'pointer',
              transition:'all .3s',
              ...(view===side
                ? { background:`linear-gradient(135deg,${blue}22,${gold}22)`,
                    color:gold, borderBottom:`2px solid ${gold}` }
                : { background:'transparent', color:'rgba(255,255,255,0.3)' }),
            }}>
            {side==='home' ? homeTeamName : awayTeamName}
          </button>
        ))}
      </div>

      {/* Nome do time ativo */}
      <div style={{ width:'100%', textAlign:'center', padding:'4px 0', marginBottom:4,
        borderTop:`1px solid ${blue}25`, borderBottom:`1px solid ${blue}25`,
        background:`linear-gradient(90deg,transparent,${blue}08,transparent)` }}>
        <span style={{ fontSize:12, fontWeight:900, textTransform:'uppercase',
          letterSpacing:'0.18em', color:'#fff', textShadow:`0 0 16px ${blue}44` }}>
          {activeName}
        </span>
      </div>

      {/* ── CAMPO DE FUTEBOL ─────────────────────────────────────────────── */}
      {/* width: 100% + aspectRatio deixa o campo auto-escalar no mobile */}
      <div style={{ position:'relative', width:'100%', aspectRatio:`${cfg.fieldW}/${cfg.fieldH}`, flexShrink:0 }}>

        {/* Borda animada */}
        <div style={{ position:'absolute', inset:0, zIndex:30, pointerEvents:'none',
          border:`2px solid ${blue}`,
          boxShadow:`0 0 14px ${blue}44, inset 0 0 14px ${blue}11`,
          animation:'glow-pulse 3s ease-in-out infinite' }} />

        {/* Cantoneiras douradas */}
        {[{top:-1,left:-1,bw:'3px 0 0 3px'},{top:-1,right:-1,bw:'3px 3px 0 0'},
          {bottom:-1,left:-1,bw:'0 0 3px 3px'},{bottom:-1,right:-1,bw:'0 3px 3px 0'}
        ].map(({bw,...pos},i) => (
          <div key={i} style={{ position:'absolute', width:14, height:14, zIndex:40,
            pointerEvents:'none', borderStyle:'solid', borderColor:gold,
            borderWidth:bw, ...pos }} />
        ))}

        {/* GRAMADO */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(180deg,#0b2d19 0%,#092513 50%,#071e10 100%)' }}>

          {/* Listras alternadas do gramado */}
          {Array.from({ length: 10 }).map((_,i) => (
            <div key={i} style={{ position:'absolute', left:0, right:0,
              top:`${i*10}%`, height:'10%',
              background: i%2===0 ? 'rgba(255,255,255,0.013)':'transparent' }} />
          ))}

          {/* Iluminação dos refletores */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            background:`radial-gradient(ellipse 35% 45% at 0% 50%,rgba(0,80,255,0.18) 0%,transparent 65%),
                        radial-gradient(ellipse 35% 45% at 100% 50%,rgba(0,80,255,0.18) 0%,transparent 65%),
                        radial-gradient(ellipse 55% 25% at 50% 5%,${blue}12 0%,transparent 60%),
                        radial-gradient(ellipse 40% 30% at 50% 55%,${gold}08 0%,transparent 65%)` }} />
        </div>

        {/* SVG com linhas do campo em metros reais */}
        <FieldSVG cfg={cfg} sport={sportType} />

        {/* LENS FLARE — refletor superior esquerdo com drift */}
        <div style={{ position:'absolute', left:`${flare.x}%`, top:`${flare.y}%`,
          pointerEvents:'none', zIndex:20,
          transition:'left 3.5s ease-in-out, top 3.5s ease-in-out' }}>
          <div style={{ width:70, height:70, borderRadius:'50%', transform:'translate(-50%,-50%)',
            background:`radial-gradient(circle,${blue}50 0%,transparent 70%)`, filter:'blur(8px)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', width:100, height:2,
            background:`linear-gradient(90deg,transparent,${blue}40,transparent)`,
            transform:'translate(-50%,-50%) rotate(-25deg)', filter:'blur(2px)' }} />
        </div>
        {/* Flare dourado fixo — refletor direito */}
        <div style={{ position:'absolute', right:'6%', top:'4%', zIndex:10, pointerEvents:'none' }}>
          <div style={{ width:55, height:55, borderRadius:'50%',
            background:`radial-gradient(circle,rgba(212,160,23,0.22) 0%,transparent 70%)`,
            filter:'blur(7px)' }} />
        </div>

        {/* JOGADORES */}
        {coords.map(({ player, x, y }, i) => (
          <PlayerNode key={player.id} player={player} x={x} y={y}
            num={i+1} scale={nodeScale} />
        ))}

        {/* Scanlines CRT */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:11,
          background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.035) 3px,rgba(0,0,0,0.035) 4px)' }} />
      </div>

      {/* ── STATS HUD ────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6,
        width: cfg.maxW, marginTop:6 }}>
        <div style={{ padding:'6px 10px', background:'rgba(0,0,0,0.7)',
          border:`1px solid ${blue}22`, borderLeft:`3px solid ${blue}` }}>
          <div style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.15em', color:'rgba(255,255,255,0.35)', marginBottom:2 }}>
            SORTEIO INTELIGENTE
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4 }}>
            <span style={{ fontSize:20, fontWeight:900, color:'#fff', lineHeight:1, fontStyle:'italic' }}>
              {stats.avg.toFixed(1)}
            </span>
            <span style={{ fontSize:7.5, fontWeight:900, color:`${blue}77`, marginBottom:2 }}>/10</span>
            <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
              color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', marginBottom:2 }}>
              MÉDIA
            </span>
          </div>
        </div>

        <div style={{ padding:'6px 10px', background:'rgba(0,0,0,0.7)',
          border:`1px solid ${gold}22`, borderLeft:`3px solid ${gold}` }}>
          <div style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.15em', color:'rgba(255,255,255,0.35)', marginBottom:2 }}>
            JOGADOR DESTAQUE
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:900, textTransform:'uppercase',
              fontStyle:'italic', color:'#fff' }}>
              {stats.best?.name.split(' ')[0] ?? '---'}
            </span>
            <span style={{ fontSize:9, fontWeight:900, padding:'1px 6px',
              background:`${gold}18`, border:`1px solid ${gold}44`, color:gold }}>
              {stats.best ? (stats.best.rating??0).toFixed(1) : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* ── BANCO DE RESERVAS ────────────────────────────────────────────── */}
      {reserves.length > 0 && (
        <div style={{ width: cfg.maxW, marginTop:10, paddingTop:8,
          borderTop:`1px solid ${blue}15` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
              letterSpacing:'0.25em', color:'rgba(255,255,255,0.18)' }}>
              BANCO ({reserves.length})
            </span>
            <div style={{ flex:1, height:1, background:`${blue}12` }} />
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
            {reserves.map((p,i) => (
              <ReserveNode key={p.id} player={p} num={cfg.limit+i+1} />
            ))}
          </div>
        </div>
      )}

      {/* ── WATERMARK ────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, opacity:0.2 }}>
        <div style={{ height:1, width:36, background:`linear-gradient(90deg,transparent,${gold})` }} />
        <span style={{ fontSize:6.5, fontWeight:900, textTransform:'uppercase',
          letterSpacing:'0.35em', color:gold }}>
          BROADCAST PRO HUD v2.1
        </span>
        <div style={{ height:1, width:36, background:`linear-gradient(90deg,${gold},transparent)` }} />
      </div>

      {/* KEYFRAMES */}
      <style>{`
        @keyframes glow-pulse {
          0%,100% { box-shadow:0 0 14px rgba(0,180,255,0.4),inset 0 0 14px rgba(0,180,255,0.08); border-color:rgba(0,180,255,0.85); }
          50%      { box-shadow:0 0 28px rgba(0,180,255,0.7),0 0 55px rgba(0,180,255,0.18),inset 0 0 20px rgba(0,180,255,0.14); border-color:rgba(0,180,255,1); }
        }
      `}</style>
    </div>
  );
};
