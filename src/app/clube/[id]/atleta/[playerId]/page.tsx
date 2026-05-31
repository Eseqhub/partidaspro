'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faRulerVertical, faWeightHanging, faFutbol,
  faFloppyDisk, faArrowLeft, faTrash, faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { supabase } from '@/infra/supabase/client';
import { Player, PlayerPositionV2 } from '@/core/entities/player';

// Rótulos legíveis das posições
const POSITION_LABELS: Record<string, string> = {
  G: 'Goleiro', LD: 'Lateral Dir.', LE: 'Lateral Esq.',
  ZGD: 'Zagueiro Dir.', ZGE: 'Zagueiro Esq.', ZAG: 'Zagueiro',
  VOL: 'Volante', MC: 'Meia Centro', MD: 'Meia Dir.', ME: 'Meia Esq.',
  MO: 'Meia Ofensivo', PE: 'Ponta Esq.', PD: 'Ponta Dir.',
  SA: 'Segunda Atacante', CA: 'Centroavante',
};

// Slider de habilidade 1–10 com cor dinâmica
function SkillSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color =
    value <= 3 ? '#EF4444' :
    value <= 6 ? '#F59E0B' :
    '#22C55E';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary">
          Nível de Habilidade
        </label>
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 flex items-center justify-center font-black text-xl border"
            style={{ borderColor: color, color }}
          >
            {value}
          </div>
          <span className="text-[9px] text-white/30 font-bold uppercase">/ 10</span>
        </div>
      </div>
      <div className="relative h-2 bg-white/10">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-200"
          style={{ width: `${(value / 10) * 100}%`, backgroundColor: color }}
        />
        <input
          type="range" min={1} max={10} step={1} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
      <div className="flex justify-between text-[8px] text-white/20 font-bold uppercase">
        <span>Iniciante</span><span>Amador</span><span>Semi-Pro</span><span>Elite</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Página principal
// ────────────────────────────────────────────────────────────────

