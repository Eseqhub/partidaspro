import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShuffle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { AttendanceSelector } from '@/presentation/components/dashboard/AttendanceSelector';
import { Player } from '@/core/entities/player';

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
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
      />

      <div className="border-t border-white/5 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="text-primary" /> Atletas Avulsos
          </h3>
          <span className="text-[10px] text-white/20 font-bold bg-white/5 px-2 py-0.5 border border-white/5">
            {guestPlayers.length} ADICIONADOS
          </span>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            placeholder="NOME DO CONVIDADO..."
            className="flex-1 bg-white/5 border border-white/10 p-4 text-white uppercase font-black text-[10px] tracking-[0.2em] outline-none focus:border-primary/40 focus:bg-primary/5 transition-all rounded-lg"
          />
          <Button 
            onClick={() => {
              if (guestInput) {
                setGuestPlayers([...guestPlayers, guestInput]);
                setGuestInput('');
              }
            }}
            className="bg-primary text-black px-8 font-black uppercase tracking-widest border-none h-auto rounded-lg"
          >
            ADD
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guestPlayers.map((name, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 group hover:border-white/10 transition-all rounded-lg">
              <span className="text-[10px] font-black uppercase text-white/60 tracking-widest italic">{name}</span>
              <button 
                onClick={() => setGuestPlayers(guestPlayers.filter((_, idx) => idx !== i))}
                className="text-white/10 hover:text-red-500 transition-colors p-2"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleDraft}
        disabled={selectedPlayerIds.length < 2 && guestPlayers.length === 0}
        className={`w-full py-8 font-black uppercase tracking-[0.4em] text-sm bg-gradient-to-r from-primary to-green-400 text-black hover:scale-[1.01] transition-all gap-4 border-none shadow-[0_0_40px_rgba(204,255,0,0.15)] group relative overflow-hidden rounded-xl ${userRole === 'viewer' ? 'hidden' : ''}`}
      >
        <FontAwesomeIcon icon={faShuffle} className="text-xl group-hover:rotate-180 transition-all duration-700" />
        Realizar Sorteio PRO
      </Button>
    </div>
  );
};
