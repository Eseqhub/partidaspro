'use client';

import React from 'react';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSquare } from '@fortawesome/free-solid-svg-icons';

interface AttendanceListProps {
  players: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({ 
  players, 
  selectedIds, 
  onToggle 
}) => {
  return (
    <div className="space-y-2 max-h-[55vh] md:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
      {players.length === 0 && (
        <div className="text-center py-10 text-white/20 uppercase font-black text-[10px] tracking-widest border border-dashed border-white/10">
          Nenhum atleta cadastrado no sistema
        </div>
      )}
      
      {players.map(player => {
        const isSelected = selectedIds.includes(player.id);
        return (
          <div 
            key={player.id}
            onClick={() => onToggle(player.id)}
            className={`flex items-center justify-between p-4 border transition-all cursor-pointer ${
              isSelected 
                ? 'bg-primary/10 border-primary/40 text-white' 
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center font-black text-xs">
                {player.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-tighter">{player.name}</p>
                <div className="flex gap-1 mt-1">
                  {player.positions.map(p => (
                    <span key={p} className="text-[7px] font-black opacity-40 border border-white/10 px-1 rounded-sm">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`w-6 h-6 border flex items-center justify-center transition-all ${
              isSelected ? 'bg-primary border-primary text-black' : 'border-white/20 text-transparent'
            }`}>
              <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
