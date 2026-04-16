import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faList, faPlus, faSquare } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { MatchEvent } from '@/core/entities/match';
import { DraftResult } from '@/core/services/DraftService';

interface StatsTabProps {
  userRole: string;
  handleNewMatch: () => void;
  draftResult: DraftResult | null;
  setSelectedEventType: (type: any) => void;
  setIsEventModalOpen: (open: boolean) => void;
  events: MatchEvent[];
}

export const StatsTab: React.FC<StatsTabProps> = ({
  userRole,
  handleNewMatch,
  draftResult,
  setSelectedEventType,
  setIsEventModalOpen,
  events,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Botão Registrar Evento */}
        <button 
          onClick={() => {
            if (userRole === 'viewer') {
              alert('Apenas donos e editores podem registrar eventos.');
              return;
            }
            if (!draftResult) {
              alert('Primeiro faça o sorteio dos times!');
              return;
            }
            setSelectedEventType('Gol');
            setIsEventModalOpen(true);
          }}
          className={`p-6 bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-3 group rounded-xl ${userRole === 'viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 bg-primary text-black flex items-center justify-center text-xl shadow-[0_0_20px_rgba(204,255,0,0.2)] rounded-lg">
            <FontAwesomeIcon icon={faFutbol} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Registrar Evento</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Gols, Assistências e Cartões</span>
        </button>

        {/* Feed da Partida */}
        <GlassCard className="p-6 border-white/5 bg-white/[0.02] rounded-xl flex flex-col">
          <h3 className="text-white/40 font-black uppercase tracking-widest text-[9px] mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faList} className="text-primary" /> Feed de Eventos
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar flex-1">
            {events.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">Nenhum registro</span>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-lg group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${event.team === 'home' ? 'bg-primary' : 'bg-white/40'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-black text-[10px] uppercase italic truncate max-w-[120px]">{(event as any).player?.name}</span>
                        <span className={`text-[7px] px-1.5 py-0.5 font-black uppercase tracking-widest leading-none rounded-[2px] ${
                          event.type === 'Gol' ? 'bg-primary text-black' : 
                          event.type.includes('Amarelo') ? 'bg-yellow-400 text-black' :
                          event.type.includes('Vermelho') ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'
                        }`}>
                          {event.type}
                        </span>
                      </div>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{event.minute}&apos; MIN</span>
                    </div>
                  </div>
                  <FontAwesomeIcon 
                    icon={event.type === 'Gol' ? faFutbol : faSquare} 
                    className={`text-xs shrink-0 ${
                      event.type === 'Gol' ? 'text-primary' : 
                      event.type.includes('Amarelo') ? 'text-yellow-400' :
                      event.type.includes('Vermelho') ? 'text-red-500' : 'text-white/20'
                    }`} 
                  />
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Botão Nova Rodada (Discreto no fundo) */}
      {userRole === 'owner' && (
        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={() => {
              if (confirm('Deseja realmente iniciar uma nova rodada?')) {
                handleNewMatch();
              }
            }}
            className="w-full flex items-center justify-center gap-4 py-4 bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all rounded-xl group"
          >
            <FontAwesomeIcon icon={faPlus} className="text-white/20 group-hover:text-red-500 text-xs transition-colors" />
            <span className="text-[9px] font-black uppercase text-white/20 group-hover:text-red-500 tracking-[0.3em] transition-colors">Reiniciar Rodada / Limpar Sorteio</span>
          </button>
        </div>
      )}
    </div>
  );
};
