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
  { value: 'LD', label: 'Lat. Direita', category: 'DEF' },
  { value: 'ZGD', label: 'Zag. Direita', category: 'DEF' },
  { value: 'ZAG', label: 'Zagueiro', category: 'DEF' },
  { value: 'ZGE', label: 'Zag. Esquerda', category: 'DEF' },
  { value: 'LE', label: 'Lat. Esquerda', category: 'DEF' },
  { value: 'VOL', label: 'Volante', category: 'MID' },
  { value: 'MC', label: 'Meia Central', category: 'MID' },
  { value: 'MD', label: 'Meia Direita', category: 'MID' },
  { value: 'ME', label: 'Meia Esquerda', category: 'MID' },
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
    // Tratar posições ZG legadas se vierem do bd:
    if (selectedPositions.includes(pos as any) || (pos === 'ZAG' && selectedPositions.includes('ZG' as any))) {
      onChange(selectedPositions.filter(p => p !== pos && p !== 'ZG' as any));
    } else if (selectedPositions.length < max) {
      onChange([...selectedPositions, pos]);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-6 w-full overflow-hidden">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
        Posições (Até {max})
      </label>
      <div className="grid grid-cols-4 gap-1.5 md:gap-2">
        {ALL_POSITIONS.map((pos) => {
          const isSelected = selectedPositions.includes(pos.value) || (pos.value === 'ZAG' && selectedPositions.includes('ZG' as any));
          return (
            <button
              key={pos.value}
              type="button"
              onClick={() => togglePosition(pos.value)}
              className={`py-2 px-1 text-[9px] md:text-[10px] font-black uppercase tracking-tighter border transition-all ${
                isSelected
                  ? 'bg-primary text-black border-primary'
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
              }`}
            >
              {pos.value}
              <span className="block text-[6px] md:text-[7px] opacity-40 mt-0.5 leading-none truncate overflow-hidden text-ellipsis px-1">{pos.label}</span>
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
