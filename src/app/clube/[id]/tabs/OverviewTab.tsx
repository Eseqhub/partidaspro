import React from 'react';
import { Group } from '@/core/entities/group';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faUsers, faFutbol, faArrowTrendUp, faArrowTrendDown,
  faChartLine, faCopy, faDice, faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';

const blue = '#00b4ff';
const gold = '#d4a017';
const neon = '#ccff00';
const green = '#22c55e';
const red   = '#ef4444';

interface Props {
  group: Group;
  players: Player[];
  finances: any[];
  summary: { balance: number; income: number; expense: number; received: number; pending: number };
  matches: any[];
  onCopyLink: () => void;
  onNavigate: (path: string) => void;
}

function KpiCard({ icon, label, value, sub, color = '#fff', accent = '' }: {
  icon: any; label: string; value: string; sub?: string; color?: string; accent?: string;
}) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 20px 18px',
      background: 'rgba(255,255,255,0.02)', border: `1px solid ${accent || 'rgba(255,255,255,0.05)'}`,
      borderLeft: accent ? `3px solid ${accent}` : '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accent ? `${accent}12` : 'rgba(255,255,255,0.04)' }}>
          <FontAwesomeIcon icon={icon} style={{ fontSize: 14, color: accent || 'rgba(255,255,255,0.4)' }} />
        </div>
        <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function FinanceRow({ desc, amount, date, player }: { desc: string; amount: number; date: string; player?: string }) {
  const pos = amount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: pos ? `${green}12` : `${red}10` }}>
          <FontAwesomeIcon icon={pos ? faArrowTrendUp : faArrowTrendDown}
            style={{ fontSize: 10, color: pos ? green : red }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{desc}</p>
          {player && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{player}</p>}
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            {new Date(date).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: pos ? green : red, flexShrink: 0, marginLeft: 8 }}>
        {pos ? '+' : '-'}R${Math.abs(amount).toFixed(2)}
      </span>
    </div>
  );
}

export const OverviewTab: React.FC<Props> = ({
  group, players, finances, summary, matches, onCopyLink, onNavigate,
}) => {
  const activeCount    = players.filter(p => p.status === 'Ativo').length;
  const mensalistas    = players.filter(p => p.is_mensalista).length;
  const avgSkill       = players.length > 0
    ? (players.reduce((a, p) => a + (p.skill_level ?? p.rating * 2), 0) / players.length).toFixed(1)
    : '—';
  const recentPlayers  = [...players].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 6);
  const recentFinances = finances.slice(0, 6);
  const lastMatch      = matches[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0, maxWidth: '100%' }}>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard icon={faWallet}      label="Caixa Atual"    value={`R$${Math.abs(summary.balance).toFixed(2)}`}  sub={summary.balance >= 0 ? 'saldo positivo' : 'déficit'} color={summary.balance >= 0 ? green : red} accent={summary.balance >= 0 ? green : red} />
        <KpiCard icon={faArrowTrendUp} label="Total Receitas" value={`R$${summary.income.toFixed(2)}`}             sub={`R$${summary.pending.toFixed(2)} pendente`}        color="#fff" accent={green} />
        <KpiCard icon={faArrowTrendDown} label="Total Despesas" value={`R$${summary.expense.toFixed(2)}`}          sub="saídas registradas"                                color="#fff" accent={red}   />
        <KpiCard icon={faUsers}       label="Atletas Ativos"  value={String(activeCount)}                          sub={`${mensalistas} mensalistas`}                      color="#fff" accent={blue}  />
        <KpiCard icon={faChartLine}   label="Nível Médio"     value={`${avgSkill}/10`}                             sub="inteligência do sorteio"                           color={gold} accent={gold}  />
        <KpiCard icon={faFutbol}      label="Partidas"        value={String(matches.length)}                        sub={lastMatch ? `última: ${new Date(lastMatch.created_at).toLocaleDateString('pt-BR')}` : 'nenhuma ainda'} color="#fff" accent={neon}  />
      </div>

      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Movimentações recentes */}
        <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faWallet} style={{ color: blue, fontSize: 9 }} /> Movimentações
            </h2>
            <button onClick={() => {}} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: blue, background: 'none', border: 'none', cursor: 'pointer' }}>
              VER TUDO
            </button>
          </div>
          {recentFinances.length === 0
            ? <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '32px 0', fontWeight: 700, textTransform: 'uppercase' }}>Nenhuma movimentação</p>
            : recentFinances.map((f: any) => (
                <FinanceRow
                  key={f.id}
                  desc={f.description ?? f.category ?? 'Movimentação'}
                  amount={f.type === 'Receita' ? f.amount : -f.amount}
                  date={f.date ?? f.created_at}
                  player={f.player?.name}
                />
              ))
          }
          {/* Resumo no rodapé */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Recebido</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: green }}>R${summary.received.toFixed(2)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Pendente</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: gold }}>R${summary.pending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Últimos atletas */}
        <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faUsers} style={{ color: blue, fontSize: 9 }} /> Elenco Recente
            </h2>
            <button onClick={onCopyLink} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FontAwesomeIcon icon={faCopy} style={{ fontSize: 8 }} /> CONVIDAR
            </button>
          </div>
          {recentPlayers.length === 0
            ? <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '32px 0', fontWeight: 700, textTransform: 'uppercase' }}>Sem atletas cadastrados</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentPlayers.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                    onClick={() => onNavigate(`/clube/${group.id}/atleta/${p.id}`)}>
                    <div style={{ width: 34, height: 34, flexShrink: 0, overflow: 'hidden', border: `1px solid ${blue}22`, background: 'rgba(0,20,50,0.6)' }}>
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: blue }}>{p.name[0]}</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                        {p.posicao_principal || p.positions?.[0] || '—'} · {p.status}
                      </p>
                    </div>
                    <div style={{ padding: '2px 8px', background: `${gold}12`, border: `1px solid ${gold}25`, fontSize: 9, fontWeight: 900, color: gold, flexShrink: 0 }}>
                      {(p.skill_level ?? Math.round(p.rating * 2))}/10
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Dica de sorteio */}
      <div style={{ padding: '16px 20px', background: `${neon}05`, border: `1px solid ${neon}18`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <FontAwesomeIcon icon={faDice} style={{ color: neon, fontSize: 20, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: neon, marginBottom: 2 }}>SORTEIO INTELIGENTE PRONTO</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Você tem <strong style={{ color: '#fff' }}>{activeCount} atletas</strong> cadastrados.
            O algoritmo usa habilidade (50%), posição (30%) e físico (20%) para equilibrar os times.
          </p>
        </div>
        <button onClick={() => onNavigate(`/dashboard/${group.slug}/matches`)}
          style={{ marginLeft: 'auto', padding: '10px 18px', background: `linear-gradient(135deg,${neon},#aadd00)`,
            color: '#000', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em',
            border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          IR PARA PARTIDAS
        </button>
      </div>
    </div>
  );
};
