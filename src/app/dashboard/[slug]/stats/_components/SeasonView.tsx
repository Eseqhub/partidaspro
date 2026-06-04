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

const gold = '#FFD700';
const green = '#22c55e';
const blue  = '#00b4ff';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Navegação mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button onClick={onPrevMonth} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', borderRadius: 10, cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faChevronLeft} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#fff', textAlign: 'center' }}>
          {monthLabel}
        </span>
        <button onClick={onNextMonth} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', borderRadius: 10, cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faChevronRight} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        </button>
      </div>

      {seasonStandings.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '48px 0', fontSize: 10, fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)' }}>
          Nenhuma partida finalizada neste mês
        </p>
      ) : (
        <>
          {/* Compartilhar */}
          <button onClick={handleShare} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 0', borderRadius: 10, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.15em', fontSize: 11, cursor: 'pointer',
            background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)', color: blue,
          }}>
            <FontAwesomeIcon icon={faShareNodes} /> Compartilhar Resumo
          </button>

          {/* Legenda de pontuação */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
            {[
              { label: 'Vitória', value: '3 pts', color: green },
              { label: 'Empate',  value: '1 pt',  color: 'rgba(255,255,255,0.35)' },
              { label: 'Craque',  value: '+2 pts', color: gold },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: item.color }}>{item.value}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Campeão do mês */}
          {champion && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              background: 'linear-gradient(135deg,rgba(255,215,0,0.1),transparent)',
              border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12,
            }}>
              <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${gold}`, background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {champion.photo_url
                    ? <img src={champion.photo_url} alt={champion.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18, fontWeight: 900, color: gold }}>{champion.name.charAt(0)}</span>}
                </div>
                <span style={{ position: 'absolute', top: -8, right: -6, fontSize: 20 }}>👑</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: gold, marginBottom: 3 }}>
                  Líder da Temporada
                </p>
                <p style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1.1, marginBottom: 5 }}>
                  {champion.name}
                </p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: gold }}>{champion.points} pts</span>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 900,
                    background: 'rgba(34,197,94,0.15)', color: green, border: '1px solid rgba(34,197,94,0.25)' }}>
                    {champion.wins}V
                  </span>
                  {champion.draws > 0 && (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 900,
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {champion.draws}E
                    </span>
                  )}
                  {champion.losses > 0 && (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 900,
                      background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {champion.losses}D
                    </span>
                  )}
                  {champion.goals > 0 && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                      {champion.goals}⚽ {champion.mvpCount > 0 ? `· ${champion.mvpCount}🏆` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabela de standings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {seasonStandings.map((p, i) => {
              const medal = medals[i] ?? null;
              return (
                <div key={p.playerId} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                  background: i === 0 ? 'rgba(255,215,0,0.05)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderRadius: 8,
                  border: i === 0 ? '1px solid rgba(255,215,0,0.15)' : '1px solid transparent',
                }}>
                  {/* Posição */}
                  <span style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: 12, fontWeight: 900,
                    color: medal ?? 'rgba(255,255,255,0.2)' }}>
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: medal ? `2px solid ${medal}` : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 12, fontWeight: 900, color: medal ?? 'rgba(255,255,255,0.4)' }}>{p.name.charAt(0)}</span>}
                  </div>

                  {/* Nome + detalhes */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {p.name}
                    </span>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{p.matches}J</span>
                      {p.wins > 0 && (
                        <span style={{ fontSize: 8, fontWeight: 900, padding: '0 5px', borderRadius: 3,
                          background: 'rgba(34,197,94,0.12)', color: green }}>{p.wins}V</span>
                      )}
                      {p.draws > 0 && (
                        <span style={{ fontSize: 8, fontWeight: 900, padding: '0 5px', borderRadius: 3,
                          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>{p.draws}E</span>
                      )}
                      {p.goals > 0 && (
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{p.goals}⚽</span>
                      )}
                    </div>
                  </div>

                  {/* Pontos */}
                  <span style={{ fontSize: 18, fontWeight: 900,
                    color: i === 0 ? gold : '#fff', minWidth: 32, textAlign: 'right', flexShrink: 0 }}>
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
