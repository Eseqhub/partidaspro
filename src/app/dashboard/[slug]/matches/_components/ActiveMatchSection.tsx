import React from 'react';
import { Player } from '@/core/entities/player';
import { DraftResult } from '@/core/services/DraftService';
import { BolaoState } from '@/core/services/TournamentService';
import { Formation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';
import { MatchStatus, MatchType } from '@/core/entities/match';
import { ScoreboardV2 } from '@/presentation/components/dashboard/matches/MatchScoreboardV2';
import { MatchBottomNav, Tab } from '@/presentation/components/dashboard/matches/MatchBottomNav';
import { AttendanceTab } from '@/presentation/components/dashboard/matches/tabs/AttendanceTab';
import { ActiveMatchTab } from '@/presentation/components/dashboard/matches/tabs/ActiveMatchTab';
import { StatsTab } from '@/presentation/components/dashboard/matches/tabs/StatsTab';
import { SettingsTab } from '@/presentation/components/dashboard/matches/tabs/SettingsTab';
import { BolaoTab } from '@/presentation/components/dashboard/matches/tabs/BolaoTab';
import { PlayerRole } from '@/presentation/components/dashboard/matches/tabs/TeamAssignmentTab';

interface Props {
  // scoreboard
  score: { home: number; away: number };
  config: any;
  setConfig: (cfg: any) => void;
  timer: number;
  status: MatchStatus;
  matchId: string;
  matchRepo: any;
  toggleTimer: () => void;
  setScore: (s: { home: number; away: number }) => void;
  setTimer: (t: number) => void;
  setStartTime: (t: number | null) => void;
  setAccumulatedTime: (t: number) => void;
  setStatus: (s: MatchStatus) => void;
  // tabs
  activeTab: string;
  setActiveTab: (tab: any) => void;
  tabs: Tab[];
  teamsQueue: Player[][];
  // draft
  draftResult: DraftResult;
  matchType: MatchType;
  homeFormation: Formation;
  awayFormation: Formation;
  events: any[];
  comments: any[];
  currentUserName: string;
  handleAddComment: (message: string) => void;
  slug: string;
  // attendance
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
  availableFormations: Formation[];
  awayFormation2?: Formation;
  homeTeamName: string;
  awayTeamName: string;
  onSelectHomeFormation: (id: string) => void;
  onSelectAwayFormation: (id: string) => void;
  SPORT_PLAYERS: Record<string, number>;
  // stats
  userRole: string;
  handleNewMatch: () => void;
  setSelectedEventType: (type: any) => void;
  setIsEventModalOpen: (open: boolean) => void;
  handleElectMVP: (playerId: string, team: 'home' | 'away') => void;
  mvpPlayerId: string | null;
  // settings
  loading: boolean;
  handleSaveConfig: () => void;
  editorInput: string;
  setEditorInput: (val: string) => void;
  editors: any[];
  setEditors: (editors: any[]) => void;
  groupId: string | null;
  groupRepo: any;
  supabase: any;
  // bolao
  bolaoState: BolaoState | null;
}

export function ActiveMatchSection({
  score, config, setConfig, timer, status, matchId, matchRepo,
  toggleTimer, setScore, setTimer, setStartTime, setAccumulatedTime, setStatus,
  activeTab, setActiveTab, tabs, teamsQueue,
  draftResult, matchType, homeFormation, awayFormation, events, comments, currentUserName, handleAddComment, slug,
  allPlayers, selectedPlayerIds, togglePlayerAttendance, setIsAddModalOpen,
  guestInput, setGuestInput, guestPlayers, setGuestPlayers,
  handleDraft, setSelectedPlayerIds, availableFormations,
  homeTeamName, awayTeamName, onSelectHomeFormation, onSelectAwayFormation,
  SPORT_PLAYERS,
  userRole, handleNewMatch, setSelectedEventType, setIsEventModalOpen,
  handleElectMVP, mvpPlayerId,
  loading, handleSaveConfig, editorInput, setEditorInput, editors, setEditors,
  groupId, groupRepo, supabase,
  bolaoState,
}: Props) {
  return (
    <>
      <ScoreboardV2
        homeScore={score.home}
        awayScore={score.away}
        homeTeamName={config.homeTeamName}
        awayTeamName={config.awayTeamName}
        homeColor={config.homeColor}
        awayColor={config.awayColor}
        timer={timer}
        status={status}
        onToggleTimer={toggleTimer}
        onStopMatch={async () => {
          setStartTime(null);
          setAccumulatedTime(0);
          setTimer(0);
          setStatus('Pausada');
          if (matchId) await matchRepo.update(matchId, { status: 'Finalizada', timer_seconds: 0, timer_started_at: null });
        }}
        onUpdateConfig={updates => {
          if (updates.homeScore !== undefined || updates.awayScore !== undefined) {
            const ns = { home: updates.homeScore ?? score.home, away: updates.awayScore ?? score.away };
            setScore(ns);
            if (matchId) matchRepo.update(matchId, { home_score: ns.home, away_score: ns.away });
          } else {
            setConfig((prev: any) => ({ ...prev, ...updates }));
          }
        }}
      />

      <MatchBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        waitingCount={teamsQueue.length}
      />

      <div className="mt-8">
        {activeTab === 'bolao' && bolaoState && (
          <BolaoTab bolaoState={bolaoState} />
        )}

        {activeTab === 'attendance' && (
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
            matchType={matchType === 'desafio' ? 'desafio' : 'rachao'}
            setSelectedPlayerIds={setSelectedPlayerIds}
            playersPerTeam={SPORT_PLAYERS[config.sport_type] ?? config.playersPerTeam}
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

        {activeTab === 'match' && (
          <ActiveMatchTab
            draftResult={draftResult}
            config={config}
            setConfig={setConfig}
            score={score}
            timer={timer}
            status={status}
            setActiveTab={setActiveTab}
            matchType={matchType === 'desafio' ? 'desafio' : 'rachao'}
            onStartMatch={status === 'Agendada' ? toggleTimer : undefined}
            homeFormation={homeFormation}
            awayFormation={awayFormation}
            events={events}
            liveUrl={typeof window !== 'undefined' && matchId ? `${window.location.origin}/${slug}/ao-vivo/${matchId}` : undefined}
            arbitroUrl={typeof window !== 'undefined' && matchId ? `${window.location.origin}/${slug}/arbitro/${matchId}` : undefined}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            userRole={userRole}
            handleNewMatch={handleNewMatch}
            draftResult={draftResult}
            setSelectedEventType={setSelectedEventType}
            setIsEventModalOpen={setIsEventModalOpen}
            events={events}
            onElectMVP={handleElectMVP}
            mvpPlayerId={mvpPlayerId}
            comments={comments}
            currentUserName={currentUserName}
            onAddComment={handleAddComment}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            setConfig={setConfig}
            handleSaveConfig={handleSaveConfig}
            loading={loading}
            userRole={userRole}
            editorInput={editorInput}
            setEditorInput={setEditorInput}
            editors={editors}
            setEditors={setEditors}
            groupId={groupId}
            groupRepo={groupRepo}
            supabase={supabase}
          />
        )}
      </div>
    </>
  );
}
