'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { supabase } from '@/infra/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, faUser, faGlobe, faCakeCandles, 
  faRulerVertical, faWeightHanging, faCheckCircle,
  faFutbol, faShieldHalved, faSpinner, faSave, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { Group } from '@/core/entities/group';
import { Player, PlayerPositionV2 } from '@/core/entities/player';
import { PlayerStatsPanel } from '@/presentation/components/dashboard/PlayerStatsPanel';

const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';

export default function PlayerSelfEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const playerId = params.playerId as string;
  
  const playerRepo = new PlayerRepository();
  const groupRepo = new GroupRepository();

  const [group, setGroup] = useState<Group | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    full_name: '',
    nationality: '',
    preferred_foot: 'R' as 'L' | 'R' | 'Ambidestro',
    positions: [] as PlayerPositionV2[],
    height: '',
    weight: '',
    photo_url: ''
  });

  // Separate birth date
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const groupData = await groupRepo.findBySlug(slug);
        const playerData = await playerRepo.findById(playerId);

        if (!groupData || !playerData || playerData.group_id !== groupData.id) {
          setAccessDenied(true);
        } else {
          setGroup(groupData);
          setPlayer(playerData);
          
          setForm({
            name: playerData.name || '',
            full_name: playerData.full_name || '',
            nationality: playerData.nationality || '',
            preferred_foot: (playerData.preferred_foot as any) || 'R',
            positions: playerData.positions || [],
            height: playerData.height ? String(playerData.height) : '',
            weight: playerData.weight ? String(playerData.weight) : '',
            photo_url: playerData.photo_url || ''
          });

          if (playerData.birth_date) {
            const [y, m, d] = playerData.birth_date.split('-');
            if (y) setBirthYear(y);
            if (m) setBirthMonth(m);
            if (d) setBirthDay(d);
          }
        }
      } catch (err) {
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, playerId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !group) return;
    if (!file.type.startsWith('image/')) return alert('Apenas imagens.');
    if (file.size > 5 * 1024 * 1024) return alert('Máximo 5MB.');

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `players/${playerId}/avatar.${ext}`;
      const { error } = await supabase.storage.from('player-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      setForm(prev => ({ ...prev, photo_url: url }));
    } catch {
      alert('Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !player) return;
    setSaving(true);

    try {
      const birth_date = (birthDay && birthMonth && birthYear)
        ? `${birthYear}-${birthMonth}-${birthDay}`
        : null;

      await playerRepo.update(player.id, {
        name: form.name.substring(0, 15),
        full_name: form.full_name,
        nationality: form.nationality,
        birth_date: birth_date || undefined,
        preferred_foot: form.preferred_foot,
        positions: form.positions,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        photo_url: form.photo_url
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao atualizar os dados.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary mb-4" />
        <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">CARREGANDO PERFIL...</p>
      </div>
    );
  }

  if (accessDenied || !group || !player) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <p className="text-red-500 font-black uppercase tracking-[0.2em] text-sm text-center">
          Acesso Negado.<br/>Link Mágico Inválido ou Expirado.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -mr-[400px] -mt-[400px]" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Helper Toast para Sucesso */}
        {success && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500 text-green-400 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 z-50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <FontAwesomeIcon icon={faCheckCircle} /> ATUALIZAÇÃO SALVA COM SUCESSO!
          </div>
        )}

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
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">MEU <span className="text-primary italic">PERFIL</span></h1>
            <p className="text-white/40 text-[10px] mt-4 font-bold uppercase tracking-[0.2em]">Área exclusiva do Atleta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassCard className="p-8 md:p-12 space-y-10 border-primary/20">
            
            {/* Somente Leitura Infos (Status/Skill) */}
            <div className="flex flex-wrap gap-4 justify-center -mt-4 mb-4">
              <span className={`px-4 py-1 border font-black uppercase text-[9px] tracking-widest ${player.status === 'Ativo' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                {player.status}
              </span>
              {(player.skill_level || player.rating) && (
                <span className="px-4 py-1 border border-amber-500/30 text-amber-500 bg-amber-500/10 font-black uppercase text-[9px] tracking-widest">
                  HABILIDADE {(player.skill_level ?? (player.rating * 2))}/10
                </span>
              )}
            </div>

            {/* Photo Section */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
                    <div className="w-32 h-32 md:w-40 md:h-40 border-2 border-white/5 bg-black/60 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative">
                        {form.photo_url ? (
                            <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <FontAwesomeIcon icon={faCamera} className="text-white/10 text-4xl" />
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Câmera / Galeria</span>
                            </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-primary text-2xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-950/80 px-4 py-2">Mudar Foto</span>
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[8px]" /> Nome / Apelido
                    </label>
                    <input 
                        type="text" 
                        required
                        placeholder="EX: RONALDINHO" 
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})}
                        className="w-full bg-black/40 border border-white/10 p-4 text-white uppercase font-bold focus:border-primary/50 outline-none transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        Nome Completo
                    </label>
                    <input 
                        type="text" 
                        required
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
                        <select 
                            className="flex-1 bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none font-bold"
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value)}
                        >
                            <option value="">DIA</option>
                            {Array.from({ length: 31 }, (_, i) => {
                                const val = String(i + 1).padStart(2, '0');
                                return <option key={val} value={val}>{i + 1}</option>;
                            })}
                        </select>

                        <select 
                            className="flex-1 bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none font-bold"
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                        >
                            <option value="">MÊS</option>
                            {Array.from({ length: 12 }, (_, i) => {
                                const val = String(i + 1).padStart(2, '0');
                                return <option key={val} value={val}>{i + 1}</option>;
                            })}
                        </select>

                        <select 
                            className="flex-[1.5] bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 outline-none appearance-none font-bold"
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
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
                        <FontAwesomeIcon icon={faFutbol} className="text-[8px]" /> Posição Tática Principal
                    </label>
                    <select 
                        value={form.positions[0] || ''}
                        onChange={(e) => setForm({...form, positions: [e.target.value as PlayerPositionV2]})}
                        className="w-full bg-slate-900 border border-primary/20 p-4 text-primary font-bold focus:border-primary/50 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">-- Selecione --</option>
                        <option value="G">GOLEIRO</option>
                        <option value="ZAG">ZAGUEIRO</option>
                        <option value="LE">LATERAL ESQUERDO</option>
                        <option value="LD">LATERAL DIREITO</option>
                        <option value="VOL">VOLANTE</option>
                        <option value="MC">MEIA CENTRAL</option>
                        <option value="MO">MEIA OFENSIVO</option>
                        <option value="PE">PONTA ESQUERDA</option>
                        <option value="PD">PONTA DIREITA</option>
                        <option value="CA">CENTRO AVANTE</option>
                        <option value="SA">SEGUNDO ATACANTE</option>
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

            <div className="pt-10 border-t border-white/5">
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full py-6 font-black uppercase tracking-widest text-sm text-slate-950 shadow-[0_4px_30px_rgba(204,255,0,0.15)] transition-transform hover:scale-[1.01]"
                    disabled={saving || uploading}
                >
                    <div className="flex items-center justify-center gap-3">
                        {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                        {saving ? 'SALVANDO ALTERAÇÕES...' : 'SALVAR MEU PERFIL'}
                    </div>
                </Button>
            </div>
          </GlassCard>
        </form>

        {/* Estatísticas e Conquistas */}
        <GlassCard className="p-6 md:p-10 mt-6 border-white/10">
          <PlayerStatsPanel playerId={player.id} groupId={group.id} />
        </GlassCard>
      </div>
    </div>
  );
}
