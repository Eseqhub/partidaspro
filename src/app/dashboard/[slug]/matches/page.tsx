'use client';
export const dynamic = 'force-dynamic';

import { supabase } from '@/infra/supabase/client';
import React from 'react';
import { MatchType } from '@/core/entities/match';
import { faTableList } from '@fortawesome/free-solid-svg-icons';
import { faPlus, faListCheck, faStopwatch, faFutbol, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tab } from '@/presentation/components/dashboard/matches/MatchBottomNav';
import { AddPlayerModal } from '@/presentation/components/dashboard/AddPlayerModal';
import { CreateMatchModal, CreateMatchConfig } from '@/presentation/components/dashboard/CreateMatchModal';
import { NextTeamModal } from '@/presentation/components/dashboard/matches/NextTeamModal';
import { TieBreakModal } from '@/presentation/components/dashboard/matches/TieBreakModal';
import { useParams } from 'next/navigation';

import { useMatchState } from './_components/useMatchState';
import { MatchIdleState } from './_components/MatchIdleState';
import { MatchSetupPhase } from './_components/MatchSetupPhase';
import { ActiveMatchSection } from './_components/ActiveMatchSection';
import { FinishMatchOverlay } from './_components/FinishMatchOverlay';
import { EventModal } from './_components/EventModal';
import { MatchToast } from '@/presentation/components/dashboard/matches/MatchToast';

