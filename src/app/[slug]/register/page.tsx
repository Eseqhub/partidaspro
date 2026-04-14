'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
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
  faFutbol,
  faArrowRight,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import { Group } from '@/core/entities/group';

export default function PlayerRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const playerRepo = new PlayerRepository();
  const groupRepo = new GroupRepository();

  const [group, setGroup] = useState<Group | null>(null);
  const [form, setForm] = useState({
    name: '',
    full_name: '',
    nationality: 'Brasil',
    preferred_foot: 'R' as 'L' | 'R' | 'Ambidestro',
    positions: ['MO'] as any[],
    height: '',
    weight: '',
    photo_url: ''
  });

  // Estado separado para os 3 campos da data de nascimento
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);

  useEffect(() => {
    async function load() {
        const groupData = await groupRepo.findBySlug(slug);
        if (!groupData) {
            router.push('/404');
            return;
        }
        setGroup(groupData);

        const hasAccess = sessionStorage.getItem(`access_${groupData.id}`);
        if (!hasAccess) {
            setAccessDenied(true);
            setTimeout(() => router.push(`/${slug}/join`), 2000);
        }
    }
    load();
  }, [slug, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!group) return '';
    const fileExt = file.name.split('.').pop();
    const fileName = `${group.id}_${Date.now()}.${fileExt}`;
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
    if (!group) return;
    if (group.rules_text && !acceptedRules) {
        alert('Você precisa aceitar as regras do clube para continuar.');
        return;
    }
    setLoading(true);

    try {
      let photoUrl = form.photo_url;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Montar data de nascimento apenas se os 3 campos estiverem preenchidos
      const birth_date = (birthDay && birthMonth && birthYear)
        ? `${birthYear}-${birthMonth}-${birthDay}`
        : undefined;

      const newPlayer = await playerRepo.create({
        group_id: group.id,
        name: form.name.substring(0, 15), // Limite para card
        full_name: form.full_name,
        nationality: form.nationality,
        birth_date,
        preferred_foot: form.preferred_foot,
        positions: form.positions,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        photo_url: photoUrl,
        rating: 3.0,
        status: 'Ativo',
        is_mensalista: false
      });

      // Auto-confirmar na partida do link ou na próxima disponível
      const urlMatchId = new URLSearchParams(window.location.search).get('matchId');
      let targetMatchId = urlMatchId;

      if (!targetMatchId) {
        const { data: nextMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('group_id', group.id)
            .eq('status', 'Agendada')
            .order('date', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (nextMatch) targetMatchId = nextMatch.id;
      }

      if (targetMatchId) {
         await supabase.from('match_presence').insert({
            match_id: targetMatchId,
            player_id: newPlayer.id,
            status: 'Confirmado'
         });
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied || !group) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">
            {accessDenied ? 'ACESSO NEGADO. REDIRECIONANDO...' : 'SINCRONIZANDO ESTAÇÃO...'}
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,255,0,0.05)_0%,transparent_70%)]" />
        <div className="max-w-md w-full text-center relative z-10">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-8 scale-110 shadow-[0_0_50px_rgba(204,255,0,0.2)]">
                <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-4xl" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">CADASTRO REALIZADO!</h1>
            <p className="text-white/60 mb-10 px-4 leading-relaxed font-medium">
                Seu Card de Atleta foi criado com sucesso no <span className="text-primary font-bold">{group.name}</span>. O organizador já pode te visualizar no elenco.
            </p>
            
            <Button 
                variant="primary" 
                className="w-full py-5 uppercase font-black tracking-widest text-xs text-slate-950"
                onClick={() => router.push('/')}
            >
                VOLTAR PARA O INÍCIO
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -mr-[400px] -mt-[400px]" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 border border-primary/20 bg-black/40 p-1">
                    {group.logo_url ? (
                        <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-xl" />
                    )}
                </div>
                <div className="h-[1px] w-8 bg-primary/20" />
                <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em]">{group.name}</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">CADASTRO DE <span className="text-primary italic">ATLETA</span></h1>
            <p className="text-white/40 text-[10px] mt-4 font-bold uppercase tracking-[0.2em]">Crie sua ficha técnica para o próximo jogo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassCard className="p-8 md:p-12 space-y-10 border-primary/5">
            {/* Photo Section */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-input')?.click()}>
                    <div className="w-32 h-32 md:w-40 md:h-40 border-2 border-white/5 bg-black/60 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <FontAwesomeIcon icon={faCamera} className="text-white/10 text-4xl" />
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Câmera / Galeria</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-950/80 px-4 py-2">Mudar Foto</span>
                        </div>
                    </div>
                    {/* capture="user" abre câmera frontal no mobile; sem esse atributo só abre galeria */}
                    <input id="photo-input" type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                </div>
                <p className="text-[8px] text-white/20 mt-4 uppercase font-black tracking-widest">Limite de arquivo: 5MB (PNG/JPG)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[8px]" /> Nome de Guerra
                    </label>
                    <input 
                        type="text" 
                        required
                        placeholder="EX: RONALDINHO" 
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})}
                        className="w-full bg-black/40 border border-white/10 p-4 text-white uppercase font-bold focus:border-primary/50 outline-none transition-colors"
                    />
                    <p className="text-[8px] text-white/20 uppercase font-black">Como você aparece no sorteio</p>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        Nome Completo
                    </label>
                    <input 
                        type="text" 
                        required
                        placeholder="NOME COMPLETO DO ATLETA" 
                        value={form.full_name}
                        onChange={(e) => setForm({...form, full_name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <FontAwesomeIcon icon={faGlobe} className="text-[8px]" /> Nacionalidade
                    </label>
                    <input 
                        type="text" 
                        value={form.nationality}
                        onChange={(e) => setForm({...form, nationality: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCakeCandles} className="text-[8px]" /> Nascimento
                    </label>
                    <div className="flex gap-2">
                        {/* DIA - valor como string padded ("01") para match exato com o state */}
                        <select 
                            className="flex-1 bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none font-bold"
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value)}
                            required
                        >
                            <option value="">DIA</option>
                            {Array.from({ length: 31 }, (_, i) => {
                                const val = String(i + 1).padStart(2, '0');
                                return <option key={val} value={val}>{i + 1}</option>;
                            })}
                        </select>

                        {/* MÊS - valor como string padded ("01") */}
                        <select 
                            className="flex-1 bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none font-bold"
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                            required
                        >
                            <option value="">MÊS</option>
                            {Array.from({ length: 12 }, (_, i) => {
                                const val = String(i + 1).padStart(2, '0');
                                return <option key={val} value={val}>{i + 1}</option>;
                            })}
                        </select>

                        {/* ANO */}
                        <select 
                            className="flex-[1.5] bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none font-bold"
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            required
                        >
                            <option value="">ANO</option>
                            {Array.from({ length: 60 }, (_, i) => (
                                <option key={i} value={String(2015 - i)}>{2015 - i}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Pé Preferencial
                    </label>
                    <select 
                        value={form.preferred_foot}
                        onChange={(e) => setForm({...form, preferred_foot: e.target.value as any})}
                        className="w-full bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none cursor-pointer"
                    >
                        <option value="R">DESTRO (DIREITO)</option>
                        <option value="L">CANHOTO (ESQUERDO)</option>
                        <option value="Ambidestro">AMBIDESTRO</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <FontAwesomeIcon icon={faFutbol} className="text-[8px]" /> Posição Tática
                    </label>
                    <select 
                        value={form.positions[0]}
                        onChange={(e) => setForm({...form, positions: [e.target.value]})}
                        className="w-full bg-slate-900 border border-primary/20 p-4 text-primary font-bold focus:border-primary/50 outline-none appearance-none cursor-pointer"
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
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <FontAwesomeIcon icon={faRulerVertical} className="text-[8px]" /> Altura (M)
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            placeholder="1.80" 
                            value={form.height}
                            onChange={(e) => setForm({...form, height: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <FontAwesomeIcon icon={faWeightHanging} className="text-[8px]" /> Peso (KG)
                        </label>
                        <input 
                            type="number" 
                            placeholder="80" 
                            value={form.weight}
                            onChange={(e) => setForm({...form, weight: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {group?.rules_text && (
              <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="bg-black/40 border border-white/10 p-4 rounded text-left">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faShieldHalved}/> Estatuto e Regras do Clube
                      </h3>
                      <div className="text-white/60 text-xs h-24 overflow-y-auto pr-2 mb-4 whitespace-pre-wrap font-mono leading-relaxed">
                          {group.rules_text}
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group/rules">
                          <input 
                              type="checkbox" 
                              checked={acceptedRules} 
                              onChange={(e) => setAcceptedRules(e.target.checked)}
                              className="w-4 h-4 bg-black/40 border border-white/20 checked:bg-primary outline-none"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover/rules:text-white transition-colors">Li e aceito as regras e multas do grupo</span>
                      </label>
                  </div>
              </div>
            )}

            <div className="pt-10 border-t border-white/5">
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full py-6 font-black uppercase tracking-widest text-sm text-slate-950 shadow-[0_4px_30px_rgba(204,255,0,0.15)] group relative overflow-hidden"
                    disabled={loading}
                >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? 'SINCRONIZANDO DADOS...' : 'FINALIZAR MEU CARD'}
                        {!loading && <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-2 transition-transform" />}
                    </div>
                    {/* Gloss effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
            </div>
          </GlassCard>
        </form>

        <p className="text-center mt-12 text-[10px] text-white/10 font-bold uppercase tracking-[0.5em]">
          PARTIDAS PRO &copy; 2026 | PERFORMANCE & DATA
        </p>
      </div>
    </div>
  );
}
