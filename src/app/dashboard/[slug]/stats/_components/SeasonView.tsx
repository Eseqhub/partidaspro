import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { SeasonStanding } from '@/core/services/PlayerStatsService';
import { generateSeasonImage, shareSeasonImage } from '@/core/services/seasonImage';

interface Props {
  seasonMonth: Date;
  seasonStandings: SeasonStanding[];
  champion: SeasonStanding | undefined;
  monthLabel: string;
  groupName: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function SeasonView({ seasonMonth, seasonStandings, champion, monthLabel, groupName, onPrevMonth, onNextMonth }: Props) {
  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const handleShare = async () => {
    try {
      const top = (key: 'goals' | 'assists' | 'mvpCount') =>
        [...seasonStandings].sort((a, b) => (b[key] as number) - (a[key] as number))[0];
      const ts = top('goals'), ta = top('assists'), cr = top('mvpCount');
      const blob = await generateSeasonImage({
        groupName, monthLabel,
        champion: champion ? { name: champion.name, points: champion.points, wins: champion.wins } : undefined,
        topScorer:   ts && ts.goals    > 0 ? { name: ts.name, value: ts.goals }    : undefined,
        topAssister: ta && ta.assists  > 0 ? { name: ta.name, value: ta.assists }  : undefined,
        craque:      cr && cr.mvpCount > 0 ? { name: cr.name, value: cr.mvpCount } : undefined,
      });
      await shareSeasonImage(blob, `Resumo da temporada — ${monthLabel}`);
    } catch (e: any) { alert('Erro ao gerar imagem: ' + (e?.message ?? '')); }
  };

  return (
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button onClick={onPrevMonth} className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg">
          <FontAwesomeIcon icon={faChevronLeft} className="text-white/40 text-[10px]" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-white">{monthLabel}</span>
        <button onClick={onNextMonth} className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg">
          <FontAwesomeIcon icon={faChevronRight} className="text-white/40 text-[10px]" />
        </button>
      </div>

      {seasonStandings.length === 0 ? (
        <p className="text-center py-16 text-[9px] font-black uppercase tracking-widest text-white/20">
          Nenhuma partida finalizada neste mês
        </p>
      ) : (
        <>
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] mb-1"
            style={{ background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}
          >
            <FontAwesomeIcon icon={faShareNodes} /> Compartilhar Resumo do Mês
          </button>

          {/* Campeão */}
          {champion && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              background: 'linear-gradient(135deg,rgba(255,215,0,0.1),transparent)',
              border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12,
            }}>
              <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid #FFD700', background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {champion.photo_url
                    ? <img src={champion.photo_url} alt={champion.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD700' }}>{champion.name.charAt(0)}</span>}
                </div>
                <span style={{ position: 'absolute', top: -8, right: -6, fontSize: 18 }}>👑</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#FFD700' }}>
                  Líder da Temporada
                </p>
                <p style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1.1 }}>
                  {champion.name}
                </p>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 2 }}>
                  {champion.points} pts · {champion.wins}V {champion.draws}E {champion.losses}D · {champion.goals}⚽ · {champion.mvpCount}🏆
                </p>
              </div>
            </div>
          )}

          <p className="text-[7px] font-black uppercase tracking-widest text-white/20 px-1">
            Pontos: Vitória=3 · Empate=1 · 🏆Craque=2 (bônus)
          </p>

          {/* Tabela */}
          <div>
            {seasonStandings.map((p, i) => {
              const medal = medals[i];
              return (
                <div key={p.playerId} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  background: i === 0 ? 'rgba(255,215,0,0.05)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderRadius: 6,
                }}>
                  <span style={{ width: 18, textAlign: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900, color: medal ?? 'rgba(255,255,255,0.25)' }}>
                    {i + 1}
                  </span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: medal ? `1.5px solid ${medal}` : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{p.name.charAt(0)}</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700, flexShrink: 0 }}>
                    {p.matches}J · {p.goals}⚽
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? '#FFD700' : '#fff', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
                    {p.points}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
