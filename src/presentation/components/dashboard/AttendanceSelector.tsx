'use client';

import React, { useState } from 'react';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPlus, faUserCheck, faArrowUp, faArrowDown, faGripVertical } from '@fortawesome/free-solid-svg-icons';

interface AttendanceSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: string[];
  onToggle: (id: string) => void;
  onReorder?: (newOrder: string[]) => void;
}

export const AttendanceSelector: React.FC<AttendanceSelectorProps> = ({
  allPlayers,
  selectedPlayerIds,
  onToggle,
  onReorder
}) => {
  const moveUp = (index: number) => {
    if (!onReorder || index === 0) return;
    const newOrder = [...selectedPlayerIds];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorder(newOrder);
  };

  const moveDown = (index: number) => {
    if (!onReorder || index === selectedPlayerIds.length - 1) return;
    const newOrder = [...selectedPlayerIds];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    onReorder(newOrder);
  };

  const selectedPlayers = selectedPlayerIds
    .map(id => allPlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const unselectedPlayers = allPlayers.filter(p => !selectedPlayerIds.includes(p.id));

  // Estado para HTML5 Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // É necessário definir algum dado para que o drag funcione no Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !onReorder) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...selectedPlayerIds];
    const draggedId = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedId);
    
    onReorder(newOrder);
    setDraggedIndex(null);
  };

  // Função helper para renderizar a box de jogador reduzida
  const renderPlayerItem = (player: Player, isSelected: boolean, index?: number) => (
    <div 
      key={player.id}
      draggable={isSelected && !!onReorder}
      onDragStart={(e) => isSelected && index !== undefined && handleDragStart(e, index)}
      onDragOver={(e) => isSelected && index !== undefined && handleDragOver(e, index)}
      onDrop={(e) => isSelected && index !== undefined && handleDrop(e, index)}
      className={`flex items-center justify-between p-3 border transition-all group ${
        isSelected 
          ? `bg-primary/10 border-primary shadow-[0_0_15px_rgba(204,255,0,0.1)] ${draggedIndex === index ? 'opacity-50 scale-95' : 'cursor-grab active:cursor-grabbing'}`
          : 'bg-black/20 border-white/5 hover:border-white/20 cursor-pointer'
      }`}
      onClick={() => !isSelected && onToggle(player.id)}
    >
      <div className="flex items-center gap-3 w-full pointer-events-none">
        {isSelected && onReorder && (
          <FontAwesomeIcon icon={faGripVertical} className="text-white/20 group-hover:text-primary cursor-grab" />
        )}
        <div className="w-8 h-8 md:w-10 md:h-10 bg-black/40 border border-white/10 overflow-hidden shrink-0">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 font-black">
              {player.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] transition-colors ${isSelected ? 'text-primary' : 'text-white/60 group-hover:text-white'}`}>
            {index !== undefined && <span className="text-white/30 mr-2">#{index + 1}</span>}
            {player.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
                {player.is_mensalista ? 'MENSALISTA' : 'AVULSO'}
            </span>
          </div>
        </div>

        {/* Controles de Reordenação para os Presentes */}
        {isSelected && onReorder && index !== undefined && (
          <div className="flex flex-col gap-1 mr-2 px-2 border-r border-white/10 pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); moveUp(index); }}
              disabled={index === 0}
              className={`p-1 ${index === 0 ? 'text-white/10' : 'text-white/40 hover:text-primary transition-colors'}`}
            >
              <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); moveDown(index); }}
              disabled={index === selectedPlayers.length - 1}
              className={`p-1 ${index === selectedPlayers.length - 1 ? 'text-white/10' : 'text-white/40 hover:text-primary transition-colors'}`}
            >
              <FontAwesomeIcon icon={faArrowDown} className="text-[10px]" />
            </button>
          </div>
        )}

        <div 
          className={`w-6 h-6 border flex items-center justify-center transition-all pointer-events-auto cursor-pointer ${
            isSelected ? 'bg-primary border-primary text-black hover:bg-red-500 hover:border-red-500 hover:text-white' : 'bg-transparent border-white/20 text-white/10'
          }`}
          onClick={(e) => { e.stopPropagation(); onToggle(player.id); }}
          title={isSelected ? "Remover" : "Adicionar"}
        >
          <FontAwesomeIcon icon={isSelected ? faCheckCircle : faPlus} className="text-[10px]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Lista de Chegada (Presentes) */}
      <div className="space-y-4 border border-primary/20 bg-primary/5 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center">
              <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
              Lista de Chegada ({selectedPlayers.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
          {selectedPlayers.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[10px] text-primary/40 font-black uppercase tracking-widest border border-dashed border-primary/20">
              Nenhum jogador selecionado
            </div>
          ) : (
            selectedPlayers.map((player, idx) => renderPlayerItem(player, true, idx))
          )}
        </div>
      </div>

      {/* Não Marcados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">
              Elenco Disponível ({unselectedPlayers.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
          {unselectedPlayers.map((player) => renderPlayerItem(player, false))}
        </div>
      </div>
    </div>
  );
};
