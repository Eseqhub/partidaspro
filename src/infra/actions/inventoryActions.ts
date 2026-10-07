'use server';

import { supabase } from '@/infra/supabase/client';

export interface InventoryItem {
  id: string;
  group_id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
  cost: number;
  supplier?: string | null;
  notes?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function listInventory(groupId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('group_id', groupId)
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryItem[];
}

export async function createInventoryItem(input: {
  groupId: string; name: string; category?: string; unit?: string;
  quantity?: number; minimumQuantity?: number; cost?: number; supplier?: string; notes?: string;
}) {
  const { data, error } = await supabase.from('inventory_items').insert({
    group_id: input.groupId,
    name: input.name.trim(),
    category: input.category?.trim() || 'Geral',
    unit: input.unit?.trim() || 'un',
    quantity: Math.max(0, input.quantity ?? 0),
    minimum_quantity: Math.max(0, input.minimumQuantity ?? 0),
    cost: Math.max(0, input.cost ?? 0),
    supplier: input.supplier?.trim() || null,
    notes: input.notes?.trim() || null,
  }).select('*').single();
  if (error) throw new Error(error.message);
  return data as InventoryItem;
}

export async function moveInventory(input: {
  groupId: string; itemId: string; type: 'entrada' | 'saida' | 'ajuste';
  quantity: number; reason?: string; reference?: string; playerId?: string;
}) {
  const quantity = Math.abs(input.quantity);
  if (!quantity) throw new Error('Informe uma quantidade maior que zero.');

  const { data: item, error: itemError } = await supabase
    .from('inventory_items').select('*').eq('id', input.itemId).eq('group_id', input.groupId).single();
  if (itemError || !item) throw new Error('Item de estoque não encontrado.');

  let next = Number(item.quantity);
  if (input.type === 'entrada') next += quantity;
  if (input.type === 'saida') next -= quantity;
  if (input.type === 'ajuste') next = quantity;
  if (next < 0) throw new Error(`Estoque insuficiente. Disponível: ${item.quantity} ${item.unit}.`);

  const { error: movementError } = await supabase.from('inventory_movements').insert({
    item_id: input.itemId, group_id: input.groupId, type: input.type,
    quantity, reason: input.reason?.trim() || 'Outro',
    reference: input.reference?.trim() || null, player_id: input.playerId || null,
  });
  if (movementError) throw new Error(movementError.message);

  const { data, error } = await supabase.from('inventory_items')
    .update({ quantity: next, updated_at: new Date().toISOString() })
    .eq('id', input.itemId).eq('group_id', input.groupId).select('*').single();
  if (error) throw new Error(error.message);
  return data as InventoryItem;
}

export async function listInventoryMovements(groupId: string, itemId?: string) {
  let query = supabase.from('inventory_movements').select('*')
    .eq('group_id', groupId).order('created_at', { ascending: false }).limit(100);
  if (itemId) query = query.eq('item_id', itemId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
