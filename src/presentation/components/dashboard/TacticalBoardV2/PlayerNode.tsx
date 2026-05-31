import React from 'react';
import { Player } from '@/core/entities/player';

const BLUE  = '#00b4ff';
const GOLD  = '#d4a017';

interface PlayerNodeProps {
  player: Player;
  x: number;
  y: number;
  num: number;
  scale?: number;
}

export const PlayerNode: React.FC<PlayerNodeProps> = ({ player, x, y, num, scale = 1 }) => {
  const name   = player.name.split(' ')[0].substring(0, 11).toUpperCase();
  const pos    = (player.positions?.[0] ?? 'SA').toUpperCase();
  const rating = (player.rating ?? 3.0).toFixed(1);
  const sz     = Math.round(34 * scale);

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20"
      style={{ left: `${x}%`, top: `${y}%`, transition: 'all 0.7s cubic-bezier(.34,1.56,.64,1)' }}
    >
      {/* Glow no chão */}
      <div style={{ position:'absolute', width:sz, height:sz, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,180,255,0.2) 0%,transparent 70%)',
        filter:'blur(5px)', transform:'translateY(3px)' }} />

      {/* Badge rating */}
      <div style={{ marginBottom:2, padding:'1px 5px', fontSize:8, fontWeight:900,
        background:`linear-gradient(135deg,${GOLD},#f5d060,#c8860a)`, color:'#000',
        borderRadius:2, boxShadow:`0 0 6px ${GOLD}88`, lineHeight:1.4 }}>
        {rating}
      </div>

      {/* Avatar */}
      <div style={{ position:'relative', width:sz, height:sz, borderRadius:'50%',
        border:`2px solid ${BLUE}`, boxShadow:`0 0 10px ${BLUE}66`,
        overflow:'hidden', background:'#0a1628', flexShrink:0 }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            background:'linear-gradient(160deg,#0a2040,#071428)' }}>
            <div style={{ width:sz*.38, height:sz*.38, borderRadius:'50%', background:`${BLUE}33`, marginBottom:2 }} />
            <div style={{ width:sz*.55, height:sz*.28, borderRadius:'40% 40% 0 0', background:`${BLUE}22` }} />
          </div>
        )}
        {/* Nº camisa */}
        <div style={{ position:'absolute', bottom:0, right:0, fontSize:6, fontWeight:900,
          background:'#0057b8', color:'#fff', padding:'1px 3px', borderTopLeftRadius:3 }}>
          #{num}
        </div>
      </div>

      {/* Nome + posição */}
      <div style={{ marginTop:3, display:'flex', flexDirection:'column', alignItems:'center', maxWidth:64 }}>
        <div style={{ padding:'1px 5px', background:'rgba(0,0,0,0.9)',
          border:`1px solid ${BLUE}33`, textAlign:'center' }}>
          <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.12em', color:'#fff', textShadow:`0 0 6px ${BLUE}44` }}>
            {name}
          </span>
        </div>
        <span style={{ fontSize:6, fontWeight:900, textTransform:'uppercase',
          marginTop:1, color:`${BLUE}aa`, letterSpacing:'0.1em' }}>
          {pos}
        </span>
      </div>
    </div>
  );
};
