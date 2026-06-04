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

const CMP_ROWS: { label: string; key: keyof PlayerStat; icon: string }[] = [
  { label: 'Jogos',        key: 'matches', icon: '🗓' },
  { label: 'Gols',         key: 'goals',   icon: '⚽' },
  { label: 'Assistências', key: 'assists', icon: '🤝' },
  { label: 'Vitórias',     key: 'wins',    icon: '🏆' },
  { label: 'Craque',       key: 'mvps',    icon: '⭐' },
  { label: 'Pontos',       key: 'score',   icon: '📊' },
];

const neon = '#ccff00';
const blue = '#00b4ff';

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
          { val: cmpA || defaults[0]?.id, onChange: onSetCmpA, color: neon },
          { val: cmpB || defaults[1]?.id, onChange: onSetCmpB, color: blue },
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
          {/* Cabeçalho com nomes e foto */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            {/* Jogador A */}
            <div className="flex flex-col items-center gap-2 py-3 rounded-xl"
              style={{ background: `${neon}0c`, border: `1px solid ${neon}30` }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)', border: `2px solid ${neon}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pA.photo_url
                  ? <img src={pA.photo_url} alt={pA.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 14, fontWeight: 900, color: neon }}>{pA.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', textAlign: 'center', padding: '0 4px' }}>{pA.name}</span>
            </div>

            {/* VS central */}
            <div style={{ textAlign: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)' }}>VS</span>
            </div>

            {/* Jogador B */}
            <div className="flex flex-col items-center gap-2 py-3 rounded-xl"
              style={{ background: `${blue}0c`, border: `1px solid ${blue}30` }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)', border: `2px solid ${blue}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pB.photo_url
                  ? <img src={pB.photo_url} alt={pB.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 14, fontWeight: 900, color: blue }}>{pB.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', textAlign: 'center', padding: '0 4px' }}>{pB.name}</span>
            </div>
          </div>

          {/* Resultado geral */}
          {(() => {
            const aWins = CMP_ROWS.filter(r => Number(pA[r.key]) > Number(pB[r.key])).length;
            const bWins = CMP_ROWS.filter(r => Number(pB[r.key]) > Number(pA[r.key])).length;
            const draws = CMP_ROWS.length - aWins - bWins;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: aWins > bWins ? neon : 'rgba(255,255,255,0.25)' }}>{aWins}</span>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  {aWins > bWins ? `${pA.name.split(' ')[0]} vence` : bWins > aWins ? `${pB.name.split(' ')[0]} vence` : 'Empate'}
                </span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: bWins > aWins ? blue : 'rgba(255,255,255,0.25)' }}>{bWins}</span>
              </div>
            );
          })()}

          {/* Linhas de comparação */}
          <div className="space-y-1">
            {CMP_ROWS.map(row => {
              const a = Number(pA[row.key]);
              const b = Number(pB[row.key]);
              const max = Math.max(a, b, 1);
              const diff = a - b;
              const diffLabel = diff === 0 ? '=' : (diff > 0 ? `+${diff}` : `${diff}`);
              const diffColor = diff > 0 ? neon : diff < 0 ? blue : 'rgba(255,255,255,0.2)';

              return (
                <div key={row.key} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 8, padding: '8px 10px',
                }}>
                  {/* Label */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
                    <span style={{ fontSize: 11 }}>{row.icon}</span>
                    <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)' }}>
                      {row.label}
                    </span>
                  </div>

                  {/* Barra + valores + diff */}
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 36px 1fr 28px', alignItems: 'center', gap: 4 }}>
                    {/* Valor A */}
                    <span style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace', textAlign: 'right',
                      color: a > b ? neon : a === b ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)' }}>
                      {a}
                    </span>

                    {/* Barra A (direita para esquerda) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', height: 6 }}>
                      <div style={{
                        width: `${(a / max) * 100}%`, height: '100%', borderRadius: 3,
                        background: a >= b ? neon : `${neon}30`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>

                    {/* Diferença central */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 900, fontFamily: 'monospace',
                        color: diffColor,
                        padding: '2px 4px',
                        background: diff !== 0 ? `${diffColor}14` : 'transparent',
                        borderRadius: 3,
                      }}>
                        {diffLabel}
                      </span>
                    </div>

                    {/* Barra B (esquerda para direita) */}
                    <div style={{ height: 6 }}>
                      <div style={{
                        width: `${(b / max) * 100}%`, height: '100%', borderRadius: 3,
                        background: b >= a ? blue : `${blue}30`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>

                    {/* Valor B */}
                    <span style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace', textAlign: 'left',
                      color: b > a ? blue : b === a ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)' }}>
                      {b}
                    </span>
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
