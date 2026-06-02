import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faFutbol, faUserClock, faCalendarDay } from '@fortawesome/free-solid-svg-icons';

interface Engagement {
  topClubs: { group_id: string; matches: number }[];
  topScorers: { player_id: string; goals: number }[];
  topPresence: { player_id: string; games: number }[];
  perDay: { key: string; label: string; count: number }[];
}

interface Props {
  engagement: Engagement;
  groupNameById: Map<string, string>;
  playerNameById: Map<string, string>;
}

function RankCard({ title, icon, color, rows }: {
  title: string; icon: any; color: string; rows: { name: string; value: number }[];
}) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="border border-white/5 rounded-xl p-4 bg-white/[0.02]">
      <h3 className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color }}>
        <FontAwesomeIcon icon={icon} /> {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-[8px] font-black uppercase tracking-widest text-white/15 py-4 text-center">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] font-black text-white/30 w-4 flex-shrink-0">{i + 1}</span>
              <span className="text-[10px] font-bold text-white/80 flex-1 min-w-0 truncate">{r.name}</span>
              <div className="w-20 h-1.5 bg-white/5 rounded overflow-hidden flex-shrink-0">
                <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: color }} />
              </div>
              <span className="text-[10px] font-black flex-shrink-0 w-6 text-right" style={{ color }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminEngagement({ engagement, groupNameById, playerNameById }: Props) {
  const maxDay = Math.max(1, ...engagement.perDay.map(d => d.count));

  return (
    <div className="space-y-5">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 pt-2">📊 Engajamento</h2>

      {/* Partidas por dia */}
      <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendarDay} className="text-primary" /> Partidas por dia (14 dias)
        </h3>
        <div className="flex items-end gap-1.5" style={{ height: 90 }}>
          {engagement.perDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{
                height: `${(d.count / maxDay) * 70}px`, minHeight: d.count ? 3 : 0,
                background: d.count ? '#ccff00' : 'rgba(255,255,255,0.05)',
              }} title={`${d.count} partida(s)`} />
              <span className="text-[6px] font-black text-white/25">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RankCard title="Clubes mais ativos" icon={faShieldHalved} color="#ccff00"
          rows={engagement.topClubs.map(c => ({ name: groupNameById.get(c.group_id) ?? '—', value: c.matches }))} />
        <RankCard title="Artilheiros (global)" icon={faFutbol} color="#F97316"
          rows={engagement.topScorers.map(s => ({ name: playerNameById.get(s.player_id) ?? '—', value: s.goals }))} />
        <RankCard title="Quem mais joga" icon={faUserClock} color="#00b4ff"
          rows={engagement.topPresence.map(p => ({ name: playerNameById.get(p.player_id) ?? '—', value: p.games }))} />
      </div>
    </div>
  );
}
