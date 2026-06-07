'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Group } from '@/core/entities/group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faFileLines, faCalendarDays, faUsers,
  faCamera, faTimes, faFloppyDisk, faCheckCircle, faSpinner,
  faUserPlus, faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { supabase as sb } from '@/infra/supabase/client';

const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const neon  = '#ccff00';

interface Props {
  group: Group;
  editors: any[];
  isOwner: boolean;
  canManage?: boolean; // dono OU editor delegado
  groupId: string;
  groupRepo: any;
  supabase: any;
  onSave: (updates: Partial<Group>) => Promise<void>;
}

function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderTop: `2px solid ${blue}22` }}>
      <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FontAwesomeIcon icon={icon} style={{ color: blue, fontSize: 9 }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 12, fontWeight: 600, outline: 'none', transition: 'border .2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
  letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginBottom: 8,
};

export const ClubSettingsTab: React.FC<Props> = ({
  group, editors, isOwner, canManage, groupId, groupRepo, supabase, onSave,
}) => {
  const allowed = canManage ?? isOwner;
  // Form fields
  const [name,        setName]        = useState(group.name);
  const [description, setDesc]        = useState(group.description ?? '');
  const [estatuto,    setEstatuto]    = useState(group.estatuto_regras ?? '');
  const [rules,       setRules]       = useState(group.rules_text ?? '');
  const [foundedYear, setFounded]     = useState(String(group.founded_year ?? new Date().getFullYear()));
  const [logoPreview, setLogoPreview] = useState<string | null>(group.logo_url ?? null);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [autoApprove,  setAutoApprove]  = useState(group.auto_approve_members ?? false);
  const [monthlyFee,   setMonthlyFee]   = useState(group.monthly_fee != null ? String(group.monthly_fee) : '');
  const [pixKey,       setPixKey]       = useState(group.pix_key ?? '');

  // Editor management
  const [editorInput, setEditorInput] = useState('');
  const [localEditors, setLocalEditors] = useState<any[]>(editors);
  const [groupPlayers, setGroupPlayers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('__manual__');

  // UI state
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalEditors(editors); }, [editors]);

  useEffect(() => {
    if (!groupId) return;
    supabase
      .from('players')
      .select('id, name, email')
      .eq('group_id', groupId)
      .not('email', 'is', null)
      .neq('email', '')
      .then(({ data }: { data: any }) => {
        if (data) setGroupPlayers(data.filter((p: any) => p.email?.includes('@')));
      });
  }, [groupId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const ext  = file.name.split('.').pop();
    const path = `${groupId}_${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('club-logos').upload(path, file, { upsert: true });
    if (error) throw error;
    return sb.storage.from('club-logos').getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      let logo_url = group.logo_url ?? '';
      if (logoFile) logo_url = await uploadLogo(logoFile);

      const feeNum = parseFloat(monthlyFee.replace(',', '.'));
      await onSave({
        name, description, estatuto_regras: estatuto,
        rules_text: rules, founded_year: parseInt(foundedYear) || undefined, logo_url,
        auto_approve_members: autoApprove,
        monthly_fee: isNaN(feeNum) ? undefined : feeNum,
        pix_key: pixKey.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message ?? 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const [addRole, setAddRole] = useState<'editor' | 'admin'>('editor');

  const handleAddEditor = async () => {
    const email = selectedMemberId === '__manual__'
      ? editorInput.trim().toLowerCase()
      : groupPlayers.find(p => p.id === selectedMemberId)?.email?.toLowerCase() ?? '';
    if (!email || !groupId) return;
    if (addRole === 'admin') {
      await groupRepo.addAdmin(groupId, email);
    } else {
      await groupRepo.addEditor(groupId, email);
    }
    setEditorInput('');
    setSelectedMemberId('__manual__');
    const { data } = await supabase.from('group_roles').select('*').eq('group_id', groupId);
    setLocalEditors(data ?? []);
  };

  const handleRemoveEditor = async (id: string) => {
    await supabase.from('group_roles').delete().eq('id', id);
    setLocalEditors(prev => prev.filter(e => e.id !== id));
  };

  if (!allowed) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: 40, color: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
        Apenas o dono ou editores podem acessar as configurações.
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── IDENTIDADE DO CLUBE ── */}
      <Section title="Identidade do Clube" icon={faShieldHalved}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

          {/* Upload de escudo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width: 100, height: 100, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                border: `2px dashed ${blue}33`, background: 'rgba(0,20,50,0.4)' }}>
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <FontAwesomeIcon icon={faCamera} style={{ fontSize: 22, color: `${blue}66` }} />
                    <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: `${blue}66` }}>ESCUDO</span>
                  </div>
              }
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0')}>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>ALTERAR</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
            <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Clique para trocar</span>
          </div>

          {/* Campos de identidade */}
          <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nome do Clube</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Nome do clube..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
              <div>
                <label style={labelStyle}>Breve Descrição / Bio</label>
                <input style={inputStyle} value={description} onChange={e => setDesc(e.target.value)} placeholder="O melhor racha da região..." />
              </div>
              <div>
                <label style={labelStyle}><FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 4 }} />Ano de Fundação</label>
                <input style={inputStyle} type="number" value={foundedYear} onChange={e => setFounded(e.target.value)} placeholder="2024" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── ESTATUTO & REGULAMENTO ── */}
      <Section title="Estatuto & Regulamento" icon={faFileLines}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Estatuto do Clube (documento oficial / visível para todos)</label>
            <textarea
              value={estatuto}
              onChange={e => setEstatuto(e.target.value)}
              rows={8}
              placeholder="Ex: Art. 1º — O clube foi fundado em 2020 com o objetivo de promover o futebol amador...&#10;&#10;Art. 2º — São membros do clube todo atleta que...&#10;&#10;Art. 3º — O mensalismo é de R$ 50,00/mês..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6, fontSize: 11 }}
            />
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {estatuto.length} caracteres · Visível para todos os membros
            </p>
          </div>
          <div>
            <label style={labelStyle}>Regras da Pelada (resumo rápido das regras do jogo)</label>
            <textarea
              value={rules}
              onChange={e => setRules(e.target.value)}
              rows={4}
              placeholder="Ex: Mensalistas R$50 · Avulsos R$20 · Proibido carrinho · Intervalo 10 min..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6, fontSize: 11 }}
            />
          </div>
        </div>
      </Section>

      {/* ── GESTÃO DE EDITORES (só o dono) ── */}
      {isOwner && (
      <Section title="Quem Gerencia o Clube" icon={faUsers}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.5 }}>
          Editores podem criar partidas, fazer chamada e gerenciar atletas. O dono retém controle total das configurações.
        </p>

        {/* Adicionar colaborador */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {/* Seletor de membro do elenco */}
          {groupPlayers.length > 0 && (
            <div>
              <label style={labelStyle}>Selecionar do elenco</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {groupPlayers
                  .filter(p => !localEditors.some(e => e.user_email?.toLowerCase() === p.email?.toLowerCase()))
                  .map(p => {
                    const selected = selectedMemberId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedMemberId(selected ? '__manual__' : p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                          background: selected ? `${blue}22` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${selected ? blue : 'rgba(255,255,255,0.08)'}`,
                          color: selected ? blue : 'rgba(255,255,255,0.6)',
                          fontWeight: 700, fontSize: 11, cursor: 'pointer', textAlign: 'left',
                          transition: 'all .15s',
                        }}>
                        <div style={{ width: 26, height: 26, background: selected ? `${blue}22` : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 900, color: selected ? blue : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>{p.name}</p>
                          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 600 }}>{p.email}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Fallback: e-mail manual */}
          {selectedMemberId === '__manual__' && (
            <div>
              <label style={labelStyle}>{groupPlayers.length > 0 ? 'Ou adicionar por e-mail' : 'E-mail do colaborador'}</label>
              <input
                type="email" value={editorInput} onChange={e => setEditorInput(e.target.value)}
                placeholder="email@exemplo.com"
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleAddEditor()}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={addRole}
              onChange={e => setAddRole(e.target.value as 'editor' | 'admin')}
              style={{ padding: '12px 10px', background: 'rgba(0,0,0,0.5)',
                border: `1px solid rgba(255,255,255,0.1)`, color: addRole === 'admin' ? gold : blue,
                fontWeight: 900, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer', flex: 1 }}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleAddEditor}
              disabled={selectedMemberId === '__manual__' ? !editorInput : false}
              style={{
                flex: 1, padding: '12px 20px',
                background: (selectedMemberId !== '__manual__' || editorInput) ? `${blue}22` : 'rgba(0,180,255,0.05)',
                border: `1px solid ${blue}33`, color: blue, fontWeight: 900, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
              }}>
              + ADICIONAR
            </button>
          </div>

          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {addRole === 'admin'
              ? '⚡ Admin: acesso total igual ao dono (configs, atletas, finanças)'
              : '🔧 Editor: cria partidas, faz chamada e gerencia atletas'}
          </p>
        </div>

        {/* Lista de gestores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Dono */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: `${gold}08`, border: `1px solid ${gold}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: `${gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: gold, fontSize: 13 }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>Você (Owner)</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Controle total</p>
              </div>
            </div>
            <span style={{ fontSize: 7, fontWeight: 900, padding: '3px 8px', background: `${gold}18`, border: `1px solid ${gold}33`, color: gold, textTransform: 'uppercase' }}>OWNER</span>
          </div>

          {/* Editores */}
          {localEditors.length === 0
            ? <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '16px 0', fontWeight: 700, textTransform: 'uppercase' }}>
                Nenhum editor adicionado
              </p>
            : localEditors.map((ed: any) => {
                const isAdminRole = ed.role === 'admin';
                const roleColor = isAdminRole ? gold : blue;
                return (
                  <div key={ed.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isAdminRole ? `${gold}06` : `${blue}06`,
                    border: `1px solid ${isAdminRole ? `${gold}20` : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: `${roleColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesomeIcon icon={isAdminRole ? faShieldHalved : faUsers} style={{ color: roleColor, fontSize: 11 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{ed.user_email}</p>
                        <p style={{ fontSize: 8, color: `${roleColor}99`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {isAdminRole ? 'Admin — Acesso total' : 'Editor — Partidas & Elenco'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 7, fontWeight: 900, padding: '3px 8px',
                        background: `${roleColor}18`, border: `1px solid ${roleColor}33`,
                        color: roleColor, textTransform: 'uppercase' }}>
                        {isAdminRole ? 'ADMIN' : 'EDITOR'}
                      </span>
                      <button
                        onClick={() => handleRemoveEditor(ed.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', fontSize: 14, padding: 6, transition: 'color .2s' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.4)')}>
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </Section>
      )}

      {/* ── FINANCEIRO ── */}
      {isOwner && (
      <Section title="Financeiro" icon={faMoneyBillWave}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
          Configurações usadas nas cobranças de mensalidade e rateios do grupo.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Valor da mensalidade */}
          <div>
            <label style={labelStyle}>Valor da Mensalidade</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: gold }}>R$</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={monthlyFee}
                onChange={e => setMonthlyFee(e.target.value)}
                placeholder="50,00"
                style={{ ...inputStyle, width: 120 }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                por mês / mensalista
              </span>
            </div>
          </div>
          {/* Chave PIX */}
          <div>
            <label style={labelStyle}>Chave PIX para Cobrança</label>
            <input
              type="text"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória..."
              style={inputStyle}
            />
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Enviada automaticamente nas cobranças via WhatsApp
            </p>
          </div>
        </div>
      </Section>
      )}

      {/* ── ENTRADAS NO GRUPO ── */}
      <Section title="Entradas no Grupo" icon={faUserPlus}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
          Controla o que acontece quando um atleta se cadastra via link de convite.
        </p>

        <div
          onClick={() => setAutoApprove(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', cursor: 'pointer', userSelect: 'none',
            background: autoApprove ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${autoApprove ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
            transition: 'all .25s' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: autoApprove ? green : 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              {autoApprove ? 'Entrada automática' : 'Requer aprovação do organizador'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, lineHeight: 1.5 }}>
              {autoApprove
                ? 'Novos membros entram direto no elenco após o cadastro.'
                : 'Novos membros ficam pendentes até você aprovar manualmente.'}
            </p>
          </div>
          <div style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginLeft: 16,
            background: autoApprove ? green : 'rgba(255,255,255,0.12)', transition: 'background .25s' }}>
            <div style={{ position: 'absolute', top: 3, left: autoApprove ? 23 : 3, width: 18, height: 18,
              borderRadius: '50%', background: '#fff', transition: 'left .25s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
          </div>
        </div>

        {autoApprove && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ⚠️ Cuidado: qualquer pessoa com o link entrará sem revisão.
          </p>
        )}
      </Section>

      {/* ── BOTÃO SALVAR ── */}
      {saveError && (
        <p style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', fontWeight: 700 }}>{saveError}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '14px 32px', fontWeight: 900, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.3em', border: 'none', cursor: saving ? 'wait' : 'pointer',
            background: saved ? `linear-gradient(135deg,${green},#16a34a)` : `linear-gradient(135deg,${neon},#aadd00)`,
            color: '#000', transition: 'all .3s',
            boxShadow: saved ? `0 0 24px ${green}33` : `0 0 24px ${neon}22`,
          }}
        >
          {saving
            ? <><FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 8 }} />SALVANDO...</>
            : saved
            ? <><FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />SALVO!</>
            : <><FontAwesomeIcon icon={faFloppyDisk} style={{ marginRight: 8 }} />SALVAR ALTERAÇÕES</>
          }
        </button>
      </div>
    </div>
  );
};
