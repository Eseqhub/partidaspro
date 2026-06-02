'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Player, PlayerPositionV2 } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCamera, faUser, faRuler, faWeight,
  faBirthdayCake, faPhone, faEnvelope, faShieldHalved, faStar,
  faCheckCircle, faTrashCan, faSpinner, faSave,
  faToggleOn, faToggleOff, faExclamationTriangle,
  faLink, faCopy, faBan
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/infra/supabase/client';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';

// ── Paleta ──────────────────────────────────────────────────────────────────
const neon  = '#ccff00';
const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';

// ── Posições disponíveis ─────────────────────────────────────────────────────
const ALL_POSITIONS: { value: PlayerPositionV2; label: string; group: string }[] = [
  { value: 'G',   label: 'Goleiro',           group: 'Defesa'   },
  { value: 'ZAG', label: 'Zagueiro',           group: 'Defesa'   },
  { value: 'LD',  label: 'Lateral Direito',    group: 'Defesa'   },
  { value: 'LE',  label: 'Lateral Esquerdo',   group: 'Defesa'   },
  { value: 'VOL', label: 'Volante',             group: 'Meio'     },
  { value: 'MC',  label: 'Meia Centro',         group: 'Meio'     },
  { value: 'MD',  label: 'Meia Direito',        group: 'Meio'     },
  { value: 'ME',  label: 'Meia Esquerdo',       group: 'Meio'     },
  { value: 'MO',  label: 'Meia Ofensivo',       group: 'Meio'     },
  { value: 'PD',  label: 'Ponta Direita',       group: 'Ataque'   },
  { value: 'PE',  label: 'Ponta Esquerda',      group: 'Ataque'   },
  { value: 'SA',  label: 'Segunda Atacante',    group: 'Ataque'   },
  { value: 'CA',  label: 'Centro Avante',       group: 'Ataque'   },
];

const POSITION_GROUPS = ['Defesa', 'Meio', 'Ataque'];

const POSITION_COLORS: Record<string, string> = {
  G: '#f59e0b', ZAG: '#3b82f6', LD: '#06b6d4', LE: '#06b6d4',
  VOL: '#8b5cf6', MC: '#8b5cf6', MO: '#ec4899', MD: '#ec4899', ME: '#ec4899',
  PE: green, PD: green, SA: green, CA: red,
};

// ── Estilos reutilizáveis ────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
  fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .2s',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' as const,
  letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginBottom: 5,
};
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
      {title}
    </p>
    {children}
  </div>
);

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  player: Player;
  isOwnerOrEditor: boolean;
  onClose: () => void;
  onSave: (updated: Player) => void;
  onDelete: (id: string) => void;
}

const repo = new PlayerRepository();

