import React from 'react';
import { Player } from '@/core/entities/player';
import { Formation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';
import { AttendanceTab } from '@/presentation/components/dashboard/matches/tabs/AttendanceTab';
import { TeamAssignmentTab, PlayerRole } from '@/presentation/components/dashboard/matches/tabs/TeamAssignmentTab';

interface Props {
  matchType: 'rachao' | 'manual' | 'desafio';
  userRole: string;
  slug: string;
  matchId: string | null;
  matchConfig?: { campo?: string; gameMode?: string; duration?: number; homeTeamName?: string; awayTeamName?: string };
  allPlayers: Player[];
  selectedPlayerIds: string[];
  togglePlayerAttendance: (id: string) => void;
  setIsAddModalOpen: (open: boolean) => void;
  guestInput: string;
  setGuestInput: (val: string) => void;
  guestPlayers: string[];
  setGuestPlayers: (players: string[]) => void;
  handleDraft: () => void;
  setSelectedPlayerIds: (ids: string[]) => void;
  playersPerTeam: number;
  availableFormations: Formation[];
  homeFormation: Formation;
  awayFormation: Formation;
  homeTeamName: string;
  awayTeamName: string;
  onSelectHomeFormation: (id: string) => void;
  onSelectAwayFormation: (id: string) => void;
  teamAssignments: Record<string, PlayerRole>;
  onAssignPlayer: (playerId: string, role: PlayerRole | null) => void;
  onConfirmTeams: () => void;
  onCancel: () => void;
}

export function MatchSetupPhase({
  matchType, userRole, slug, matchId,
  allPlayers, selectedPlayerIds, togglePlayerAttendance, setIsAddModalOpen,
  guestInput, setGuestInput, guestPlayers, setGuestPlayers,
  handleDraft, setSelectedPlayerIds, playersPerTeam,
  availableFormations, homeFormation, awayFormation,
  homeTeamName, awayTeamName, onSelectHomeFormation, onSelectAwayFormation,
  teamAssignments, onAssignPlayer, onConfirmTeams, onCancel,
  matchConfig,
}: Props) {
  return (
    <div className="space-y-4">

      {/* Resumo da configuração da partida */}
      {matchConfig && (matchConfig.campo || matchConfig.gameMode) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          padding: '10px 14px', background: 'rgba(204,255,0,0.04)',
          border: '1px solid rgba(204,255,0,0.15)', borderRadius: 10,
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
              Partida:
            </span>
            {[matchConfig.campo, matchConfig.gameMode, matchConfig.duration ? `${matchConfig.duration}min` : null]
              .filter(Boolean).map((v, i) => (
                <span key={i} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '2px 7px', background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)',
                  color: '#ccff00', borderRadius: 4 }}>
                  {v}
                </span>
              ))}
          </div>
          <button onClick={onCancel}
            style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
              color: 'rgba(239,68,68,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
            CANCELAR
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">
            {matchType === 'manual' ? 'ESCALANDO TIMES' : 'SELECIONANDO JOGADORES'}
          </span>
        </div>
        {!matchConfig && (
          <button
            onClick={onCancel}
            className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
          >
            CANCELAR
          </button>
        )}
      </div>

      {matchType !== 'manual' && (
        <AttendanceTab
          allPlayers={allPlayers}
          selectedPlayerIds={selectedPlayerIds}
          togglePlayerAttendance={togglePlayerAttendance}
          setIsAddModalOpen={setIsAddModalOpen}
          slug={slug}
          matchId={matchId}
          guestInput={guestInput}
          setGuestInput={setGuestInput}
          guestPlayers={guestPlayers}
          setGuestPlayers={setGuestPlayers}
          handleDraft={handleDraft}
          userRole={userRole}
          matchType="rachao"
          setSelectedPlayerIds={setSelectedPlayerIds}
          playersPerTeam={playersPerTeam}
          homeFormations={availableFormations}
          awayFormations={availableFormations}
          homeFormationId={homeFormation.id}
          awayFormationId={awayFormation.id}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          onSelectHomeFormation={onSelectHomeFormation}
          onSelectAwayFormation={onSelectAwayFormation}
        />
      )}

      {matchType === 'manual' && (
        <TeamAssignmentTab
          allPlayers={allPlayers}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          assignments={teamAssignments}
          onAssign={onAssignPlayer}
          onConfirm={onConfirmTeams}
          userRole={userRole}
        />
      )}
    </div>
  );
}
