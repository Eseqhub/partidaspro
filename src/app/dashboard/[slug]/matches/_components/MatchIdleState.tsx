import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFutbol } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';

interface Props {
  userRole: string;
  onCreateMatch: () => void;
}

export function MatchIdleState({ userRole, onCreateMatch }: Props) {
  return (
    <div className="py-24 text-center">
      <GlassCard className="max-w-md mx-auto p-8 border-dashed border-white/20">
        <FontAwesomeIcon icon={faFutbol} className="text-5xl text-white/10 mb-6" />
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">
          Nenhuma partida rolando
        </h3>
        <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-8">
          Crie uma partida para iniciar o sorteio ou escalar os times.
        </p>
        {userRole !== 'viewer' && (
          <button
            onClick={onCreateMatch}
            className="px-8 py-4 w-full bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> CRIAR NOVA PARTIDA
          </button>
        )}
      </GlassCard>
    </div>
  );
}