// ── Componente principal ─────────────────────────────────────────────────────
export const PlayerEditModal: React.FC<Props> = ({ player, isOwnerOrEditor, onClose, onSave, onDelete }) => {
  const [form,       setForm]       = useState<Partial<Player>>({ ...player });
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [toast,      setToast]      = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = useCallback((key: keyof Player, val: any) =>
    setForm(prev => ({ ...prev, [key]: val })), []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // Upload de foto para Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Apenas imagens são aceitas.');
    if (file.size > 5 * 1024 * 1024) return showToast('Imagem muito grande. Máx 5MB.');

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `players/${player.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('player-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      set('photo_url', url);
      showToast('✅ Foto atualizada!');
    } catch {
      showToast('Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return showToast('Nome obrigatório.');
    setSaving(true);
    try {
      const payload: Partial<Player> = {
        name:              form.name,
        full_name:         form.full_name,
        phone:             form.phone,
        email:             form.email,
        birth_date:        form.birth_date || undefined,
        height:            form.height ? Number(form.height) : undefined,
        weight:            form.weight ? Number(form.weight) : undefined,
        preferred_foot:    form.preferred_foot,
        posicao_principal: form.posicao_principal,
        positions:         form.positions,
        skill_level:       form.skill_level ? Number(form.skill_level) : undefined,
        rating:            form.skill_level ? Number(form.skill_level) / 2 : form.rating,
        status:            form.status,
        is_mensalista:     form.is_mensalista,
        nationality:       form.nationality,
        photo_url:         form.photo_url,
      };
      const updated = await repo.update(player.id, payload);
      showToast('✅ Salvo!');
      onSave(updated);
    } catch {
      showToast('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Soft delete — muda status para Inativo em vez de deletar
      await repo.update(player.id, { status: 'Inativo' });
      onDelete(player.id);
      onClose();
    } catch {
      showToast('Erro ao arquivar atleta.');
    } finally {
      setDeleting(false);
    }
  };

  const togglePosition = (pos: PlayerPositionV2) => {
    const curr = (form.positions ?? []) as PlayerPositionV2[];
    const next = curr.includes(pos) ? curr.filter(p => p !== pos) : [...curr, pos];
    set('positions', next);
  };

  const skill = Number(form.skill_level ?? (form.rating ?? 3) * 2);
  const skillColor = skill >= 8 ? gold : skill >= 5 ? blue : 'rgba(255,255,255,0.3)';

  // ── Render ─────────────────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const modal: React.CSSProperties = {
    width: '100%', maxWidth: 600, maxHeight: '92dvh',
    background: 'linear-gradient(160deg,#060f20,#020810)',
    border: `1px solid ${blue}22`, boxShadow: `0 0 80px ${blue}10`,
    overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#111', border: `1px solid ${green}44`, padding: '10px 20px',
            fontSize: 11, fontWeight: 900, color: green, zIndex: 300, whiteSpace: 'nowrap',
            boxShadow: `0 0 30px ${green}20` }}>
            {toast}
          </div>
        )}

        {/* Header fixo */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#060f20', zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: blue, marginBottom: 2 }}>
              {isOwnerOrEditor ? 'EDITAR ATLETA' : 'PERFIL DO ATLETA'}
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              {player.name}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isOwnerOrEditor && (
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/${window.location.pathname.split('/')[2]}/atleta/${player.id}`;
                  navigator.clipboard.writeText(url);
                  showToast('🔗 Link mágico copiado!');
                }}
                title="Copiar link para o atleta"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${blue}15`, border: `1px solid ${blue}40`, color: blue, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 4, transition: 'all .2s' }}>
                <FontAwesomeIcon icon={faLink} /> COPIAR LINK P/ ATLETA
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: 8 }}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}>

          {/* ── FOTO ── */}
          <Section title="📸 Foto do Atleta">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Avatar grande */}
              <div style={{ width: 80, height: 80, flexShrink: 0, overflow: 'hidden',
                border: `2px solid ${POSITION_COLORS[form.posicao_principal ?? 'SA'] ?? blue}44`,
                background: 'rgba(0,20,50,0.8)', position: 'relative' }}>
                {form.photo_url
                  ? <img src={form.photo_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 28, fontWeight: 900,
                      color: POSITION_COLORS[form.posicao_principal ?? 'SA'] ?? blue }}>
                      {player.name[0]}
                    </div>
                }
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: blue }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {isOwnerOrEditor && (
                  <>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                        background: `${blue}12`, border: `1px solid ${blue}30`,
                        color: blue, fontWeight: 900, fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.2em', cursor: 'pointer', marginBottom: 8 }}>
                      <FontAwesomeIcon icon={faCamera} />
                      {uploading ? 'ENVIANDO...' : 'TROCAR FOTO'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                    {form.photo_url && (
                      <button onClick={() => set('photo_url', '')}
                        style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        remover foto
                      </button>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: isOwnerOrEditor ? 8 : 0, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px',
                    background: `${POSITION_COLORS[form.posicao_principal ?? 'SA'] ?? blue}15`,
                    color: POSITION_COLORS[form.posicao_principal ?? 'SA'] ?? blue,
                    border: `1px solid ${POSITION_COLORS[form.posicao_principal ?? 'SA'] ?? blue}25` }}>
                    {form.posicao_principal || '—'}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px',
                    background: form.status === 'Ativo' ? `${green}12` : 'rgba(255,255,255,0.04)',
                    color: form.status === 'Ativo' ? green : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${form.status === 'Ativo' ? green : 'rgba(255,255,255,0.08)'}22` }}>
                    {form.status}
                  </span>
                  {form.is_mensalista && (
                    <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px',
                      background: `${gold}12`, color: gold, border: `1px solid ${gold}25` }}>
                      MENSALISTA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* ── DADOS PESSOAIS ── */}
          <Section title="👤 Dados Pessoais">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faUser} style={{ marginRight: 5 }} />Nome / Apelido *</label>
                <input style={inp} value={form.name ?? ''} onChange={e => set('name', e.target.value)}
                  placeholder="NOME NO JOGO..." disabled={!isOwnerOrEditor} />
              </div>
              <div>
                <label style={lbl}>Nome Completo</label>
                <input style={inp} value={form.full_name ?? ''} onChange={e => set('full_name', e.target.value)}
                  placeholder="Nome completo..." disabled={!isOwnerOrEditor} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faPhone} style={{ marginRight: 5 }} />WhatsApp</label>
                <input style={inp} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)}
                  placeholder="(11) 99999-9999" type="tel" disabled={!isOwnerOrEditor} />
              </div>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 5 }} />E-mail</label>
                <input style={inp} value={form.email ?? ''} onChange={e => set('email', e.target.value)}
                  placeholder="atleta@email.com" type="email" disabled={!isOwnerOrEditor} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faBirthdayCake} style={{ marginRight: 5 }} />Nascimento</label>
                <input style={{ ...inp, colorScheme: 'dark' }} type="date" value={form.birth_date ?? ''}
                  onChange={e => set('birth_date', e.target.value)} disabled={!isOwnerOrEditor} />
              </div>
              <div>
                <label style={lbl}>Nacionalidade</label>
                <input style={inp} value={form.nationality ?? ''} onChange={e => set('nationality', e.target.value)}
                  placeholder="Brasileira..." disabled={!isOwnerOrEditor} />
              </div>
            </div>
          </Section>

          {/* ── DADOS FÍSICOS ── */}
          <Section title="📏 Dados Físicos">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faRuler} style={{ marginRight: 5 }} />Altura (m)</label>
                <input style={inp} type="number" step="0.01" min="1" max="2.5"
                  value={form.height ?? ''} onChange={e => set('height', e.target.value)}
                  placeholder="1.75" disabled={!isOwnerOrEditor} />
              </div>
              <div>
                <label style={lbl}><FontAwesomeIcon icon={faWeight} style={{ marginRight: 5 }} />Peso (kg)</label>
                <input style={inp} type="number" step="0.5" min="40" max="200"
                  value={form.weight ?? ''} onChange={e => set('weight', e.target.value)}
                  placeholder="75" disabled={!isOwnerOrEditor} />
              </div>
              <div>
                <label style={lbl}>Pé Preferencial</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.preferred_foot ?? ''}
                  onChange={e => set('preferred_foot', e.target.value || undefined)} disabled={!isOwnerOrEditor}>
                  <option value="">—</option>
                  <option value="R">Direito</option>
                  <option value="L">Esquerdo</option>
                  <option value="Ambidestro">Ambidestro</option>
                </select>
              </div>
            </div>
          </Section>

          {/* ── NÍVEL & HABILIDADE ── */}
          <Section title="⭐ Nível & Habilidade">
            <div>
              <label style={lbl}>
                <FontAwesomeIcon icon={faStar} style={{ marginRight: 5, color: skillColor }} />
                Nível de Habilidade: <span style={{ color: skillColor }}>{skill}/10</span>
              </label>
              {isOwnerOrEditor ? (
                <input type="range" min="1" max="10" step="1"
                  value={skill}
                  onChange={e => set('skill_level', Number(e.target.value))}
                  style={{ width: '100%', accentColor: skillColor, cursor: 'pointer' }} />
              ) : (
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(skill / 10) * 100}%`, background: skillColor, transition: 'width .5s' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <span key={n} style={{ fontSize: 8, fontWeight: 900, color: n <= skill ? skillColor : 'rgba(255,255,255,0.15)' }}>{n}</span>
                ))}
              </div>
            </div>
          </Section>

          {/* ── POSIÇÕES ── */}
          <Section title="🎯 Posições em Campo">
            <div>
              <label style={lbl}>Posição Principal</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_POSITIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => isOwnerOrEditor && set('posicao_principal', value)}
                    style={{
                      padding: '6px 12px', fontSize: 9, fontWeight: 900, cursor: isOwnerOrEditor ? 'pointer' : 'default',
                      textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${POSITION_COLORS[value] ?? blue}`,
                      background: form.posicao_principal === value ? `${POSITION_COLORS[value] ?? blue}22` : 'transparent',
                      color: form.posicao_principal === value ? POSITION_COLORS[value] ?? blue : 'rgba(255,255,255,0.4)',
                      transition: 'all .15s',
                      opacity: isOwnerOrEditor ? 1 : 0.7,
                    }}>
                    {value} <span style={{ fontWeight: 400, fontSize: 8, textTransform: 'none' }}>({label.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
            {isOwnerOrEditor && (
              <div>
                <label style={lbl}>Posições Secundárias</label>
                {POSITION_GROUPS.map(group => (
                  <div key={group} style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 5 }}>{group}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {ALL_POSITIONS.filter(p => p.group === group).map(({ value }) => {
                        const active = (form.positions ?? []).includes(value);
                        return (
                          <button key={value} onClick={() => togglePosition(value)}
                            style={{ padding: '4px 10px', fontSize: 8, fontWeight: 900, cursor: 'pointer',
                              border: `1px solid ${active ? POSITION_COLORS[value] : 'rgba(255,255,255,0.08)'}`,
                              background: active ? `${POSITION_COLORS[value]}18` : 'transparent',
                              color: active ? POSITION_COLORS[value] : 'rgba(255,255,255,0.3)',
                              transition: 'all .15s' }}>
                            {value}
                            {active && <FontAwesomeIcon icon={faCheckCircle} style={{ marginLeft: 4, fontSize: 7 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── STATUS & MENSALISTA ── */}
          {isOwnerOrEditor && (
            <Section title="⚙️ Status & Configurações">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* Status Ativo/Inativo */}
                <button onClick={() => set('status', form.status === 'Ativo' ? 'Inativo' : 'Ativo')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    background: form.status === 'Ativo' ? `${green}10` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.status === 'Ativo' ? green : 'rgba(255,255,255,0.1)'}44`,
                    cursor: 'pointer', transition: 'all .2s' }}>
                  <FontAwesomeIcon icon={form.status === 'Ativo' ? faToggleOn : faToggleOff}
                    style={{ color: form.status === 'Ativo' ? green : 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                    color: form.status === 'Ativo' ? green : 'rgba(255,255,255,0.4)' }}>
                    {form.status === 'Ativo' ? 'ATIVO' : 'INATIVO'}
                  </span>
                </button>

                {/* Mensalista */}
                <button onClick={() => set('is_mensalista', !form.is_mensalista)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    background: form.is_mensalista ? `${gold}10` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.is_mensalista ? gold : 'rgba(255,255,255,0.1)'}44`,
                    cursor: 'pointer', transition: 'all .2s' }}>
                  <FontAwesomeIcon icon={form.is_mensalista ? faToggleOn : faToggleOff}
                    style={{ color: form.is_mensalista ? gold : 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                    color: form.is_mensalista ? gold : 'rgba(255,255,255,0.4)' }}>
                    {form.is_mensalista ? 'MENSALISTA' : 'AVULSO'}
                  </span>
                </button>
              </div>
            </Section>
          )}

          {/* ── ZONA DE PERIGO ── */}
          {isOwnerOrEditor && (
            <Section title="⚠️ Zona de Punição & Banimento">
              <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', border: `1px dashed ${red}40`, borderLeft: `3px solid ${red}` }}>
                {!confirmDel
                  ? (
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(239, 68, 68, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                        Infringiu regras, causou confusão ou não vai mais participar?
                      </p>
                      <button onClick={() => setConfirmDel(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                          background: `${red}15`, border: `1px solid ${red}40`, color: red,
                          fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em',
                          cursor: 'pointer', width: 'fit-content', transition: 'all .2s' }}>
                        <FontAwesomeIcon icon={faBan} />
                        EXCLUIR / SUSPENDER ATLETA
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: `${red}10`, border: `1px solid ${red}40`, padding: 16 }}>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 900, color: red, marginBottom: 16 }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg" />
                        O atleta será BANIDO (inativado). Suas finanças congelam e ele some do sorteio.
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={handleDelete} disabled={deleting}
                          style={{ padding: '10px 20px', background: red, color: '#000', fontWeight: 900,
                            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', boxShadow: `0 0 20px ${red}40` }}>
                          <FontAwesomeIcon icon={faTrashCan} style={{ marginRight: 6 }} />
                          {deleting ? 'APLICANDO BANIMENTO...' : 'SIM, EXCLUIR DEFINITIVAMENTE'}
                        </button>
                        <button onClick={() => setConfirmDel(false)}
                          style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
                          CANCELAR
                        </button>
                      </div>
                    </div>
                  )
                }
              </div>
            </Section>
          )}
        </div>

        {/* Footer fixo com botão de salvar */}
        {isOwnerOrEditor && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', bottom: 0, background: '#060f20' }}>
            <button onClick={onClose}
              style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
              CANCELAR
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
                background: saving ? `${neon}30` : `linear-gradient(135deg,${neon},#aadd00)`,
                color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.2em', border: 'none', cursor: saving ? 'wait' : 'pointer',
                boxShadow: saving ? 'none' : `0 0 20px ${neon}30`, transition: 'all .2s' }}>
              <FontAwesomeIcon icon={saving ? faSpinner : faSave} spin={saving} />
              {saving ? 'SALVANDO...' : 'SALVAR'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
