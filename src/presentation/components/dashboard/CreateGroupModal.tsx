'use client';

import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faShieldHalved, faCamera, faLink,
  faUser, faPhone, faEnvelope, faRulerVertical, faWeightHanging, faCakeCandles, faFutbol,
} from '@fortawesome/free-solid-svg-icons';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { supabase } from '@/infra/supabase/client';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ownerId: string;
}

export function CreateGroupModal({ isOpen, onClose, onSuccess, ownerId }: CreateGroupModalProps) {
  // Etapa 1 — Clube
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [invitePassword, setInvitePassword] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState<string>(new Date().getFullYear().toString());

  // Etapa 2 — Fundador (card do jogador)
  const [playerName, setPlayerName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'jogador' | 'tecnico' | 'tecnico_jogador'>('jogador');
  const [position, setPosition] = useState('CA');
  const [preferredFoot, setPreferredFoot] = useState<'L' | 'R' | 'Ambidestro'>('R');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [createdGroupId, setCreatedGroupId] = useState('');
  const [createdGroupSlug, setCreatedGroupSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const groupRepo  = new GroupRepository();
  const playerRepo = new PlayerRepository();

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const uploadFile = async (file: File, bucket: string, prefix: string) => {
    const ext  = file.name.split('.').pop();
    const path = `${prefix}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  // Etapa 1 — cria o grupo e avança
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = '';
      if (logoFile) logoUrl = await uploadFile(logoFile, 'club-logos', ownerId);

      const group = await groupRepo.create({
        name, slug, owner_id: ownerId,
        logo_url: logoUrl,
        invite_password: requirePassword ? invitePassword : '',
        is_paid_model: false,
        description,
        founded_year: parseInt(foundedYear) || new Date().getFullYear(),
      });

      setCreatedGroupId(group.id);
      setCreatedGroupSlug(group.slug);

      // Pré-preenche o email do fundador
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      setStep(2);
    } catch {
      alert('Erro ao criar clube. Nome ou URL podem já estar em uso.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2 — cria o card do fundador
  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { alert('Informe seu telefone/WhatsApp.'); return; }
    setLoading(true);
    try {
      let photoUrl = '';
      if (photoFile) photoUrl = await uploadFile(photoFile, 'player-photos', createdGroupId);

      const birth_date = (birthDay && birthMonth && birthYear)
        ? `${birthYear}-${birthMonth}-${birthDay}` : undefined;

      await playerRepo.create({
        group_id: createdGroupId,
        name: playerName.substring(0, 15),
        full_name: fullName,
        phone, email,
        role, birth_date,
        preferred_foot: preferredFoot,
        positions: [position] as any,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        photo_url: photoUrl,
        rating: 3,
        skill_level: 5,
        status: 'Ativo',
        is_mensalista: false,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar seu card de atleta.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1); setName(''); setSlug(''); setRequirePassword(false); setInvitePassword('');
    setLogoFile(null); setLogoPreview(null); setDescription('');
    setFoundedYear(new Date().getFullYear().toString());
    setPlayerName(''); setFullName(''); setPhone(''); setEmail('');
    setRole('jogador'); setPosition('CA'); setPreferredFoot('R');
    setHeight(''); setWeight(''); setBirthDay(''); setBirthMonth(''); setBirthYear('');
    setPhotoFile(null); setPhotoPreview(null); setCreatedGroupId(''); setCreatedGroupSlug('');
  };

  const handleClose = () => { onClose(); resetForm(); };

  if (!isOpen) return null;

  const inp = 'w-full bg-black/40 border border-white/10 p-3 text-white text-xs focus:border-primary/50 outline-none';
  const lbl = 'block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <GlassCard className="max-w-lg w-full p-8 relative border-primary/20 bg-slate-950 my-4">
        <button onClick={handleClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {/* Indicador de etapa */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                step === n ? 'bg-primary text-black' : step > n ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/30'
              }`}>{n}</div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${step === n ? 'text-primary' : 'text-white/20'}`}>
                {n === 1 ? 'Clube' : 'Seu Card'}
              </span>
              {n < 2 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* ── ETAPA 1: Dados do Clube ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Fundar Novo Clube</h2>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Etapa 1 de 2 — Dados do Clube</p>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-5">
              {/* Logo */}
              <div className="flex flex-col items-center mb-2">
                <div
                  className="w-20 h-20 bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center relative cursor-pointer group hover:border-primary/40 transition-all"
                  onClick={() => document.getElementById('logo-input')?.click()}>
                  {logoPreview
                    ? <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <FontAwesomeIcon icon={faCamera} className="text-white/20 text-xl" />}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[8px] font-black text-white uppercase">Escudo</span>
                  </div>
                </div>
                <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              <div>
                <label className={lbl}>Nome do Clube</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faShieldHalved} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                  <input type="text" value={name} onChange={e => handleNameChange(e.target.value)}
                    placeholder="EX: TAPA DE QUALIDADE"
                    className={`${inp} pl-9 uppercase font-bold`} required />
                </div>
              </div>

              <div>
                <label className={lbl}>Endereço (URL)</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLink} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                  <input type="text" value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="slug-do-clube" className={`${inp} pl-9 font-mono`} required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Descrição / Bio</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="O melhor racha da região..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>Fundação</label>
                  <input type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)}
                    placeholder="2024" className={inp} required />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Senha de convite</span>
                  <button type="button" onClick={() => setRequirePassword(!requirePassword)}
                    className={`relative w-10 h-5 transition-colors duration-200 rounded-none ${requirePassword ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-3 h-3 transition-transform duration-200 bg-slate-950 ${requirePassword ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {requirePassword && (
                  <input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)}
                    placeholder="SENHA PARA JOGADORES..."
                    className={`${inp} border-primary/20`} required />
                )}
                <p className="text-[8px] text-white/20 mt-2 font-bold uppercase">
                  {requirePassword ? 'Apenas quem tiver a senha poderá se inscrever.' : 'Qualquer pessoa com o link poderá se inscrever.'}
                </p>
              </div>

              <Button type="submit" variant="primary" className="w-full py-4 text-slate-950 font-black uppercase tracking-widest text-sm" disabled={loading}>
                {loading ? 'CRIANDO CLUBE...' : 'PRÓXIMO — MEU CARD →'}
              </Button>
            </form>
          </>
        )}

        {/* ── ETAPA 2: Card do Fundador ── */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Seu Card de Atleta</h2>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Etapa 2 de 2 — Você no elenco</p>
            </div>

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              {/* Foto */}
              <div className="flex flex-col items-center mb-2">
                <div className="relative cursor-pointer group" onClick={() => document.getElementById('player-photo-input')?.click()}>
                  <div className="w-20 h-20 border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-all">
                    {photoPreview
                      ? <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                      : <FontAwesomeIcon icon={faCamera} className="text-white/20 text-xl" />}
                  </div>
                  <input id="player-photo-input" type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                </div>
                <span className="text-[8px] text-white/20 mt-2 uppercase font-bold">Foto (opcional)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}><FontAwesomeIcon icon={faUser} className="mr-1" />Nome de Guerra</label>
                  <input type="text" required placeholder="RONALDINHO"
                    value={playerName} onChange={e => setPlayerName(e.target.value.toUpperCase())}
                    className={`${inp} uppercase font-bold`} />
                </div>
                <div>
                  <label className={lbl}>Nome Completo</label>
                  <input type="text" required placeholder="Nome completo"
                    value={fullName} onChange={e => setFullName(e.target.value)} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}><FontAwesomeIcon icon={faPhone} className="mr-1" />WhatsApp *</label>
                  <input type="tel" required placeholder="(11) 99999-9999"
                    value={phone} onChange={e => setPhone(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}><FontAwesomeIcon icon={faEnvelope} className="mr-1" />E-mail</label>
                  <input type="email" placeholder="voce@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} className={inp} />
                </div>
              </div>

              {/* Nascimento */}
              <div>
                <label className={lbl}><FontAwesomeIcon icon={faCakeCandles} className="mr-1" />Nascimento</label>
                <div className="flex gap-2">
                  <select value={birthDay} onChange={e => setBirthDay(e.target.value)}
                    className={`${inp} flex-1 appearance-none`} required>
                    <option value="">Dia</option>
                    {Array.from({ length: 31 }, (_, i) => {
                      const v = String(i + 1).padStart(2, '0');
                      return <option key={v} value={v}>{i + 1}</option>;
                    })}
                  </select>
                  <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
                    className={`${inp} flex-1 appearance-none`} required>
                    <option value="">Mês</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const v = String(i + 1).padStart(2, '0');
                      return <option key={v} value={v}>{i + 1}</option>;
                    })}
                  </select>
                  <select value={birthYear} onChange={e => setBirthYear(e.target.value)}
                    className={`${inp} flex-[1.5] appearance-none`} required>
                    <option value="">Ano</option>
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={String(2015 - i)}>{2015 - i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Função</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)}
                    className={`${inp} appearance-none cursor-pointer border-primary/20 text-primary font-bold`}>
                    <option value="jogador">Jogador</option>
                    <option value="tecnico">Técnico</option>
                    <option value="tecnico_jogador">Técnico que joga</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}><FontAwesomeIcon icon={faFutbol} className="mr-1" />Posição</label>
                  <select value={position} onChange={e => setPosition(e.target.value)}
                    className={`${inp} appearance-none cursor-pointer border-primary/20 text-primary font-bold`}>
                    <option value="G">Goleiro</option>
                    <option value="ZG">Zagueiro</option>
                    <option value="LE">Lateral Esquerdo</option>
                    <option value="LD">Lateral Direito</option>
                    <option value="VOL">Volante</option>
                    <option value="MO">Meia</option>
                    <option value="PE">Ponta Esquerda</option>
                    <option value="PD">Ponta Direita</option>
                    <option value="CA">Centroavante</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Pé</label>
                  <select value={preferredFoot} onChange={e => setPreferredFoot(e.target.value as any)}
                    className={`${inp} appearance-none cursor-pointer`}>
                    <option value="R">Destro</option>
                    <option value="L">Canhoto</option>
                    <option value="Ambidestro">Ambidestro</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}><FontAwesomeIcon icon={faRulerVertical} className="mr-1" />Altura (m)</label>
                  <input type="number" step="0.01" placeholder="1.80"
                    value={height} onChange={e => setHeight(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}><FontAwesomeIcon icon={faWeightHanging} className="mr-1" />Peso (kg)</label>
                  <input type="number" placeholder="80"
                    value={weight} onChange={e => setWeight(e.target.value)} className={inp} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-shrink-0 px-4 py-3 border border-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                  ← Voltar
                </button>
                <Button type="submit" variant="primary"
                  className="flex-1 py-3 text-slate-950 font-black uppercase tracking-widest text-sm" disabled={loading}>
                  {loading ? 'CRIANDO...' : 'FUNDAR CLUBE'}
                </Button>
              </div>
            </form>
          </>
        )}
      </GlassCard>
    </div>
  );
}
