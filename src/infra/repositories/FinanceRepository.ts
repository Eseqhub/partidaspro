import { supabase } from '../supabase/client';
import { Transaction, FinanceSummary } from '@/core/entities/finance';

export class FinanceRepository {
  private table = 'transactions';

  async findAllByGroupId(groupId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
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
      if (t.type === 'Receita') {
        summary.income += t.amount;
        if (t.status === 'Pago') summary.received += t.amount;
        else summary.pending += t.amount;
      } else {
        summary.expense += t.amount;
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
}
