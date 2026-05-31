import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faSkullCrossbones, faArrowRight, faClock } from '@fortawesome/free-solid-svg-icons';
import { BolaoState, BolaoTeam, BolaoMatchRecord } from '@/core/services/TournamentService';
import { GlassCard } from '@/presentation/components/ui/GlassCard';

interface BolaoTabProps {
  bolaoState: BolaoState;
}

function TeamBadge({ team, size = 'sm' }: { team: BolaoTeam; size?: 'sm' | 'xs' }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: size === 'xs' ? 8 : 9,
        fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: team.isEliminated ? 'rgba(255,255,255,0.2)' : team.isChampion ? '#FFD700' : team.color,
        textDecoration: team.isEliminated ? 'line-through' : 'none',
      }}
    >
      {team.isChampion && <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 10 }} />}
      {team.isEliminated && !team.isChampion && <FontAwesomeIcon icon={faSkullCrossbones} style={{ fontSize: 8 }} />}
      {team.name}
    </span>
  );
}

function StandingsRow({ team, rank }: { team: BolaoTeam; rank: number }) {
  const pts = team.wins * 3 + team.draws;
  const sd  = team.goalsFor - team.goalsAgainst;

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '20px 1fr 26px 26px 26px 26px 28px 28px 32px',
    alignItems: 'center',
    gap: 4,
    padding: '6px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: team.isChampion
      ? 'rgba(255,215,0,0.06)'
      : team.isEliminated
      ? 'rgba(0,0,0,0.3)'
      : rank <= 2 ? 'rgba(204,255,0,0.03)' : 'transparent',
  };

  const cellStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, textAlign: 'center', color: 'rgba(255,255,255,0.5)',
  };

  return (
    <div style={rowStyle}>
      <span style={{ ...cellStyle, color: 'rgba(255,255,255,0.3)' }}>{rank}</span>
      <TeamBadge team={team} size="sm" />
      <span style={cellStyle}>{team.wins}</span>
      <span style={cellStyle}>{team.draws}</span>
      <span style={cellStyle}>{team.losses}</span>
      <span style={cellStyle}>{team.goalsFor}</span>
      <span style={{ ...cellStyle, color: sd > 0 ? '#22C55E' : sd < 0 ? '#EF4444' : 'rgba(255,255,255,0.4)' }}>
        {sd > 0 ? `+${sd}` : sd}
      </span>
      <span style={{ ...cellStyle, color: team.isEliminated ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)', fontSize: 7 }}>
        {team.isEliminated ? 'FORA' : team.isChampion ? 'CAMP.' : team.losses >= 1 ? `${team.losses}D` : 'ATIVO'}
      </span>
      <span style={{
        ...cellStyle,
        fontWeight: 900,
        fontSize: 11,
        color: team.isChampion ? '#FFD700' : team.isEliminated ? 'rgba(255,255,255,0.15)' : '#ccff00',
      }}>
        {pts}
      </span>
    </div>
  );
}

function MatchHistoryRow({ record, teams }: { record: BolaoMatchRecord; teams: BolaoTeam[] }) {
  const home = teams.find(t => t.id === record.homeId);
  const away = teams.find(t => t.id === record.awayId);
  if (!home || !away) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)',
      fontSize: 9,
    }}>
      <span style={{ fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.2)', minWidth: 24 }}>
        R{record.roundNum}
      </span>
      <span style={{ flex: 1, textAlign: 'right', fontWeight: 900, color: record.result === 'home' ? record.homeId.includes(home.id) ? home.color : '#fff' : 'rgba(255,255,255,0.4)' }}>
        {home.name}
      </span>
      <span style={{ fontWeight: 900, fontSize: 11, color: '#fff', minWidth: 36, textAlign: 'center' }}>
        {record.homeScore} × {record.awayScore}
      </span>
      <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, color: record.result === 'away' ? away.color : 'rgba(255,255,255,0.4)' }}>
        {away.name}
      </span>
    </div>
  );
}

