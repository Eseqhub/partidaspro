'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player } from '@/core/entities/player';
import { getFieldCfg, computeCoords, fmtTime, SportKey } from './fieldConfig';
import { Formation } from './formations';
import { FieldSVG } from './FieldSVG';
import { PlayerNode } from './PlayerNode';
import { ReserveNode } from './ReserveNode';

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
  homeFormation?: Formation;
  awayFormation?: Formation;
}

const BLUE = '#00b4ff';
const GOLD = '#d4a017';

export const TacticalBoardV2: React.FC<TacticalBoardV2Props> = ({
  homeTeam, awayTeam,
  homeTeamName = 'MANDANTE', awayTeamName = 'VISITANTE',
  homeScore = 0, awayScore = 0,
  timer = 0, matchStatus = 'Agendada',
  sportType = 'Society', playersPerTeam = 7,
  homeFormation, awayFormation,
}) => {
  const [view, setView] = useState<'home'|'away'>('home');
  const [flare, setFlare] = useState({ x: 18, y: 15 });

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
  const activeFormation = view === 'home' ? homeFormation : awayFormation;
  const coords     = useMemo(() => computeCoords(starters, sportType, activeFormation), [starters, sportType, activeFormation]);
  const nodeScale  = sportType === 'Campo' ? 0.78 : sportType === 'Futsal' ? 1.1 : 0.95;

  const stats = useMemo(() => {
    if (!activeTeam.length) return { avg: 0, best: null as Player | null };
    const avg  = activeTeam.reduce((a,p) => a + (p.rating ?? 3), 0) / activeTeam.length;
    const best = [...activeTeam].sort((a,b) => (b.rating??0)-(a.rating??0))[0];
    return { avg, best };
  }, [activeTeam]);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      userSelect:'none', fontFamily:'inherit', width:'100%', maxWidth:cfg.maxW }}>

      {/* Header broadcast */}
      <div style={{ width:'100%', display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'5px 8px', marginBottom:6,
        background:'linear-gradient(90deg,rgba(0,0,0,0.97),rgba(0,12,30,0.97),rgba(0,0,0,0.97))',
        borderBottom:`1.5px solid ${GOLD}`, borderTop:`1px solid ${BLUE}33` }}>

        <div style={{ padding:'2px 8px', background:`${BLUE}11`, border:`1px solid ${BLUE}33` }}>
          <div style={{ fontSize:7, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.2em', color:`${BLUE}88`, lineHeight:1.2 }}>
            {homeTeamName.substring(0,12)}
          </div>
          <div style={{ fontSize:18, fontWeight:900, color:homeScore>awayScore?GOLD:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
            {homeScore}&nbsp;<span style={{color:'rgba(255,255,255,0.2)'}}>-</span>&nbsp;{awayScore}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.02em', color:'#fff' }}>
            PELADA <span style={{ color:GOLD, textShadow:`0 0 10px ${GOLD}` }}>PRO</span>
          </span>
          <span style={{ fontSize:6.5, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.18em', color:`${BLUE}66`, marginTop:1 }}>
            {sportType} {cfg.limit}x{cfg.limit}
          </span>
        </div>

        <div style={{ padding:'2px 8px', border:`1px solid ${BLUE}25`, background:'rgba(0,20,50,0.7)', textAlign:'right' }}>
          <div style={{ fontSize:16, fontWeight:900, fontFamily:'monospace', color:matchStatus==='Em curso'?GOLD:BLUE, lineHeight:1 }}>
            {fmtTime(timer)}
          </div>
          <div style={{ fontSize:6.5, fontWeight:900, textTransform:'uppercase', color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em' }}>
            {matchStatus}
          </div>
        </div>
      </div>

      {/* Seletor de times */}
      <div style={{ display:'flex', gap:2, marginBottom:6, padding:2,
        background:'rgba(0,0,0,0.6)', border:`1px solid ${BLUE}18` }}>
        {(['home','away'] as const).map(side => (
          <button key={side} onClick={() => setView(side)}
            style={{ padding:'4px 16px', fontSize:9, fontWeight:900,
              textTransform:'uppercase', letterSpacing:'0.15em', border:'none', cursor:'pointer', transition:'all .3s',
              ...(view===side
                ? { background:`linear-gradient(135deg,${BLUE}22,${GOLD}22)`, color:GOLD, borderBottom:`2px solid ${GOLD}` }
                : { background:'transparent', color:'rgba(255,255,255,0.3)' }),
            }}>
            {side==='home' ? homeTeamName : awayTeamName}
          </button>
        ))}
      </div>

      {/* Nome do time ativo */}
      <div style={{ width:'100%', textAlign:'center', padding:'4px 0', marginBottom:4,
        borderTop:`1px solid ${BLUE}25`, borderBottom:`1px solid ${BLUE}25`,
        background:`linear-gradient(90deg,transparent,${BLUE}08,transparent)` }}>
        <span style={{ fontSize:12, fontWeight:900, textTransform:'uppercase',
          letterSpacing:'0.18em', color:'#fff', textShadow:`0 0 16px ${BLUE}44` }}>
          {activeName}
        </span>
      </div>

      {/* Campo */}
      <div style={{ position:'relative', width:'100%', aspectRatio:`${cfg.fieldW}/${cfg.fieldH}`, flexShrink:0 }}>
        {/* Borda animada */}
        <div style={{ position:'absolute', inset:0, zIndex:30, pointerEvents:'none',
          border:`2px solid ${BLUE}`, boxShadow:`0 0 14px ${BLUE}44, inset 0 0 14px ${BLUE}11`,
          animation:'glow-pulse 3s ease-in-out infinite' }} />

        {/* Cantoneiras douradas */}
        {[{top:-1,left:-1,bw:'3px 0 0 3px'},{top:-1,right:-1,bw:'3px 3px 0 0'},
          {bottom:-1,left:-1,bw:'0 0 3px 3px'},{bottom:-1,right:-1,bw:'0 3px 3px 0'}
        ].map(({bw,...pos},i) => (
          <div key={i} style={{ position:'absolute', width:14, height:14, zIndex:40,
            pointerEvents:'none', borderStyle:'solid', borderColor:GOLD, borderWidth:bw, ...pos }} />
        ))}

        {/* Gramado — cores distintas por modalidade */}
        <div style={{ position:'absolute', inset:0,
          background: sportType === 'Futsal'
            ? 'linear-gradient(180deg,#0a2240 0%,#071a30 50%,#050f1e 100%)'   // azul escuro para futsal (quadra)
            : sportType === 'Campo'
            ? 'linear-gradient(180deg,#0c3318 0%,#082a12 50%,#051a0b 100%)'   // verde bem escuro campo
            : 'linear-gradient(180deg,#0b2d1a 0%,#092514 50%,#071e10 100%)',  // verde society
        }}>
          {/* Faixas alternadas do gramado */}
          {Array.from({ length: sportType === 'Campo' ? 12 : 8 }).map((_,i) => (
            <div key={i} style={{
              position:'absolute', left:0, right:0,
              top:`${i*(100/(sportType === 'Campo' ? 12 : 8))}%`,
              height:`${100/(sportType === 'Campo' ? 12 : 8)}%`,
              background: i%2===0 ? 'rgba(255,255,255,0.018)':'transparent',
            }} />
          ))}
          {/* Gradiente de luz */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            background: sportType === 'Futsal'
              ? `radial-gradient(ellipse 70% 50% at 50% 50%,rgba(0,100,255,0.12) 0%,transparent 70%)`
              : `radial-gradient(ellipse 50% 40% at 50% 8%,${BLUE}10 0%,transparent 55%),
                 radial-gradient(ellipse 40% 30% at 50% 55%,${GOLD}07 0%,transparent 60%)`,
          }} />
        </div>

        <FieldSVG cfg={cfg} sport={sportType} />

        {/* Lens flare animado */}
        <div style={{ position:'absolute', left:`${flare.x}%`, top:`${flare.y}%`,
          pointerEvents:'none', zIndex:20, transition:'left 3.5s ease-in-out, top 3.5s ease-in-out' }}>
          <div style={{ width:70, height:70, borderRadius:'50%', transform:'translate(-50%,-50%)',
            background:`radial-gradient(circle,${BLUE}50 0%,transparent 70%)`, filter:'blur(8px)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', width:100, height:2,
            background:`linear-gradient(90deg,transparent,${BLUE}40,transparent)`,
            transform:'translate(-50%,-50%) rotate(-25deg)', filter:'blur(2px)' }} />
        </div>
        <div style={{ position:'absolute', right:'6%', top:'4%', zIndex:10, pointerEvents:'none' }}>
          <div style={{ width:55, height:55, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(212,160,23,0.22) 0%,transparent 70%)', filter:'blur(7px)' }} />
        </div>

        {/* Jogadores */}
        {coords.map(({ player, x, y }, i) => (
          <PlayerNode key={player.id} player={player} x={x} y={y} num={i+1} scale={nodeScale} />
        ))}

        {/* Scanlines CRT */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:11,
          background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.035) 3px,rgba(0,0,0,0.035) 4px)' }} />
      </div>

      {/* Stats HUD */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, width:cfg.maxW, marginTop:6 }}>
        <div style={{ padding:'6px 10px', background:'rgba(0,0,0,0.7)', border:`1px solid ${BLUE}22`, borderLeft:`3px solid ${BLUE}` }}>
          <div style={{ fontSize:7, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(255,255,255,0.35)', marginBottom:2 }}>SORTEIO INTELIGENTE</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4 }}>
            <span style={{ fontSize:20, fontWeight:900, color:'#fff', lineHeight:1, fontStyle:'italic' }}>{stats.avg.toFixed(1)}</span>
            <span style={{ fontSize:7.5, fontWeight:900, color:`${BLUE}77`, marginBottom:2 }}>/10</span>
            <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase', color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', marginBottom:2 }}>MÉDIA</span>
          </div>
        </div>
        <div style={{ padding:'6px 10px', background:'rgba(0,0,0,0.7)', border:`1px solid ${GOLD}22`, borderLeft:`3px solid ${GOLD}` }}>
          <div style={{ fontSize:7, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(255,255,255,0.35)', marginBottom:2 }}>JOGADOR DESTAQUE</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', fontStyle:'italic', color:'#fff' }}>{stats.best?.name.split(' ')[0] ?? '---'}</span>
            <span style={{ fontSize:9, fontWeight:900, padding:'1px 6px', background:`${GOLD}18`, border:`1px solid ${GOLD}44`, color:GOLD }}>{stats.best ? (stats.best.rating??0).toFixed(1) : '---'}</span>
          </div>
        </div>
      </div>

      {/* Banco de reservas */}
      {reserves.length > 0 && (
        <div style={{ width:cfg.maxW, marginTop:10, paddingTop:8, borderTop:`1px solid ${BLUE}15` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.25em', color:'rgba(255,255,255,0.18)' }}>BANCO ({reserves.length})</span>
            <div style={{ flex:1, height:1, background:`${BLUE}12` }} />
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
            {reserves.map((p,i) => <ReserveNode key={p.id} player={p} num={cfg.limit+i+1} />)}
          </div>
        </div>
      )}

      {/* Watermark */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, opacity:0.2 }}>
        <div style={{ height:1, width:36, background:`linear-gradient(90deg,transparent,${GOLD})` }} />
        <span style={{ fontSize:6.5, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.35em', color:GOLD }}>BROADCAST PRO HUD v2.1</span>
        <div style={{ height:1, width:36, background:`linear-gradient(90deg,${GOLD},transparent)` }} />
      </div>

      <style>{`
        @keyframes glow-pulse {
          0%,100% { box-shadow:0 0 14px rgba(0,180,255,0.4),inset 0 0 14px rgba(0,180,255,0.08); border-color:rgba(0,180,255,0.85); }
          50%      { box-shadow:0 0 28px rgba(0,180,255,0.7),0 0 55px rgba(0,180,255,0.18),inset 0 0 20px rgba(0,180,255,0.14); border-color:rgba(0,180,255,1); }
        }
      `}</style>
    </div>
  );
};
