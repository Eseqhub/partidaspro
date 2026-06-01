import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { DraftResult } from '@/core/services/DraftService';
import { EventType as CoreEventType } from '@/core/entities/match';

interface Props {
  draftResult: DraftResult;
  homeTeamName: string;
  awayTeamName: string;
  selectedEventType: CoreEventType;
  setSelectedEventType: (type: CoreEventType) => void;
  onAddEvent: (playerId: string, team: 'home' | 'away', type: CoreEventType) => void;
  onClose: () => void;
}

const EVENT_TYPES: CoreEventType[] = ['Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho'];

export function EventModal({
  draftResult, homeTeamName, awayTeamName,
  selectedEventType, setSelectedEventType,
  onAddEvent, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl p-8 rounded-3xl border-primary/20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-white uppercase italic">Registrar Evento</h2>
          <button onClick={onClose} className="text-white/20 hover:text-white">
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedEventType(type)}
              className={`flex-1 py-3 text-[9px] font-black uppercase rounded-lg transition-all ${
                selectedEventType === type ? 'bg-primary text-black' : 'text-white/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8">
          {(['home', 'away'] as const).map(side => (
            <div key={side} className="space-y-4">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                {side === 'home' ? (homeTeamName || 'TIME A') : (awayTeamName || 'TIME B')}
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {draftResult[side === 'home' ? 'homeTeam' : 'awayTeam'].map(p => (
                  <button
                    key={p.id}
                    onClick={() => onAddEvent(p.id, side, selectedEventType)}
                    className="w-full p-3 bg-white/5 border border-white/5 hover:border-primary/40 rounded-lg text-left group"
                  >
                    <span className="text-[10px] font-black text-white uppercase group-hover:text-primary">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
