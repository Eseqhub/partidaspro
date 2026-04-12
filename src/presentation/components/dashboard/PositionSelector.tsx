'use client';

import React from 'react';
import { PlayerPositionV2 } from '@/core/entities/player';

interface PositionSelectorProps {
  selectedPositions: PlayerPositionV2[];
  onChange: (positions: PlayerPositionV2[]) => void;
  max?: number;
}

const ALL_POSITIONS: { value: PlayerPositionV2; label: string; category: string }[] = [
  { value: 'G', label: 'Goleiro', category: 'DEF' },
  { value: 'LD', label: 'Lat. Direito', category: 'DEF' },
  { value: 'ZG', label: 'Zagueiro', category: 'DEF' },
  { value: 'LE', label: 'Lat. Esquerdo', category: 'DEF' },
  { value: 'VOL', label: 'Volante', category: 'MID' },
  { value: 'MD', label: 'Meia Direita', category: 'MID' },
  { value: 'MO', label: 'Meia Ofensivo', category: 'MID' },
  { value: 'PE', label: 'Ponta Esq.', category: 'ATK' },
  { value: 'PD', label: 'Ponta Dir.', category: 'ATK' },
  { value: 'SA', label: 'Seg. Atacante', category: 'ATK' },
  { value: 'CA', label: 'Centroavante', category: 'ATK' },
];

export const PositionSelector: React.FC<PositionSelectorProps> = ({ 
  selectedPositions, 
  onChange, 
  max = 3 
}) => {
  const togglePosition = (pos: PlayerPositionV2) => {
    if (selectedPositions.includes(pos)) {
      onChange(selectedPositions.filter(p => p !== pos));
    } else if (selectedPositions.length < max) {
      onChange([...selectedPositions, pos]);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
        Posições (Até {max})
      </label>
      <div className="grid grid-cols-3 gap-2">
        {ALL_POSITIONS.map((pos) => {
          const isSelected = selectedPositions.includes(pos.value);
          return (
            <button
              key={pos.value}
              type="button"
              onClick={() => togglePosition(pos.value)}
              className={`py-3 px-1 text-[10px] font-black uppercase tracking-tighter border transition-all ${
                isSelected
                  ? 'bg-primary text-black border-primary'
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
              }`}
            >
              {pos.value}
              <span className="block text-[7px] opacity-40 mt-0.5 leading-none">{pos.label}</span>
            </button>
          );
        })}
      </div>
      {selectedPositions.length === max && (
        <p className="text-[9px] text-primary/60 uppercase font-bold tracking-widest mt-2 px-1">
          Limite de {max} posições atingido
        </p>
      )}
    </div>
  );
};
