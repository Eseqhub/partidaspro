'use client';

import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faShieldHalved, faCamera, faLink } from '@fortawesome/free-solid-svg-icons';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { supabase } from '@/infra/supabase/client';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ownerId: string;
}

export function CreateGroupModal({ isOpen, onClose, onSuccess, ownerId }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [invitePassword, setInvitePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const groupRepo = new GroupRepository();

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${ownerId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('club-logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('club-logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = '';
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      await groupRepo.create({
        name,
        slug,
        owner_id: ownerId,
        logo_url: logoUrl,
        invite_password: requirePassword ? invitePassword : '', 
        is_paid_model: false
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao criar clube. Nome ou URL podem já estar em uso.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="max-w-md w-full p-8 relative border-primary/20 bg-slate-950">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Fundar Novo Clube</h2>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Inicie sua jornada organizacional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="w-24 h-24 bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center relative cursor-pointer group hover:border-primary/40 transition-all"
              onClick={() => document.getElementById('logo-input')?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faCamera} className="text-white/20 text-2xl" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[8px] font-black text-white uppercase">Mudar Escudo</span>
              </div>
            </div>
            <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Nome do Clube</label>
            <div className="relative">
              <FontAwesomeIcon icon={faShieldHalved} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="EX: TAPA DE QUALIDADE"
                className="w-full bg-black/40 border border-white/10 p-4 pl-12 text-white uppercase font-bold focus:border-primary/50 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Endereço (URL)</label>
            <div className="relative">
              <FontAwesomeIcon icon={faLink} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="slug-do-clube"
                className="w-full bg-black/40 border border-white/10 p-4 pl-12 text-white font-mono text-xs focus:border-primary/50 outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Privacidade</span>
                <button 
                  type="button"
                  onClick={() => setRequirePassword(!requirePassword)}
                  className={`relative w-10 h-5 transition-colors duration-200 rounded-none ${requirePassword ? 'bg-primary' : 'bg-white/10'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 transition-transform duration-200 bg-slate-950 ${requirePassword ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>
             
             {requirePassword && (
               <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-primary mb-2 italic">Definir Senha de Convite</label>
                  <input
                    type="password"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="SENHA PARA JOGADORES..."
                    className="w-full bg-black/40 border border-primary/20 p-3 text-white font-bold focus:border-primary/50 outline-none text-xs"
                    required
                  />
               </div>
             )}
             <p className="text-[8px] text-white/20 mt-2 font-bold uppercase">{requirePassword ? 'Apenas quem tiver a senha poderá se inscrever.' : 'Qualquer pessoa com o link poderá se inscrever.'}</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-4 text-slate-950 font-black uppercase tracking-widest text-sm"
            disabled={loading}
          >
            {loading ? 'FUNDANDO CLUBE...' : 'FUNDAR CLUBE'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
