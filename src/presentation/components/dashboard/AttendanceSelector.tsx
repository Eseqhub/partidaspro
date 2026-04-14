'use client';

import React from 'react';
import { Player } from '@/core/entities/player';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPlus, faCircle, faUserCheck } from '@fortawesome/free-solid-svg-icons';

interface AttendanceSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: string[];
  onToggle: (id: string) => void;
}

export const AttendanceSelector: React.FC<AttendanceSelectorProps> = ({
  allPlayers,
  selectedPlayerIds,
  onToggle
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
            <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
            Atletas do Grupo
        </h3>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 border border-white/5">
            {selectedPlayerIds.length} / {allPlayers.length} PRESENTES
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        {allPlayers.map((player) => {
          const isSelected = selectedPlayerIds.includes(player.id);
          return (
            <div 
              key={player.id}
              onClick={() => onToggle(player.id)}
              className={`flex items-center justify-between p-3 border transition-all cursor-pointer group ${
                isSelected 
                  ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(204,255,0,0.1)]' 
                  : 'bg-black/20 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-black/40 border border-white/10 overflow-hidden shrink-0">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 font-black">
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] transition-colors ${isSelected ? 'text-primary' : 'text-white/60 group-hover:text-white'}`}>
                    {player.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
                        {player.is_mensalista ? 'MENSALISTA' : 'AVULSO'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`w-6 h-6 border flex items-center justify-center transition-all ${
                isSelected ? 'bg-primary border-primary text-black' : 'bg-transparent border-white/20 text-white/10'
              }`}>
                <FontAwesomeIcon icon={isSelected ? faCheckCircle : faPlus} className="text-[10px]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
