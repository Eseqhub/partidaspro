import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faClock } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Player } from '@/core/entities/player';

interface WaitingListTabProps {
  teamsQueue: Player[][];
  config: any;
  draftResult: any;
}

export const WaitingListTab: React.FC<WaitingListTabProps> = ({
  teamsQueue,
  config,
  draftResult,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {teamsQueue.length === 0 ? (
        <GlassCard className="py-24 text-center border-dashed border-white/10 rounded-2xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faUserGroup} className="text-white/10 text-3xl" />
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">Fila de espera vazia</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-white/10 mt-2">Todos os atletas estão em campo</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} /> Próximos na Fila ({teamsQueue.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {teamsQueue.map((team, idx) => (
              <GlassCard key={idx} className={`p-4 flex flex-col gap-2 rounded-xl transition-all border-white/5 ${idx === 0 ? 'bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(204,255,0,0.05)]' : 'bg-white/[0.02]'}`}>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[9px] font-black ${idx === 0 ? 'bg-primary text-black' : 'bg-white/10 text-white/40'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">
                      {idx === 0 ? 'PRÓXIMO TIME' : 'AGUARDANDO'}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">{team.length} ATLETAS</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {team.map(p => (
                    <div key={p.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-white/60 uppercase tracking-tighter">
                      {p.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {config.game_mode === 'Rachão' && (
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <FontAwesomeIcon icon={faUserGroup} className="text-4xl" />
          </div>
          <div className="relative z-10">
            <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Regra de Revezamento</h4>
            <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed tracking-tight">
              Modo Rachão Ativo: O time que ganhar fica em campo por até 2 partidas seguidas. O perdedor vai para o final da fila.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
