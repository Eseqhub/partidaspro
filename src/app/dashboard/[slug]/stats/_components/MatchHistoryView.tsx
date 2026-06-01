import React from 'react';

interface MatchRecord {
  id: string;
  date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  status: string;
  field_type?: string;
}

interface Props {
  matchHistory: MatchRecord[];
}

export function MatchHistoryView({ matchHistory }: Props) {
  if (matchHistory.length === 0) return (
    <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">
      Sem partidas finalizadas
    </p>
  );

  return (
    <div className="space-y-1">
      {matchHistory.map((m, i) => {
        const homeWon = m.home_score > m.away_score;
        const awayWon = m.away_score > m.home_score;
        return (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderRadius: 6,
          }}>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 900, minWidth: 14 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: homeWon ? '#ccff00' : '#fff' }}>
                  {m.home_team_name || 'Time A'}
                </span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
                  {m.home_score} – {m.away_score}
                </span>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: awayWon ? '#00b4ff' : 'rgba(255,255,255,0.4)' }}>
                  {m.away_team_name || 'Time B'}
                </span>
              </div>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                {m.date ? new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
                {m.field_type ? ` · ${m.field_type}` : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
