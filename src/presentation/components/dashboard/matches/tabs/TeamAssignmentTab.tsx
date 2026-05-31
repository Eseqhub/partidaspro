import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Player } from '@/core/entities/player';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';

export type PlayerRole = 'home-starter' | 'home-reserve' | 'away-starter' | 'away-reserve';

interface TeamAssignmentTabProps {
  allPlayers: Player[];
  homeTeamName: string;
  awayTeamName: string;
  assignments: Record<string, PlayerRole>;
  onAssign: (playerId: string, role: PlayerRole | null) => void;
  onConfirm: () => void;
  userRole: string;
}

const ROLE_LABELS: Record<PlayerRole, string> = {
  'home-starter':  'A TIT',
  'home-reserve':  'A RES',
  'away-starter':  'B TIT',
  'away-reserve':  'B RES',
};

const ROLE_COLORS: Record<PlayerRole, string> = {
  'home-starter':  '#ccff00',
  'home-reserve':  '#88aa00',
  'away-starter':  '#00b4ff',
  'away-reserve':  '#0077aa',
};

function RoleButton({ role, active, onClick }: { role: PlayerRole; active: boolean; onClick: () => void }) {
  const color = ROLE_COLORS[role];
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 7px',
        fontSize: 8,
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        background: active ? `${color}22` : 'transparent',
        color: active ? color : 'rgba(255,255,255,0.3)',
        cursor: 'pointer',
        borderRadius: 4,
        transition: 'all .15s',
      }}
    >
      {active && <FontAwesomeIcon icon={faCheck} style={{ marginRight: 3, fontSize: 7 }} />}
      {ROLE_LABELS[role]}
    </button>
  );
}

function TeamColumn({ title, color, starters, reserves }: {
  title: string; color: string; starters: Player[]; reserves: Player[];
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
        color, marginBottom: 8, borderBottom: `1px solid ${color}30`, paddingBottom: 4,
      }}>
        {title}
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>
          Titulares ({starters.length})
        </div>
        {starters.length === 0
          ? <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', padding: '4px 0' }}>—</div>
          : starters.map(p => (
            <div key={p.id} style={{ fontSize: 9, fontWeight: 700, color: '#fff', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}
            </div>
          ))
        }
      </div>
      <div>
        <div style={{ fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>
          Reservas ({reserves.length})
        </div>
        {reserves.length === 0
          ? <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', padding: '4px 0' }}>—</div>
          : reserves.map(p => (
            <div key={p.id} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}
            </div>
          ))
        }
      </div>
    </div>
  );
}

export const TeamAssignmentTab: React.FC<TeamAssignmentTabProps> = ({
  allPlayers, homeTeamName, awayTeamName, assignments, onAssign, onConfirm, userRole,
}) => {
  if (userRole === 'viewer') {
    return (
      <GlassCard className="p-8 text-center border-white/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Aguardando escalação do administrador
        </p>
      </GlassCard>
    );
  }

  const homeStarters  = allPlayers.filter(p => assignments[p.id] === 'home-starter');
  const homeReserves  = allPlayers.filter(p => assignments[p.id] === 'home-reserve');
  const awayStarters  = allPlayers.filter(p => assignments[p.id] === 'away-starter');
  const awayReserves  = allPlayers.filter(p => assignments[p.id] === 'away-reserve');
  const unassigned    = allPlayers.filter(p => !assignments[p.id]);

  const totalAssigned = homeStarters.length + homeReserves.length + awayStarters.length + awayReserves.length;
  const canConfirm = homeStarters.length > 0 && awayStarters.length > 0;

  const handleRoleClick = (playerId: string, role: PlayerRole) => {
    if (assignments[playerId] === role) {
      onAssign(playerId, null); // deselect
    } else {
      onAssign(playerId, role);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Resumo dos times */}
      <GlassCard className="p-4 border-white/5 bg-white/[0.02] rounded-xl">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">
          Escalação Atual
        </h3>
        <div style={{ display: 'flex', gap: 20 }}>
          <TeamColumn
            title={homeTeamName || 'TIME A'}
            color="#ccff00"
            starters={homeStarters}
            reserves={homeReserves}
          />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <TeamColumn
            title={awayTeamName || 'TIME B'}
            color="#00b4ff"
            starters={awayStarters}
            reserves={awayReserves}
          />
        </div>
      </GlassCard>

      {/* Lista de jogadores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserPlus} className="text-primary" />
            Jogadores ({allPlayers.length})
          </h3>
          <span className="text-[8px] font-black text-white/20 bg-white/5 px-2 py-1 rounded">
            {totalAssigned} ESCALADOS / {unassigned.length} SEM TIME
          </span>
        </div>

        <div className="space-y-2">
          {allPlayers.map(player => {
            const current = assignments[player.id] ?? null;
            return (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-lg hover:border-white/10 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                    {player.name}
                  </div>
                  <div className="text-[8px] text-white/30 font-bold uppercase mt-0.5">
                    {player.positions?.join(', ') || '—'}
                    {player.skill_level != null && ` · Nível ${player.skill_level}`}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  {(['home-starter', 'home-reserve', 'away-starter', 'away-reserve'] as PlayerRole[]).map(role => (
                    <RoleButton
                      key={role}
                      role={role}
                      active={current === role}
                      onClick={() => handleRoleClick(player.id, role)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão de confirmar */}
      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className={`w-full py-6 font-black uppercase tracking-[0.4em] text-sm border-none rounded-xl transition-all ${
          canConfirm
            ? 'bg-gradient-to-r from-primary to-green-400 text-black hover:scale-[1.01] shadow-[0_0_40px_rgba(204,255,0,0.15)]'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
        }`}
      >
        {canConfirm
          ? `CONFIRMAR TIMES (${homeStarters.length + homeReserves.length} × ${awayStarters.length + awayReserves.length})`
          : 'ESCALE AO MENOS 1 TITULAR POR TIME'}
      </Button>
    </div>
  );
};
