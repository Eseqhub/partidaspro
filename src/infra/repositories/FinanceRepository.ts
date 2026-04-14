import { supabase } from '../supabase/client';
import { Transaction, FinanceSummary } from '@/core/entities/finance';

export class FinanceRepository {
  private table = 'finances';

  async findAllByGroupId(groupId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*, player:players(name)')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Transaction[];
  }

  async getSummary(groupId: string): Promise<FinanceSummary> {
    const { data, error } = await supabase
      .from(this.table)
      .select('type, amount, status')
      .eq('group_id', groupId);

    if (error) throw error;

    const summary: FinanceSummary = {
      balance: 0,
      income: 0,
      expense: 0,
      received: 0,
      pending: 0
    };

    data.forEach((t: any) => {
      const amount = Number(t.amount);
      if (t.type === 'Receita') {
        summary.income += amount;
        if (t.status === 'Pago') summary.received += amount;
        else summary.pending += amount;
      } else {
        summary.expense += Math.abs(amount);
      }
    });

    summary.balance = summary.received - summary.expense;
    return summary;
  }

  async create(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
