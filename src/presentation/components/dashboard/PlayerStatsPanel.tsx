'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/infra/supabase/client';
import { aggregatePlayerStats } from '@/core/services/PlayerStatsService';
import { computeBadges, PlayerAggStats, EMPTY_STATS } from '@/core/services/BadgeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple, faMedal, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Props {
  playerId: string;
  groupId: string;
}

function StatTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${color}18`, borderLeft: `3px solid ${color}`, borderRadius: 8,
    }}>
      <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

export const PlayerStatsPanel: React.FC<Props> = ({ playerId, groupId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState<PlayerAggStats>(EMPTY_STATS);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: matches }, { data: events }, { data: presences }] = await Promise.all([
          supabase.from('matches').select('id, status, home_score, away_score, date, created_at').eq('group_id', groupId),
          supabase.from('events').select('player_id, type, match_id').eq('player_id', playerId),
          supabase.from('match_presence').select('player_id, team, match_id').eq('player_id', playerId),
        ]);
        setStats(aggregatePlayerStats(playerId, events ?? [], presences ?? [], matches ?? []));
      } catch {
        setStats(EMPTY_STATS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId, groupId]);

  const badges = computeBadges(stats);
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);
  const winRate = stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
        <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#ccff00', fontSize: 22 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats principais */}
      <div>
        <h3 style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faChartSimple} style={{ color: '#ccff00', fontSize: 10 }} />
          Estatísticas na Pelada
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <StatTile label="Jogos"   value={stats.matches} color="#00b4ff" />
          <StatTile label="Gols"    value={stats.goals}   color="#ccff00" sub={stats.matches ? `${(stats.goals / stats.matches).toFixed(1)}/jogo` : undefined} />
          <StatTile label="Assist." value={stats.assists} color="#A855F7" />
          <StatTile label="Vitória" value={`${winRate}%`} color="#22C55E" sub={`${stats.wins}V ${stats.draws}E ${stats.losses}D`} />
        </div>

        {/* Linha secundária */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
          <StatTile label="Hat-tricks" value={stats.hatTricks} color="#F97316" />
          <StatTile label="Sequência" value={stats.bestStreak} color="#EAB308" sub="vitórias" />
          <StatTile label="Amarelos"  value={stats.yellowCards} color="#EAB308" />
          <StatTile label="Vermelhos" value={stats.redCards} color="#EF4444" />
        </div>
      </div>

      {/* Conquistas */}
      <div>
        <h3 style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faMedal} style={{ color: '#FFD700', fontSize: 10 }} />
          Conquistas ({earned.length}/{badges.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {[...earned, ...locked].map(b => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: b.earned ? `${b.color}0c` : 'rgba(255,255,255,0.015)',
              border: `1px solid ${b.earned ? b.color + '35' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 8, opacity: b.earned ? 1 : 0.45,
            }}>
              <span style={{ fontSize: 22, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: b.earned ? b.color : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.label}
                </p>
                <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 1 }}>
                  {b.earned ? b.desc : (b.progress ?? b.desc)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
