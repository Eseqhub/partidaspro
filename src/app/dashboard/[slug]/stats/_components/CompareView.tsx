import React from 'react';

interface PlayerStat {
  id: string;
  name: string;
  photo_url?: string;
  positions: string[];
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matches: number;
  wins: number;
  mvps: number;
  score: number;
}

const CMP_ROWS: { label: string; key: keyof PlayerStat }[] = [
  { label: 'Jogos',        key: 'matches' },
  { label: 'Gols',         key: 'goals'   },
  { label: 'Assistências', key: 'assists' },
  { label: 'Vitórias',     key: 'wins'    },
  { label: 'Craque',       key: 'mvps'    },
  { label: 'Pontos',       key: 'score'   },
];

interface Props {
  playerStats: PlayerStat[];
  cmpA: string;
  cmpB: string;
  onSetCmpA: (id: string) => void;
  onSetCmpB: (id: string) => void;
}

export function CompareView({ playerStats, cmpA, cmpB, onSetCmpA, onSetCmpB }: Props) {
  if (playerStats.length < 2) return (
    <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">
      Precisa de pelo menos 2 jogadores com partidas
    </p>
  );

  const defaults = [...playerStats].sort((a, b) => b.score - a.score);
  const pA = playerStats.find(p => p.id === (cmpA || defaults[0]?.id));
  const pB = playerStats.find(p => p.id === (cmpB || defaults[1]?.id));

  return (
    <div className="space-y-4">
      {/* Seletores */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { val: cmpA || defaults[0]?.id, onChange: onSetCmpA, color: '#ccff00' },
          { val: cmpB || defaults[1]?.id, onChange: onSetCmpB, color: '#00b4ff' },
        ].map((s, i) => (
          <select key={i} value={s.val} onChange={e => s.onChange(e.target.value)}
            className="w-full bg-black/40 border rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-white outline-none"
            style={{ borderColor: `${s.color}40` }}>
            {playerStats.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
          </select>
        ))}
      </div>

      {pA && pB && (
        <>
          {/* Cabeçalho com nomes */}
          <div className="grid grid-cols-2 gap-3">
            {[{ p: pA, color: '#ccff00' }, { p: pB, color: '#00b4ff' }].map(({ p, color }, i) => {
              const ini = p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={i} className="flex flex-col items-center gap-2 py-3 rounded-xl"
                  style={{ background: `${color}0c`, border: `1px solid ${color}30` }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)', border: `2px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 14, fontWeight: 900, color }}>{ini}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#fff', textAlign: 'center' }}>{p.name}</span>
                </div>
              );
            })}
          </div>

          {/* Linhas de comparação */}
          <div className="space-y-1.5">
            {CMP_ROWS.map(row => {
              const a = Number(pA[row.key]); const b = Number(pB[row.key]);
              const max = Math.max(a, b, 1);
              return (
                <div key={row.key}>
                  <p className="text-center text-[7px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">{row.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black tabular-nums w-8 text-right" style={{ color: a >= b ? '#ccff00' : 'rgba(255,255,255,0.4)' }}>{a}</span>
                    <div className="flex-1 flex gap-0.5 h-2">
                      <div className="flex-1 flex justify-end">
                        <div style={{ width: `${(a / max) * 100}%`, height: '100%', background: a >= b ? '#ccff00' : 'rgba(204,255,0,0.3)', borderRadius: 2 }} />
                      </div>
                      <div className="flex-1">
                        <div style={{ width: `${(b / max) * 100}%`, height: '100%', background: b >= a ? '#00b4ff' : 'rgba(0,180,255,0.3)', borderRadius: 2 }} />
                      </div>
                    </div>
                    <span className="text-[13px] font-black tabular-nums w-8" style={{ color: b >= a ? '#00b4ff' : 'rgba(255,255,255,0.4)' }}>{b}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
