'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { Transaction, TransactionType, TransactionStatus } from '@/core/entities/finance';
import { Player } from '@/core/entities/player';
import { PlayerRepository } from '@/infra/repositories/PlayerRepository';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faWallet, faArrowTrendUp, faArrowTrendDown } from '@fortawesome/free-solid-svg-icons';

interface ManageTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  groupId: string;
  initialData?: Transaction | null;
}

const CATEGORIES = ['Mensalidade', 'Aluguel do Campo', 'Ajuda de Custo', 'Extra', 'Materiais', 'Outros'];

export function ManageTransactionModal({ isOpen, onClose, onSave, groupId, initialData }: ManageTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'Receita');
  const [category, setCategory] = useState(initialData?.category || 'Mensalidade');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'Pendente');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [playerId, setPlayerId] = useState(initialData?.player_id || '');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setCategory(initialData.category);
        setAmount(initialData.amount.toString());
        setStatus(initialData.status);
        setDescription(initialData.description || '');
        setDate(initialData.date);
        setPlayerId(initialData.player_id || '');
      } else {
        setType('Receita');
        setCategory('Mensalidade');
        setAmount('');
        setStatus('Pendente');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setPlayerId('');
      }
      
      const loadPlayers = async () => {
        const repo = new PlayerRepository();
        const data = await repo.findAllByGroupId(groupId);
        setPlayers(data);
      };
      loadPlayers();
    }
  }, [isOpen, initialData, groupId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        group_id: groupId,
        player_id: playerId || null,
        type,
        category,
        amount: parseFloat(amount),
        status,
        description,
        date
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <GlassCard className="w-full max-w-lg relative z-10 overflow-hidden border-white/10">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-none border ${type === 'Receita' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
              <FontAwesomeIcon icon={type === 'Receita' ? faArrowTrendUp : faArrowTrendDown} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">
                {initialData ? 'EDITAR' : 'NOVO'} <span className="text-primary italic">LANÇAMENTO</span>
              </h2>
              <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Database Sync Active</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Lançamento */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('Receita')}
              className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all border ${type === 'Receita' ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
            >
              RECEITA
            </button>
            <button
              type="button"
              onClick={() => setType('Despesa')}
              className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all border ${type === 'Despesa' ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
            >
              DESPESA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Valor (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:border-primary transition-all outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Data</label>
              <input
                required
                type="date"
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:border-primary transition-all outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Categoria</label>
              <select
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:border-primary transition-all outline-none appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</label>
              <select
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:border-primary transition-all outline-none appearance-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              >
                <option value="Pago" className="bg-slate-900">PAGO</option>
                <option value="Pendente" className="bg-slate-900">PENDENTE</option>
              </select>
            </div>
          </div>

          {/* Vincular Atleta (Opcional) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Vincular Atleta (Opcional)</label>
            <select
              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:border-primary transition-all outline-none appearance-none"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
            >
              <option value="" className="bg-slate-900">SEM ATLETA (LANÇAMENTO DO GRUPO)</option>
              {players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Descrição</label>
            <textarea
              placeholder="Notas adicionais..."
              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-bold text-white focus:border-primary transition-all outline-none min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-primary text-black font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all gap-3"
            >
              <FontAwesomeIcon icon={faSave} /> {loading ? 'GERANDO LANÇAMENTO...' : 'SALVAR NO DATABASE'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
