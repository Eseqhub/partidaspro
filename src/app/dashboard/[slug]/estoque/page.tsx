'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createInventoryItem, listInventory, moveInventory, InventoryItem } from '@/infra/actions/inventoryActions';

export default function EstoquePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [groupId, setGroupId] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Material esportivo', unit: 'un', minimum: '0', quantity: '0' });

  async function load(id = groupId) {
    if (!id) return;
    setLoading(true);
    try { setItems(await listInventory(id)); }
    catch (e: any) { setMessage(e?.message ?? 'Erro ao carregar estoque.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import('@/infra/supabase/client');
        const { data, error } = await supabase.from('groups').select('id').eq('slug', slug).single();
        if (error || !data) throw new Error('Clube não encontrado ou usuário sem acesso.');
        if (!cancelled) { setGroupId(data.id); await load(data.id); }
      } catch (e: any) {
        if (!cancelled) { setMessage(e?.message ?? 'Não foi possível identificar o clube.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) return setMessage('Grupo não identificado. Abra o dashboard do clube primeiro.');
    try {
      await createInventoryItem({
        groupId, name: form.name, category: form.category, unit: form.unit,
        quantity: Number(form.quantity) || 0, minimumQuantity: Number(form.minimum) || 0,
      });
      setForm({ name: '', category: 'Material esportivo', unit: 'un', minimum: '0', quantity: '0' });
      setMessage('Item cadastrado.');
      await load();
    } catch (e: any) { setMessage(e?.message ?? 'Não foi possível cadastrar.'); }
  }

  async function movement(item: InventoryItem, type: 'entrada' | 'saida') {
    const raw = window.prompt(type === 'entrada' ? 'Quantidade de entrada:' : 'Quantidade de saída:');
    const quantity = Number(raw);
    if (!quantity || quantity <= 0) return;
    try {
      await moveInventory({ groupId, itemId: item.id, type, quantity, reason: type === 'entrada' ? 'Compra/reposição' : 'Consumo/uso' });
      setMessage('Estoque atualizado.');
      await load();
    } catch (e: any) { setMessage(e?.message ?? 'Falha na movimentação.'); }
  }

  const low = items.filter(i => Number(i.quantity) <= Number(i.minimum_quantity));

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-emerald-400">Partidas Pro</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Estoque</h1>
            <p className="text-white/50 mt-2">Materiais, entradas, saídas e alertas de reposição.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-xs text-white/40">Itens</span>
            <strong className="block text-2xl">{items.length}</strong>
          </div>
        </div>

        {message && <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{message}</div>}

        {low.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
            <b>⚠️ Reposição necessária:</b> {low.map(i => i.name).join(', ')}
          </div>
        )}

        <section className="grid lg:grid-cols-[360px_1fr] gap-6">
          <form onSubmit={addItem} className="rounded-2xl border border-white/10 bg-white/[.03] p-5 space-y-3 h-fit">
            <h2 className="font-black uppercase tracking-wider text-sm">Novo item</h2>
            {[
              ['name','Nome do item','Ex.: Bola oficial'],
              ['category','Categoria','Material esportivo'],
              ['unit','Unidade','un'],
              ['minimum','Estoque mínimo','0'],
              ['quantity','Quantidade inicial','0'],
            ].map(([key,label,placeholder]) => (
              <label key={key} className="block">
                <span className="text-[10px] uppercase font-bold text-white/40">{label}</span>
                <input
                  value={(form as any)[key]}
                  onChange={e => setForm(v => ({...v, [key]: e.target.value}))}
                  placeholder={placeholder}
                  type={key === 'minimum' || key === 'quantity' ? 'number' : 'text'}
                  min={key === 'minimum' || key === 'quantity' ? '0' : undefined}
                  className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-3 outline-none focus:border-emerald-400"
                  required={key === 'name'}
                />
              </label>
            ))}
            <button className="w-full rounded-xl bg-emerald-400 text-black font-black py-3 hover:brightness-110">CADASTRAR ITEM</button>
          </form>

          <section className="rounded-2xl border border-white/10 bg-white/[.03] overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_100px_150px] gap-3 px-5 py-4 text-[10px] uppercase font-black tracking-wider text-white/35 border-b border-white/10">
              <span>Item</span><span>Categoria</span><span>Saldo</span><span>Ações</span>
            </div>
            {loading ? <div className="p-8 text-white/40">Carregando...</div> :
              items.length === 0 ? <div className="p-8 text-white/40">Nenhum item cadastrado.</div> :
              items.map(item => {
                const isLow = Number(item.quantity) <= Number(item.minimum_quantity);
                return (
                  <div key={item.id} className="grid grid-cols-[1.5fr_1fr_100px_150px] gap-3 items-center px-5 py-4 border-b border-white/5">
                    <div><b>{item.name}</b><small className="block text-white/35">{item.unit} · mínimo {item.minimum_quantity}</small></div>
                    <span className="text-sm text-white/55">{item.category}</span>
                    <span className={isLow ? 'font-black text-amber-400' : 'font-black text-emerald-400'}>{item.quantity}</span>
                    <div className="flex gap-2">
                      <button onClick={() => movement(item, 'entrada')} className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">+ ENTRADA</button>
                      <button onClick={() => movement(item, 'saida')} className="rounded-lg bg-red-400/10 px-3 py-2 text-xs font-black text-red-300">− SAÍDA</button>
                    </div>
                  </div>
                );
              })}
          </section>
        </section>
      </div>
    </main>
  );
}