export default function MatchPage() {
  const params = useParams();
  const slug = params.slug as string;

  const m = useMatchState(slug);

  const isBolao = m.config.game_mode === 'Bolão' && !!m.bolaoState;

  const tabs: Tab[] = [
    { id: 'attendance', label: 'Chamada',       icon: faListCheck, hidden: isBolao },
    { id: 'bolao',      label: 'Classificação', icon: faTableList, hidden: !isBolao },
    { id: 'match',      label: 'Partida',        icon: faStopwatch },
    { id: 'stats',      label: 'Sumula',         icon: faFutbol },
    { id: 'settings',   label: 'Ajustes',        icon: faGear },
  ].filter(t => !t.hidden) as Tab[];

  const sharedAttendanceProps = {
    matchType: m.matchType as 'rachao' | 'manual' | 'desafio',
    userRole: m.userRole,
    slug,
    matchId: m.matchId,
    allPlayers: m.allPlayers,
    selectedPlayerIds: m.selectedPlayerIds,
    togglePlayerAttendance: m.togglePlayerAttendance,
    setIsAddModalOpen: m.setIsAddModalOpen,
    guestInput: m.guestInput,
    setGuestInput: m.setGuestInput,
    guestPlayers: m.guestPlayers,
    setGuestPlayers: m.setGuestPlayers,
    handleDraft: m.handleDraft,
    setSelectedPlayerIds: m.setSelectedPlayerIds,
    playersPerTeam: m.SPORT_PLAYERS[m.config.sport_type] ?? m.config.playersPerTeam,
    availableFormations: m.availableFormations,
    homeFormation: m.homeFormation,
    awayFormation: m.awayFormation,
    homeTeamName: m.config.homeTeamName || 'Time A',
    awayTeamName: m.config.awayTeamName || 'Time B',
    onSelectHomeFormation: (id: string) => { const f = m.availableFormations.find(x => x.id === id); if (f) m.setHomeFormation(f); },
    onSelectAwayFormation: (id: string) => { const f = m.availableFormations.find(x => x.id === id); if (f) m.setAwayFormation(f); },
    teamAssignments: m.teamAssignments,
    onAssignPlayer: m.handleAssignPlayer,
    onConfirmTeams: m.handleConfirmTeams,
    onCancel: m.handleNewMatch,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-12 pb-32 relative font-inter">

      {/* Popup in-app de eventos/comentários ao vivo */}
      <MatchToast notification={m.notification} onDismiss={m.dismissNotification} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div />
        {m.sessionPhase === 'idle' && m.userRole !== 'viewer' && (
          <button
            onClick={() => m.setIsCreateMatchModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> CRIAR PARTIDA
          </button>
        )}
      </div>

      {/* ── FASE 1: Idle ─────────────────────────────────────────────────── */}
      {m.sessionPhase === 'idle' && (
        <MatchIdleState
          userRole={m.userRole}
          onCreateMatch={() => m.setIsCreateMatchModalOpen(true)}
        />
      )}

      {/* ── FASE 2: Setup (pré-sorteio) ──────────────────────────────────── */}
      {m.sessionPhase === 'setup' && (
        <MatchSetupPhase {...sharedAttendanceProps} />
      )}

      {/* ── FASE 3a: Partida criada mas SEM sorteio → chamada sem scoreboard ── */}
      {m.sessionPhase === 'active' && m.matchId && !m.draftResult && (
        <MatchSetupPhase {...sharedAttendanceProps} />
      )}

      {/* ── FASE 3b: Sorteio feito → scoreboard + tabs completos ────────── */}
      {m.sessionPhase === 'active' && m.matchId && m.draftResult && (
        <ActiveMatchSection
          score={m.score}
          config={m.config}
          setConfig={m.setConfig}
          timer={m.timer}
          status={m.status}
          matchId={m.matchId}
          matchRepo={m.matchRepo}
          toggleTimer={m.toggleTimer}
          setScore={m.setScore}
          setTimer={m.setTimer}
          setStartTime={m.setStartTime}
          setAccumulatedTime={m.setAccumulatedTime}
          setStatus={m.setStatus}
          activeTab={m.activeTab}
          setActiveTab={m.setActiveTab}
          tabs={tabs}
          teamsQueue={m.teamsQueue}
          draftResult={m.draftResult}
          matchType={m.matchType}
          homeFormation={m.homeFormation}
          awayFormation={m.awayFormation}
          events={m.events}
          comments={m.comments}
          currentUserName={m.currentUserName}
          handleAddComment={m.handleAddComment}
          slug={slug}
          allPlayers={m.allPlayers}
          selectedPlayerIds={m.selectedPlayerIds}
          togglePlayerAttendance={m.togglePlayerAttendance}
          setIsAddModalOpen={m.setIsAddModalOpen}
          guestInput={m.guestInput}
          setGuestInput={m.setGuestInput}
          guestPlayers={m.guestPlayers}
          setGuestPlayers={m.setGuestPlayers}
          handleDraft={m.handleDraft}
          setSelectedPlayerIds={m.setSelectedPlayerIds}
          availableFormations={m.availableFormations}
          homeTeamName={m.config.homeTeamName || 'Time A'}
          awayTeamName={m.config.awayTeamName || 'Time B'}
          onSelectHomeFormation={(id) => { const f = m.availableFormations.find(x => x.id === id); if (f) m.setHomeFormation(f); }}
          onSelectAwayFormation={(id) => { const f = m.availableFormations.find(x => x.id === id); if (f) m.setAwayFormation(f); }}
          SPORT_PLAYERS={m.SPORT_PLAYERS}
          userRole={m.userRole}
          handleNewMatch={m.handleNewMatch}
          setSelectedEventType={m.setSelectedEventType}
          setIsEventModalOpen={m.setIsEventModalOpen}
          handleElectMVP={m.handleElectMVP}
          mvpPlayerId={m.mvpPlayerId}
          loading={m.loading}
          handleSaveConfig={m.handleSaveConfig}
          editorInput={m.editorInput}
          setEditorInput={m.setEditorInput}
          editors={m.editors}
          setEditors={m.setEditors}
          groupId={m.groupId}
          groupRepo={m.groupRepo}
          supabase={supabase}
          bolaoState={m.bolaoState}
        />
      )}

      {/* Modal de desempate */}
      {m.tieBreakOpen && m.draftResult && (
        <TieBreakModal
          homeTeamName={m.config.homeTeamName || 'Time A'}
          awayTeamName={m.config.awayTeamName || 'Time B'}
          onClose={() => m.setTieBreakOpen(false)}
          onResolve={(winner) => { m.setTieBreakOpen(false); m.handleNextMatch(winner); }}
        />
      )}

      {/* Modal de seleção do próximo time */}
      {m.nextTeamCtx && m.draftResult && (
        <NextTeamModal
          outgoingTeamName={m.nextTeamCtx.outgoingName}
          incomingTeam={m.nextTeamCtx.incomingTeam}
          winnerTeam={m.nextTeamCtx.winnerResult === 'home' ? m.draftResult.homeTeam : m.draftResult.awayTeam}
          winnerTeamName={m.nextTeamCtx.winnerResult === 'home' ? (m.config.homeTeamName || 'Time A') : (m.config.awayTeamName || 'Time B')}
          availablePlayers={m.allPlayers.filter(p => m.selectedPlayerIds.includes(p.id))}
          playersPerTeam={m.SPORT_PLAYERS[m.config.sport_type] ?? m.config.playersPerTeam}
          onConfirm={m.confirmNextTeam}
          onCancel={() => m.setNextTeamCtx(null)}
        />
      )}

      {/* Overlay de fim de partida */}
      {m.status === 'Finalizada' && m.draftResult && m.sessionPhase === 'active' && m.bolaoState?.phase !== 'done' && !m.nextTeamCtx && !m.tieBreakOpen && (
        <FinishMatchOverlay
          homeTeamName={m.config.homeTeamName}
          awayTeamName={m.config.awayTeamName}
          homeColor={m.config.homeColor}
          awayColor={m.config.awayColor}
          score={m.score}
          draftResult={m.draftResult}
          mvpPlayerId={m.mvpPlayerId}
          computeScorers={m.computeScorers}
          onWinner={(winner) => m.handleNextMatch(winner)}
          onTieBreak={() => m.setTieBreakOpen(true)}
        />
      )}

      {/* Modal de eventos (Gols/Cartões) */}
      {m.isEventModalOpen && m.draftResult && (
        <EventModal
          draftResult={m.draftResult}
          homeTeamName={m.config.homeTeamName}
          awayTeamName={m.config.awayTeamName}
          selectedEventType={m.selectedEventType}
          setSelectedEventType={m.setSelectedEventType}
          onAddEvent={m.handleAddEvent}
          onClose={() => m.setIsEventModalOpen(false)}
        />
      )}

      {/* Modal de adicionar jogador */}
      <AddPlayerModal
        isOpen={m.isAddModalOpen}
        onClose={() => m.setIsAddModalOpen(false)}
        onSave={async p => {
          const np = await m.playerRepo.create(p);
          if (m.groupId) m.fetchPlayers(m.groupId);
          m.setSelectedPlayerIds([...m.selectedPlayerIds, np.id]);
          m.setIsAddModalOpen(false);
        }}
        groupId={m.groupId || ''}
      />

      {/* Modal de criação de partida */}
      <CreateMatchModal
        isOpen={m.isCreateMatchModalOpen}
        onClose={() => m.setIsCreateMatchModalOpen(false)}
        onCreateMatch={(cfg: CreateMatchConfig) => {
          m.setMatchType((cfg.match_type || 'rachao') as MatchType);
          m.setConfig((prev: any) => ({
            ...prev,
            duration:       cfg.duration,
            stoppage:       cfg.stoppage,
            goalLimit:      cfg.goalLimit,
            homeColor:      cfg.home_color,
            awayColor:      cfg.away_color,
            homeTeamName:   cfg.home_team_name,
            awayTeamName:   cfg.away_team_name,
            sport_type:     cfg.sport_type,
            game_mode:      cfg.game_mode,
            playersPerTeam: cfg.playersPerTeam,
            location:       cfg.location,
          }));
          m.setSessionPhase('setup');
          m.setActiveTab('attendance');
          m.setIsCreateMatchModalOpen(false);
        }}
      />
    </div>
  );
}
