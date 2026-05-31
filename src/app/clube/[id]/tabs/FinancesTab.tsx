import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp, faArrowTrendDown, faWallet,
  faCircleCheck, faHourglassHalf,
} from '@fortawesome/free-solid-svg-icons';

const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';

interface Props {
  finances: any[];
  summary: { balance: number; income: number; expense: number; received: number; pending: number };
  groupId: string;
  onRefresh: () => void;
}

function FinanceCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: any }) {
  return (
    <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20`, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <FontAwesomeIcon icon={icon} style={{ color, fontSize: 12 }} />
        <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{sub}</p>
    </div>
  );
}

export const FinancesTab: React.FC<Props> = ({ finances, summary }) => {
  const transactions = finances.slice(0, 50);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <FinanceCard label="Saldo Atual"   value={`R$${Math.abs(summary.balance).toFixed(2)}`}  sub={summary.balance >= 0 ? 'saldo positivo' : 'déficit'}  color={summary.balance >= 0 ? green : red}  icon={faWallet}         />
        <FinanceCard label="Recebido"      value={`R$${summary.received.toFixed(2)}`}            sub="total confirmado"                                        color={green}                                icon={faCircleCheck}    />
        <FinanceCard label="Pendente"      value={`R$${summary.pending.toFixed(2)}`}             sub="aguardando pagamento"                                    color={gold}                                 icon={faHourglassHalf}  />
        <FinanceCard label="Total Despesas" value={`R$${summary.expense.toFixed(2)}`}            sub="total de saídas"                                         color={red}                                  icon={faArrowTrendDown} />
      </div>

      {/* Barra de progresso receitas vs despesas */}
      <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: green }}>
            Receitas R${summary.income.toFixed(2)}
          </span>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: red }}>
            Despesas R${summary.expense.toFixed(2)}
          </span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
          {summary.income + summary.expense > 0 && (
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${(summary.income / (summary.income + summary.expense)) * 100}%`,
              background: `linear-gradient(90deg,${green},${blue})`, transition: 'width .8s' }} />
          )}
        </div>
      </div>

      {/* Tabela de transações */}
      <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faWallet} style={{ color: blue, fontSize: 9 }} />
          Todas as Movimentações ({transactions.length})
        </h2>

        {transactions.length === 0
          ? <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Sem movimentações registradas</p>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Cabeçalho */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 56px 76px', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
                {['Descrição', 'Data', 'Valor'].map((col, i) => (
                  <span key={col} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textAlign: i === 2 ? 'right' : 'left' }}>{col}</span>
                ))}
              </div>
              {transactions.map((f: any) => {
                const isReceita = f.type === 'Receita';
                const amount    = isReceita ? f.amount : -f.amount;
                return (
                  <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 56px 76px', gap: 8,
                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isReceita ? `${green}12` : `${red}10` }}>
                        <FontAwesomeIcon icon={isReceita ? faArrowTrendUp : faArrowTrendDown}
                          style={{ fontSize: 9, color: isReceita ? green : red }} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {f.description ?? f.category ?? 'Movimentação'}
                        </span>
                        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: isReceita ? `${green}80` : `${red}80`, letterSpacing: '0.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {f.type}{f.player?.name ? ` · ${f.player.name}` : ''}{f.status ? ` · ${f.status}` : ''}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(f.date ?? f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace', color: amount > 0 ? green : red, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {amount > 0 ? '+' : ''}R${Math.abs(amount).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
};
