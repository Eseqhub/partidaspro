'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faFutbol, faClock } from '@fortawesome/free-solid-svg-icons';
import { Group } from '@/core/entities/group';

export default function MatchRSVPPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const matchId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success_in' | 'success_out' | 'error'>('pending');

  useEffect(() => {
     async function load() {
         const repo = new GroupRepository();
         const groupData = await repo.findBySlug(slug);
         if (groupData) setGroup(groupData);
     }
     load();
  }, [slug]);

  const handleRSVP = (isConfirm: boolean) => {
      if (!phoneNumber.trim() || phoneNumber.length < 8) {
          alert("Por favor, informe seu telefone de cadastro para te acharmos na lista.");
          return;
      }
      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          setStatus(isConfirm ? 'success_in' : 'success_out');
      }, 1000);
  };

  if (!group) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <div className="text-primary animate-pulse text-xs font-black tracking-widest uppercase">Consultando súmula...</div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        
        <div className="max-w-md w-full relative z-10 text-center">
            
            {status === 'pending' && (
                <>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-black/40 border border-primary/20 mb-6">
                         <FontAwesomeIcon icon={faFutbol} className="text-primary text-3xl" />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Convocação da Partida</h1>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-8">
                        {group.name} - Próximo Jogo
                    </p>

                    <GlassCard className="p-6">
                        <div className="mb-6">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2 text-left">
                                Celular Cadastrado
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="(11) 99999-9999"
                                className="w-full bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none text-center font-bold tracking-widest"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button 
                                onClick={() => handleRSVP(true)}
                                disabled={loading}
                                className="w-full bg-primary text-slate-950 font-black uppercase tracking-widest py-5 hover:bg-white transition-all border-none"
                            >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2"/> CONFIRMAR PRESENÇA
                            </Button>

                            <Button 
                                onClick={() => handleRSVP(false)}
                                disabled={loading}
                                className="w-full bg-red-600/20 text-red-500 font-black uppercase tracking-widest py-4 border border-red-500/20 hover:bg-red-600/40 transition-all"
                            >
                                <FontAwesomeIcon icon={faTimesCircle} className="mr-2"/> NÃO VOU PODER
                            </Button>
                        </div>
                    </GlassCard>
                </>
            )}

            {status === 'success_in' && (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full border border-primary text-primary text-4xl mb-6">
                        <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">ESCALADO!</h2>
                    <p className="text-primary/60 text-xs font-bold uppercase tracking-widest px-4">
                        Seu nome já está na lista automática do painel da pelada. 
                    </p>
                </div>
            )}

            {status === 'success_out' && (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 rounded-full border border-red-500 text-red-500 text-4xl mb-6">
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Poxa, que pena!</h2>
                    <p className="text-red-500/60 text-xs font-bold uppercase tracking-widest px-4">
                        Sua vaga foi liberada para a lista de espera. Até a próxima!
                    </p>
                </div>
            )}
        </div>
    </div>
  );
}
