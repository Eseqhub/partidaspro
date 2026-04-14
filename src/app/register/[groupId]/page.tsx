'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { supabase } from '@/infra/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, 
  faUser, 
  faGlobe, 
  faCakeCandles, 
  faRulerVertical, 
  faWeightHanging,
  faCheckCircle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

export default function PlayerRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const playerRepo = new PlayerRepository();

  const [form, setForm] = useState({
    name: '',
    full_name: '',
    nationality: 'Brasil',
    birth_date: '',
    preferred_foot: 'R' as 'L' | 'R' | 'Ambidestro',
    positions: ['MO'] as any[],
    height: '',
    weight: '',
    photo_url: ''
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem(`access_${groupId}`);
    if (!hasAccess) {
      setAccessDenied(true);
      setTimeout(() => router.push(`/join/${groupId}`), 2000);
    }
  }, [groupId, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${groupId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('player-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = form.photo_url;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // 1. Criar Jogador
      const newPlayer = await playerRepo.create({
        group_id: groupId,
        name: form.name,
        full_name: form.full_name,
        nationality: form.nationality,
        birth_date: form.birth_date,
        preferred_foot: form.preferred_foot,
        positions: form.positions,
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        photo_url: photoUrl,
        rating: 3.0, // Default rating for new players
        status: 'Ativo',
        is_mensalista: false
      });

      // 2. Automático: Confirmar presença na próxima partida (Placeholder logic)
      // Aqui poderíamos buscar a próxima partida aberta do grupo e inserir no match_presence
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'Agendada')
        .order('date', { ascending: true })
        .limit(1)
        .single();

      if (nextMatch) {
         await supabase.from('match_presence').insert({
            match_id: nextMatch.id,
            player_id: newPlayer.id,
            status: 'Confirmado'
         });
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar cadastro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <p className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Acesso Negado. Redirecionando...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-6 scale-110">
                <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-4xl" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Inscrito com Sucesso!</h1>
            <p className="text-white/60 mb-8 px-4">Seu Card de Atleta foi criado e você já está na lista da próxima partida.</p>
            
            <Button 
                variant="glass" 
                className="w-full py-4 uppercase font-black tracking-widest text-xs"
                onClick={() => router.push('/')}
            >
                Voltar para Início
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Partidas<span className="text-primary">.Pro</span> | Card de Atleta</h1>
            <p className="text-white/40 text-sm mt-2">Preencha seus dados para o sorteio e estatísticas biométricas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassCard className="p-6 md:p-8 space-y-8">
            {/* Photo Section */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-input')?.click()}>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-none border-2 border-primary/20 bg-black/40 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <FontAwesomeIcon icon={faCamera} className="text-white/20 text-3xl" />
                        )}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black text-white uppercase">Mudar Foto</span>
                        </div>
                    </div>
                    <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} /> Nome (Como será chamado)
                    </label>
                    <input 
                        type="text" 
                        required
                        placeholder="EX: ZEQUI" 
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white uppercase font-bold focus:border-primary/40 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                        Nome Completo
                    </label>
                    <input 
                        type="text" 
                        required
                        placeholder="NOME COMPLETO" 
                        value={form.full_name}
                        onChange={(e) => setForm({...form, full_name: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faGlobe} /> Nacionalidade
                    </label>
                    <input 
                        type="text" 
                        value={form.nationality}
                        onChange={(e) => setForm({...form, nationality: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCakeCandles} /> Data de Nascimento
                    </label>
                    <input 
                        type="date" 
                        required
                        value={form.birth_date}
                        onChange={(e) => setForm({...form, birth_date: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                        Pé Preferencial
                    </label>
                    <select 
                        value={form.preferred_foot}
                        onChange={(e) => setForm({...form, preferred_foot: e.target.value as any})}
                        className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none appearance-none"
                    >
                        <option value="R">DESTRO (DIREITO)</option>
                        <option value="L">CANHOTO (ESQUERDO)</option>
                        <option value="Ambidestro">AMBIDESTRO</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                        Posição Principal
                    </label>
                    <select 
                        value={form.positions[0]}
                        onChange={(e) => setForm({...form, positions: [e.target.value]})}
                        className="w-full bg-black/20 border border-primary/20 p-3 text-primary font-bold focus:border-primary/40 outline-none appearance-none"
                    >
                        <option value="G">GOLEIRO</option>
                        <option value="ZG">ZAGUEIRO</option>
                        <option value="LE">LATERAL ESQUERDO</option>
                        <option value="LD">LATERAL DIREITO</option>
                        <option value="VOL">VOLANTE</option>
                        <option value="MO">MEIA</option>
                        <option value="PE">PONTA ESQUERDA</option>
                        <option value="PD">PONTA DIREITA</option>
                        <option value="CA">CENTROAVANTE</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faRulerVertical} /> Altura (M)
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            placeholder="1.80" 
                            required
                            value={form.height}
                            onChange={(e) => setForm({...form, height: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faWeightHanging} /> Peso (KG)
                        </label>
                        <input 
                            type="number" 
                            required
                            placeholder="80" 
                            value={form.weight}
                            onChange={(e) => setForm({...form, weight: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 p-3 text-white focus:border-primary/40 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full py-4 font-black uppercase tracking-widest text-sm"
                    disabled={loading}
                >
                    {loading ? 'SALVANDO ATLETA...' : 'FINALIZAR CADASTRO'}
                </Button>
            </div>
          </GlassCard>
        </form>
      </div>
    </div>
  );
}
