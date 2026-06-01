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
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">
            {matchType === 'manual' ? 'ESCALANDO TIMES' : 'SELECIONANDO JOGADORES'}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
        >
          CANCELAR
        </button>
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
