import React from 'react';
import { Player } from '@/core/entities/player';

const BLUE = '#00b4ff';
const GOLD = '#d4a017';

interface ReserveNodeProps {
  player: Player;
  num: number;
}

export const ReserveNode: React.FC<ReserveNodeProps> = ({ player, num }) => (
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
    <span style={{ fontSize:6, fontWeight:900, color:`${GOLD}8c` }}>
      {(player.rating ?? 3).toFixed(1)}
    </span>
  </div>
);
