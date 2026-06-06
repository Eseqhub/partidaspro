import React from 'react';
import { Player } from '@/core/entities/player';

const BLUE  = '#00b4ff';
const GOLD  = '#d4a017';

const POS_COLOR: Record<string, string> = {
  G:   '#EAB308',
  ZAG: '#22C55E', ZGD: '#22C55E', ZGE: '#22C55E', LD: '#22C55E', LE: '#22C55E',
  VOL: '#3B82F6', MC: '#3B82F6', MD: '#3B82F6', ME: '#3B82F6', MO: '#8B5CF6',
  PD:  '#F97316', PE: '#F97316', SA: '#ccff00', CA: '#EF4444',
};

interface PlayerNodeProps {
  player: Player;
  x: number;
  y: number;
  num: number;
  scale?: number;
}

export const PlayerNode: React.FC<PlayerNodeProps> = ({ player, x, y, num, scale = 1 }) => {
  const name    = player.name.split(' ')[0].substring(0, 10).toUpperCase();
  const pos     = (player.posicao_principal ?? player.positions?.[0] ?? 'SA').toUpperCase();
  const posColor = POS_COLOR[pos] ?? BLUE;
  const skill   = player.skill_level ?? Math.round((player.rating ?? 3) * 2);
  const sz      = Math.round(34 * scale);

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20"
      style={{ left: `${x}%`, top: `${y}%`, transition: 'all 0.7s cubic-bezier(.34,1.56,.64,1)' }}
    >
      {/* Glow no chão */}
      <div style={{ position:'absolute', width:sz, height:sz, borderRadius:'50%',
        background:`radial-gradient(circle,${posColor}25 0%,transparent 70%)`,
        filter:'blur(5px)', transform:'translateY(3px)' }} />

      {/* Badge skill_level */}
      <div style={{ marginBottom:2, padding:'1px 6px', fontSize:8, fontWeight:900,
        background:`linear-gradient(135deg,${GOLD},#f5d060,#c8860a)`, color:'#000',
        borderRadius:2, boxShadow:`0 0 6px ${GOLD}88`, lineHeight:1.4,
        display:'flex', alignItems:'center', gap:3 }}>
        <span>{skill}</span>
        <span style={{ opacity:0.6, fontWeight:700, fontSize:6 }}>/10</span>
      </div>

      {/* Avatar */}
      <div style={{ position:'relative', width:sz, height:sz, borderRadius:'50%',
        border:`2px solid ${posColor}`, boxShadow:`0 0 10px ${posColor}66`,
        overflow:'hidden', background:'#0a1628', flexShrink:0 }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            background:'linear-gradient(160deg,#0a2040,#071428)' }}>
            <div style={{ width:sz*.38, height:sz*.38, borderRadius:'50%', background:`${posColor}33`, marginBottom:2 }} />
            <div style={{ width:sz*.55, height:sz*.28, borderRadius:'40% 40% 0 0', background:`${posColor}22` }} />
          </div>
        )}
        {/* Nº camisa */}
        <div style={{ position:'absolute', bottom:0, right:0, fontSize:6, fontWeight:900,
          background:'#0057b8', color:'#fff', padding:'1px 3px', borderTopLeftRadius:3 }}>
          #{num}
        </div>
      </div>

      {/* Nome + posição */}
      <div style={{ marginTop:3, display:'flex', flexDirection:'column', alignItems:'center', maxWidth:70 }}>
        <div style={{ padding:'1px 5px', background:'rgba(0,0,0,0.92)',
          border:`1px solid ${posColor}44`, textAlign:'center', borderRadius:2 }}>
          <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.1em', color:'#fff', textShadow:`0 0 6px ${posColor}44` }}>
            {name}
          </span>
        </div>
        {/* Badge de posição colorido */}
        <div style={{ marginTop:1, padding:'0 5px', background:`${posColor}22`,
          border:`1px solid ${posColor}55`, borderRadius:2 }}>
          <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'0.1em', color:posColor }}>
            {pos}
          </span>
        </div>
      </div>
    </div>
  );
};
