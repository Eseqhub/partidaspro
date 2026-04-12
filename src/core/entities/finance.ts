export type TransactionType = 'Receita' | 'Despesa';
export type TransactionStatus = 'Pago' | 'Pendente';

export interface Transaction {
  id: string;
  group_id: string;
  player_id?: string;
  type: TransactionType;
  category: string; // 'Mensalidade', 'Aluguel', 'Extra', 'Ajuda de custo'
  description?: string;
  amount: number;
  status: TransactionStatus;
  date: string;
  created_at?: string;
}

export interface FinanceSummary {
  balance: number;
  income: number;
  expense: number;
  received: number;
  pending: number;
}