export const BolaoTab: React.FC<BolaoTabProps> = ({ bolaoState }) => {
  const standings = [...bolaoState.teams].sort((a, b) => {
    const pa = a.wins * 3 + a.draws;
    const pb = b.wins * 3 + b.draws;
    if (pb !== pa) return pb - pa;
    const sda = a.goalsFor - a.goalsAgainst;
    const sdb = b.goalsFor - b.goalsAgainst;
    if (sdb !== sda) return sdb - sda;
    return b.goalsFor - a.goalsFor;
  });

  const currentHome = bolaoState.teams.find(t => t.id === bolaoState.currentHomeId);
  const currentAway = bolaoState.teams.find(t => t.id === bolaoState.currentAwayId);
  const waitingTeams = bolaoState.queue.map(id => bolaoState.teams.find(t => t.id === id)).filter(Boolean) as BolaoTeam[];

  const headerStyle: React.CSSProperties = {
    fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.25)', textAlign: 'center',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Partida atual */}
      {bolaoState.phase !== 'done' && currentHome && currentAway && (
        <GlassCard className="p-4 border-white/5 bg-white/[0.02] rounded-xl">
          <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {bolaoState.phase === 'repechage' ? 'REPESCAGEM' : `RODADA ${bolaoState.round}`}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <div style={{ color: currentHome.color, fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>
                {currentHome.name}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {currentHome.wins}V {currentHome.draws}E {currentHome.losses}D
              </div>
            </div>
            <div className="text-center px-4">
              <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>VS</div>
            </div>
            <div className="text-center flex-1">
              <div style={{ color: currentAway.color, fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>
                {currentAway.name}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {currentAway.wins}V {currentAway.draws}E {currentAway.losses}D
              </div>
            </div>
          </div>

          {/* Fila de espera */}
          {waitingTeams.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1.5 flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                AGUARDANDO
              </div>
              <div className="flex flex-wrap gap-2">
                {waitingTeams.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {i === 0 && <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }} />}
                    <TeamBadge team={t} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Campeão */}
      {bolaoState.phase === 'done' && bolaoState.championId && (
        <GlassCard className="p-6 text-center border-yellow-500/20 bg-yellow-500/5 rounded-xl">
          <FontAwesomeIcon icon={faTrophy} className="text-4xl text-yellow-400 mb-4" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-1">
            CAMPEÃO DO BOLÃO
          </div>
          <div className="text-2xl font-black text-white uppercase italic">
            {bolaoState.teams.find(t => t.id === bolaoState.championId)?.name}
          </div>
        </GlassCard>
      )}

      {/* Classificação */}
      <GlassCard className="overflow-hidden border-white/5 bg-white/[0.02] rounded-xl">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
            Classificação
          </h3>
        </div>

        {/* Header da tabela */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr 26px 26px 26px 26px 28px 28px 32px',
          gap: 4, padding: '4px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={headerStyle}>#</span>
          <span style={{ ...headerStyle, textAlign: 'left' }}>Time</span>
          <span style={headerStyle}>V</span>
          <span style={headerStyle}>E</span>
          <span style={headerStyle}>D</span>
          <span style={headerStyle}>GF</span>
          <span style={headerStyle}>SD</span>
          <span style={headerStyle}>Status</span>
          <span style={headerStyle}>PTS</span>
        </div>

        {standings.map((team, i) => (
          <StandingsRow key={team.id} team={team} rank={i + 1} />
        ))}
      </GlassCard>

      {/* Histórico */}
      {bolaoState.history.length > 0 && (
        <GlassCard className="overflow-hidden border-white/5 bg-white/[0.02] rounded-xl">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
              Histórico de Partidas
            </h3>
          </div>
          {[...bolaoState.history].reverse().map((rec, i) => (
            <MatchHistoryRow key={i} record={rec} teams={bolaoState.teams} />
          ))}
        </GlassCard>
      )}
    </div>
  );
};
