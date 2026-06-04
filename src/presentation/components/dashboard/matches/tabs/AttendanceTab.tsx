import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShuffle, faTimes, faTableCells, faCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { AttendanceSelector } from '@/presentation/components/dashboard/AttendanceSelector';
import { FormationSelector } from '@/presentation/components/dashboard/FormationSelector';
import { GameStatusBanner } from '@/presentation/components/dashboard/matches/GameStatusBanner';
import { openWhatsApp } from '@/core/services/ShareService';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Player } from '@/core/entities/player';
import { Formation } from '@/presentation/components/dashboard/TacticalBoardV2/formations';

interface AttendanceTabProps {
  allPlayers: Player[];
  selectedPlayerIds: string[];
  togglePlayerAttendance: (id: string) => void;
  setIsAddModalOpen: (open: boolean) => void;
  slug: string;
  matchId: string | null;
  guestInput: string;
  setGuestInput: (val: string) => void;
  guestPlayers: string[];
  setGuestPlayers: (players: string[]) => void;
  handleDraft: () => void;
  userRole: string;
  matchType?: 'rachao' | 'desafio';
  setSelectedPlayerIds: (ids: string[]) => void;
  playersPerTeam?: number;
  // Formações
  homeFormations?: Formation[];
  awayFormations?: Formation[];
  homeFormationId?: string;
  awayFormationId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  onSelectHomeFormation?: (id: string) => void;
  onSelectAwayFormation?: (id: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  allPlayers,
  selectedPlayerIds,
  togglePlayerAttendance,
  setIsAddModalOpen,
  slug,
  matchId,
  guestInput,
  setGuestInput,
  guestPlayers,
  setGuestPlayers,
  handleDraft,
  userRole,
  matchType = 'rachao',
  setSelectedPlayerIds,
  playersPerTeam = 7,
  homeFormations,
  awayFormations,
  homeFormationId,
  awayFormationId,
  homeTeamName = 'Time A',
  awayTeamName = 'Time B',
  onSelectHomeFormation,
  onSelectAwayFormation,
}) => {
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddGuest = () => {
    const name = guestInput.trim();
    if (!name) return;
    setGuestPlayers([...guestPlayers, name]);
    setGuestInput('');
    setAddedToast(name);
    setTimeout(() => setAddedToast(null), 2000);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Vai dar jogo? */}
      {matchType !== 'desafio' && (
        <GameStatusBanner
          confirmed={selectedPlayerIds.length + guestPlayers.length}
          playersPerTeam={playersPerTeam}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registro de Jogador */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="p-6 bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-3 group rounded-xl"
        >
          <div className="w-12 h-12 bg-primary text-black flex items-center justify-center text-xl shadow-[0_0_20px_rgba(204,255,0,0.2)] group-hover:scale-110 transition-transform rounded-lg">
            <FontAwesomeIcon icon={faPlus} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Registrar Craque</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/20 text-center">Cadastro permanente no grupo</span>
        </button>

        {/* Link RSVP */}
        <GlassCard className="p-4 md:p-6 border-white/5 bg-white/[0.02] flex flex-col justify-center rounded-xl">
          <h3 className="text-white/40 font-black uppercase tracking-widest text-[9px] mb-3 flex items-center gap-2">
            Link de Inscrição (RSVP)
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="rsvp-link"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/join${matchId ? `?matchId=${matchId}` : ''}`}
              className="flex-1 bg-black/40 border border-white/10 p-3 text-[9px] font-mono text-primary/60 outline-none truncate min-w-0"
            />
            <Button
              onClick={() => {
                const link = (document.getElementById('rsvp-link') as HTMLInputElement).value;
                navigator.clipboard.writeText(link);
              }}
              className="bg-primary/20 text-primary px-4 py-3 font-black uppercase text-[10px] border-none hover:bg-primary hover:text-black transition-all shrink-0"
            >
              COPIAR
            </Button>
          </div>
        </GlassCard>
      </div>

      <AttendanceSelector 
        allPlayers={allPlayers}
        selectedPlayerIds={selectedPlayerIds}
        onToggle={togglePlayerAttendance}
        onReorder={setSelectedPlayerIds}
      />

      {/* Convidados / Avulsos */}
      <div className="border-t border-white/5 pt-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
            <FontAwesomeIcon icon={faUserPlus} className="text-primary" style={{ fontSize: 9 }} />
            Convidados / Avulsos
          </h3>
          {guestPlayers.length > 0 && (
            <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', background: 'rgba(204,255,0,0.1)',
              border: '1px solid rgba(204,255,0,0.25)', color: '#ccff00' }}>
              {guestPlayers.length} na lista
            </span>
          )}
        </div>

        {/* Input + botão inline */}
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={guestInput}
            onChange={e => setGuestInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddGuest(); }}
            placeholder="Nome do convidado..."
            className="flex-1 bg-white/5 border border-white/10 p-3 text-white font-bold text-[11px] outline-none focus:border-primary/40 focus:bg-primary/5 transition-all rounded-lg"
          />
          <button
            onClick={handleAddGuest}
            disabled={!guestInput.trim()}
            style={{
              padding: '0 18px', background: guestInput.trim() ? '#ccff00' : 'rgba(255,255,255,0.06)',
              color: guestInput.trim() ? '#000' : 'rgba(255,255,255,0.2)',
              border: 'none', fontWeight: 900, fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.15em', cursor: guestInput.trim() ? 'pointer' : 'not-allowed',
              borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            <FontAwesomeIcon icon={faPlus} /> ADD
          </button>
        </div>

        {/* Toast confirmação */}
        {addedToast && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 8,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8,
          }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: '#22c55e', fontSize: 10 }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {addedToast} adicionado!
            </span>
          </div>
        )}

        {/* Lista de convidados (mesmo estilo dos jogadores) */}
        {guestPlayers.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {guestPlayers.map((name, i) => (
              <div key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px',
                  background: 'rgba(204,255,0,0.06)', border: '1px solid rgba(204,255,0,0.2)',
                  borderRadius: 8, cursor: 'default' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(204,255,0,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: '#ccff00', flexShrink: 0 }}>
                  {name[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
                <span style={{ fontSize: 7, color: 'rgba(204,255,0,0.5)', fontWeight: 900, marginRight: 2 }}>
                  AVULSO
                </span>
                <button onClick={() => setGuestPlayers(guestPlayers.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)',
                    cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 9 }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {guestPlayers.length === 0 && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700, textAlign: 'center', padding: '12px 0' }}>
            Digite o nome e pressione ADD ou Enter
          </p>
        )}
      </div>

      {/* Seleção de Formações (só Rachão com formações disponíveis) */}
      {matchType !== 'desafio' && homeFormations && awayFormations && homeFormationId && awayFormationId && (
        <GlassCard className="p-5 border-white/5 bg-white/[0.02] rounded-xl space-y-5">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
            <FontAwesomeIcon icon={faTableCells} className="text-primary" />
            Formações dos Times
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {onSelectHomeFormation && (
              <FormationSelector
                formations={homeFormations}
                selected={homeFormationId}
                onSelect={onSelectHomeFormation}
                teamName={homeTeamName}
                teamColor="#ccff00"
              />
            )}
            {onSelectAwayFormation && (
              <FormationSelector
                formations={awayFormations}
                selected={awayFormationId}
                onSelect={onSelectAwayFormation}
                teamName={awayTeamName}
                teamColor="#00b4ff"
              />
            )}
          </div>
        </GlassCard>
      )}

      {/* Botão de Sorteio: apenas no Rachão */}
      {matchType !== 'desafio' && userRole !== 'viewer' && (() => {
        const total = selectedPlayerIds.length + guestPlayers.length;
        const ready = total >= 2;
        return (
          <button
            onClick={handleDraft}
            className={`w-full py-7 font-black uppercase tracking-[0.35em] text-sm flex items-center justify-center gap-4 border-none rounded-xl group relative overflow-hidden transition-all ${
              ready
                ? 'bg-gradient-to-r from-primary to-green-400 text-black hover:scale-[1.01] shadow-[0_0_40px_rgba(204,255,0,0.15)] cursor-pointer'
                : 'bg-white/5 text-white/30 cursor-pointer'
            }`}
          >
            <FontAwesomeIcon icon={faShuffle} className={`text-xl ${ready ? 'group-hover:rotate-180 transition-all duration-700' : ''}`} />
            {ready ? `Realizar Sorteio (${total})` : 'Selecione 2+ jogadores'}
          </button>
        );
      })()}

      {/* Modo Desafio: times já definidos */}
      {matchType === 'desafio' && userRole !== 'viewer' && (
        <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-xl text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-1">🏆 Modo Desafio Ativo
          </p>
          <p className="text-[10px] text-white/40">Os times são gerenciados pelo responsável de cada clube. Não há sorteio automático.</p>
        </div>
      )}
    </div>
  );
};