export default function AthleteProfilePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    skill_level: 5,
    height: '',
    weight: '',
    position: 'MO' as PlayerPositionV2,
    preferred_foot: 'R' as 'L' | 'R' | 'Ambidestro',
  });

  const playerRepo = new PlayerRepository();
  const groupRepo = new GroupRepository();

  const checkPermission = useCallback(async (p: Player) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Verifica se é admin/editor do grupo
    const isEditor = await groupRepo.isEditor(groupId, user.email ?? '');
    const { data: groupData } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', groupId)
      .single();

    const isOwner = groupData?.owner_id === user.id;
    return isEditor || isOwner;
  }, [groupId]);

  const load = useCallback(async () => {
    try {
      const [allPlayers] = await Promise.all([
        playerRepo.findAllByGroupId(groupId),
      ]);
      const found = allPlayers.find(p => p.id === playerId);
      if (!found) { router.push('/404'); return; }

      setPlayer(found);
      setForm({
        skill_level: found.skill_level ?? Math.round(found.rating * 2),
        height: found.height?.toString() ?? '',
        weight: found.weight?.toString() ?? '',
        position: (found.positions[0] ?? 'MO') as PlayerPositionV2,
        preferred_foot: found.preferred_foot ?? 'R',
      });

      const permission = await checkPermission(found);
      setCanEdit(permission);
    } catch (err) {
      console.error('[AthleteProfile] erro:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, playerId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!player || !canEdit) return;
    setSaving(true);
    try {
      await playerRepo.update(playerId, {
        skill_level: form.skill_level,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        positions: [form.position],
        preferred_foot: form.preferred_foot,
        rating: form.skill_level / 2, // mantém legado sincronizado
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Erro ao salvar. Verifique sua permissão.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!canEdit || !player) return;
    const confirm = window.confirm(`Arquivar atleta ${player.name}? Ele não aparecerá mais nos sorteios.`);
    if (!confirm) return;
    // Soft delete — apenas muda status para Inativo (nunca .delete())
    await playerRepo.update(playerId, { status: 'Inativo' });
    router.push(`/clube/${groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-primary text-xs font-black uppercase tracking-[0.4em] animate-pulse">CARREGANDO ATLETA...</p>
      </div>
    );
  }

  if (!player) return null;

  const skillColor =
    form.skill_level <= 3 ? 'text-red-400 border-red-500/30' :
    form.skill_level <= 6 ? 'text-amber-400 border-amber-500/30' :
    'text-emerald-400 border-emerald-500/30';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">

        {/* ── Volta ── */}
        <button
          onClick={() => router.push(`/clube/${groupId}`)}
          className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest mb-10 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar ao Clube
        </button>

        {/* ── Card do Atleta ── */}
        <div className="border border-white/5 bg-black/40 overflow-hidden mb-8">
          {/* Tarja superior */}
          <div className="h-1 bg-primary w-full" />

          <div className="p-8 flex items-center gap-6">
            <div className="w-20 h-20 border border-white/5 bg-black/60 shrink-0 overflow-hidden">
              {player.photo_url
                ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-primary text-2xl font-black">{player.name[0]}</span>
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">Ficha do Atleta</p>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white truncate">{player.name}</h1>
              <p className="text-white/40 text-xs font-medium mt-0.5">{player.full_name ?? '—'}</p>
            </div>
            {/* Badge de nível atual */}
            <div className={`text-center border px-4 py-3 shrink-0 ${skillColor}`}>
              <p className="text-2xl font-black">{form.skill_level}</p>
              <p className="text-[8px] font-black uppercase tracking-wider opacity-60">NÍVEL</p>
            </div>
          </div>
        </div>

        {/* ── Formulário de Edição ── */}
        <div className="border border-white/5 bg-black/30 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Dados Técnicos</h2>
            {!canEdit && (
              <span className="text-[9px] font-black text-amber-400/60 uppercase tracking-wider bg-amber-400/5 border border-amber-400/20 px-3 py-1">
                Somente leitura
              </span>
            )}
          </div>

          {/* Slider de habilidade */}
          <SkillSlider value={form.skill_level} onChange={v => setForm(f => ({ ...f, skill_level: v }))} />

          {/* Posição */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
              <FontAwesomeIcon icon={faFutbol} className="text-[9px]" />
              Posição Principal
            </label>
            <select
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value as PlayerPositionV2 }))}
              disabled={!canEdit}
              className="w-full bg-black/40 border border-white/10 p-4 text-white font-bold outline-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:border-primary/50 transition-colors"
            >
              {Object.entries(POSITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v} ({k})</option>
              ))}
            </select>
          </div>

          {/* Pé preferencial */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Pé Preferencial</label>
            <select
              value={form.preferred_foot}
              onChange={e => setForm(f => ({ ...f, preferred_foot: e.target.value as any }))}
              disabled={!canEdit}
              className="w-full bg-black/40 border border-white/10 p-4 text-white font-bold outline-none appearance-none cursor-pointer disabled:opacity-40 focus:border-primary/50 transition-colors"
            >
              <option value="R">Destro (Direito)</option>
              <option value="L">Canhoto (Esquerdo)</option>
              <option value="Ambidestro">Ambidestro</option>
            </select>
          </div>

          {/* Físico */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <FontAwesomeIcon icon={faRulerVertical} className="text-[9px]" />
                Altura (M)
              </label>
              <input
                type="number" step="0.01" placeholder="1.80"
                value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 p-4 text-white outline-none disabled:opacity-40 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <FontAwesomeIcon icon={faWeightHanging} className="text-[9px]" />
                Peso (KG)
              </label>
              <input
                type="number" placeholder="80"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                disabled={!canEdit}
                className="w-full bg-black/40 border border-white/10 p-4 text-white outline-none disabled:opacity-40 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Ações */}
          {canEdit && (
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-slate-950 font-black uppercase text-[11px] tracking-widest py-4 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {saved ? 'SALVO!' : saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center justify-center gap-2 border border-red-500/20 text-red-400 font-black uppercase text-[10px] tracking-widest px-5 py-4 hover:bg-red-500/10 transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} />
                Arquivar
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-10 text-[9px] text-white/10 font-bold uppercase tracking-[0.5em]">
          PARTIDAS PRO © 2026
        </p>
      </div>
    </div>
  );
}
