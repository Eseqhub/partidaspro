'use client';

import React, { useState } from 'react';
import { Player, PlayerPositionV2 } from '@/core/entities/player';
import { Modal } from '@/presentation/components/ui/Modal';
import { Input } from '@/presentation/components/ui/Input';
import { Button } from '@/presentation/components/ui/Button';
import { PositionSelector } from './PositionSelector';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faSave } from '@fortawesome/free-solid-svg-icons';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Omit<Player, 'id' | 'created_at'>) => void;
  groupId: string;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  groupId 
}) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(3);
  const [positions, setPositions] = useState<PlayerPositionV2[]>([]);
  const [isMensalista, setIsMensalista] = useState(true);

  const handleSave = () => {
    if (!name || positions.length === 0) {
      alert('Favor preencher nome e ao menos uma posição.');
      return;
    }

    onSave({
      group_id: groupId,
      name,
      rating,
      positions,
      status: 'Ativo',
      is_mensalista: isMensalista,
    });
    
    // Reset fields
    setName('');
    setRating(3);
    setPositions([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RECRUTAR ATLETA">
      <div className="space-y-6">
        <Input 
          label="Nome do Atleta" 
          placeholder="EX: RONALDINHO GAÚCHO..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
            Nível de Habilidade (1-5)
          </label>
          <div className="flex items-center gap-4 bg-white/5 p-4 border border-white/10">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-xl transition-all ${
                    rating >= star ? 'text-primary' : 'text-white/10'
                  }`}
                >
                  <FontAwesomeIcon icon={faStar} />
                </button>
              ))}
            </div>
            <span className="text-xl font-black text-white italic">{rating.toFixed(1)}</span>
          </div>
        </div>

        <PositionSelector 
          selectedPositions={positions}
          onChange={setPositions}
          max={3}
        />

        <div className="flex items-center gap-3 bg-white/5 p-4 border border-white/10 mb-8">
            <button 
                type="button"
                onClick={() => setIsMensalista(!isMensalista)}
                className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                    isMensalista ? 'bg-primary border-primary' : 'bg-transparent border-white/20'
                }`}
            >
                {isMensalista && <div className="w-2 h-2 bg-black" />}
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Atleta Mensalista</span>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full py-6 font-black uppercase tracking-[0.3em] text-xs bg-primary text-black hover:bg-primary/80 transition-all gap-3 border-none shadow-[0_0_30px_rgba(204,255,0,0.15)]"
        >
          <FontAwesomeIcon icon={faSave} /> FINALIZAR CADASTRO
        </Button>
      </div>
    </Modal>
  );
};
