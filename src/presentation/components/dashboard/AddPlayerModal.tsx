'use client';

import React, { useState } from 'react';
import { Player, PlayerPositionV2 } from '@/core/entities/player';
import { Modal } from '@/presentation/components/ui/Modal';
import { Input } from '@/presentation/components/ui/Input';
import { Button } from '@/presentation/components/ui/Button';
import { PositionSelector } from './PositionSelector';
import { PhotoUploader } from '@/presentation/components/ui/PhotoUploader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faSave, faArrowsUpDown, faWeightHanging, faFutbol } from '@fortawesome/free-solid-svg-icons';

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
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [rating, setRating] = useState(3);
  const [positions, setPositions] = useState<PlayerPositionV2[]>([]);
  const [isMensalista, setIsMensalista] = useState(true);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [preferredFoot, setPreferredFoot] = useState<'L' | 'R' | 'Ambidestro'>('R');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 2) {
      if (val.length > 6) val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
      else val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    setPhone(val);
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length >= 5) val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    else if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    setBirthDate(val);
  };

  const handleSave = () => {
    if (!name || positions.length === 0) {
      alert('Favor preencher NOME e ao menos UMA posição.');
      return;
    }

    onSave({
      group_id: groupId,
      name,
      phone: phone || undefined,
      birth_date: birthDate.length === 10 ? birthDate : undefined,
      photo_url: photoUrl || undefined,
      rating,
      positions,
      status: 'Ativo',
      is_mensalista: isMensalista,
      height: height ? parseFloat(height.replace(',', '.')) : undefined,
      weight: weight ? parseFloat(weight.replace(',', '.')) : undefined,
      preferred_foot: preferredFoot,
    });
    
    // Reset
    setName(''); setPhone(''); setBirthDate(''); setPhotoUrl(null); setRating(3); setPositions([]); setHeight(''); setWeight(''); setPreferredFoot('R');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RECRUTAR ATLETA">
      <div className="space-y-6 pb-6 max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
        <PhotoUploader onPhotoSelected={setPhotoUrl} />

        <Input 
          label="Nome do Atleta" 
          placeholder="EX: RONALDINHO GAÚCHO..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Celular / WhatsApp" 
            placeholder="(11) 99999-9999" 
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
          />
          <Input 
            label="Data Nasc." 
            placeholder="DD/MM/AAAA" 
            value={birthDate}
            onChange={handleBirthDateChange}
          />
        </div>

        {/* Informações Técnicas */}
        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
                <Input 
                    label="Altura (m)" 
                    placeholder="1.80" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                />
                <FontAwesomeIcon icon={faArrowsUpDown} className="absolute right-3 bottom-4 text-white/10" />
            </div>
            <div className="relative">
                <Input 
                    label="Peso (kg)" 
                    placeholder="75.5" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                />
                <FontAwesomeIcon icon={faWeightHanging} className="absolute right-3 bottom-4 text-white/10" />
            </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
            Pé Preferencial
          </label>
          <div className="flex gap-2 p-1 bg-white/5 border border-white/10">
            {(['R', 'L', 'Ambidestro'] as const).map((foot) => (
              <button
                key={foot}
                type="button"
                onClick={() => setPreferredFoot(foot)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  preferredFoot === foot ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {foot === 'R' ? 'Destro' : foot === 'L' ? 'Canhoto' : 'Ambidestro'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
            Nível de Habilidade (1-5)
          </label>
          <div className="flex items-center justify-between bg-white/5 p-4 border border-white/10">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-xl transition-all ${
                    rating >= star ? 'text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]' : 'text-white/10'
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

        <div 
            className="flex items-center justify-between bg-white/5 p-4 border border-white/10 mt-4 hover:border-primary/50 transition-all cursor-pointer" 
            onClick={() => setIsMensalista(!isMensalista)}
        >
            <div className="flex items-center gap-3">
              <div 
                  className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                      isMensalista ? 'bg-primary border-primary' : 'bg-transparent border-white/20'
                  }`}
              >
                  {isMensalista && <div className="w-2 h-2 bg-black" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Atleta Mensalista</span>
            </div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              {isMensalista ? 'MENSAL PAGO' : 'PAGA POR DIA'}
            </span>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full py-6 font-black uppercase tracking-[0.3em] text-xs bg-primary text-black hover:bg-primary/80 transition-all gap-3 border-none shadow-[0_0_30px_rgba(204,255,0,0.15)] mt-4"
        >
          <FontAwesomeIcon icon={faSave} /> FINALIZAR CADASTRO
        </Button>
      </div>
    </Modal>
  );
};
