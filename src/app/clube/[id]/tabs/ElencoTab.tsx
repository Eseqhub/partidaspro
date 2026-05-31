import React, { useState } from 'react';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus, faChartSimple } from '@fortawesome/free-solid-svg-icons';

const blue = '#00b4ff';
const gold = '#d4a017';
const green = '#22c55e';

interface Props {
  players: Player[];
  groupId: string;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

const POSITION_COLORS: Record<string, string> = {
  G: '#f59e0b', ZAG: '#3b82f6', LD: '#06b6d4', LE: '#06b6d4',
  VOL: '#8b5cf6', MC: '#8b5cf6', MO: '#ec4899', MD: '#ec4899', ME: '#ec4899',
  PE: '#22c55e', PD: '#22c55e', SA: '#22c55e', CA: '#ef4444',
};

export const ElencoTab: React.FC<Props> = ({ players, groupId, onNavigate }) => {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'todos' | 'Ativo' | 'Inativo' | 'mensalista'>('todos');
  const [sort,   setSort]     = useState<'nome' | 'skill' | 'cadastro'>('cadastro');

  const filtered = players
    .filter(p => {
      const matchName   = p.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'todos' ? true
        : filter === 'mensalista' ? p.is_mensalista
        : p.status === filter;
      return matchName && matchFilter;
    })
    .sort((a, b) => {
      if (sort === 'nome')     return a.name.localeCompare(b.name);
      if (sort === 'skill')    return (b.skill_level ?? b.rating * 2) - (a.skill_level ?? a.rating * 2);
      return (b.created_at ?? '').localeCompare(a.created_at ?? '');
    });

  const byPosition: Record<string, Player[]> = {};
  players.forEach(p => {
    const pos = p.posicao_principal || p.positions?.[0] || 'SA';
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(p);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Mini radar de posições */}
      <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginRight: 4 }}>
          POR POSIÇÃO:
        </span>
        {Object.entries(byPosition).map(([pos, pl]) => (
          <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            background: `${POSITION_COLORS[pos] ?? blue}12`, border: `1px solid ${POSITION_COLORS[pos] ?? blue}25` }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: POSITION_COLORS[pos] ?? blue }}>{pos}</span>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{pl.length}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FontAwesomeIcon icon={faChartSimple} style={{ color: gold, fontSize: 11 }} />
          <span style={{ fontSize: 10, fontWeight: 900, color: gold }}>
            {players.length > 0 ? (players.reduce((a, p) => a + (p.skill_level ?? p.rating * 2), 0) / players.length).toFixed(1) : '—'}/10 média
          </span>
        </div>
      </div>

      {/* Barra de filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Busca */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', fontSize: 11 }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar atleta..."
            style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 11, fontWeight: 700, outline: 'none' }}
          />
        </div>

        {/* Filtros */}
        {(['todos', 'Ativo', 'Inativo', 'mensalista'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 14px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', border: `1px solid ${filter === f ? blue : 'rgba(255,255,255,0.08)'}`,
              background: filter === f ? `${blue}15` : 'transparent',
              color: filter === f ? blue : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all .2s' }}>
            {f === 'todos' ? 'Todos' : f === 'mensalista' ? 'Mensalistas' : f}
          </button>
        ))}

        {/* Ordenação */}
        <select value={sort} onChange={e => setSort(e.target.value as any)}
          style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', outline: 'none' }}>
          <option value="cadastro" className="bg-slate-900">Mais recentes</option>
          <option value="skill"    className="bg-slate-900">Maior nível</option>
          <option value="nome"     className="bg-slate-900">Nome A-Z</option>
        </select>
      </div>

      {/* Contagem */}
      <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
        {filtered.length} atleta{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid de atletas */}
      {filtered.length === 0
        ? <p style={{ textAlign: 'center', padding: '48px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Nenhum atleta encontrado</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(p => {
              const pos       = p.posicao_principal || p.positions?.[0] || 'SA';
              const posColor  = POSITION_COLORS[pos] ?? blue;
              const skill     = p.skill_level ?? Math.round(p.rating * 2);
              const skillPct  = (skill / 10) * 100;

              return (
                <div key={p.id}
                  onClick={() => onNavigate(`/clube/${groupId}/atleta/${p.id}`)}
                  style={{ cursor: 'pointer', padding: 16, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${posColor}22`,
                    transition: 'all .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, flexShrink: 0, overflow: 'hidden',
                      border: `2px solid ${posColor}33`, background: 'rgba(0,0,0,0.5)' }}>
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 16, fontWeight: 900, color: posColor }}>{p.name[0]}</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                        letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px',
                          background: `${posColor}15`, color: posColor, textTransform: 'uppercase' }}>{pos}</span>
                        {p.is_mensalista && (
                          <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px',
                            background: `${green}12`, color: green, textTransform: 'uppercase' }}>MENSAL</span>
                        )}
                        <span style={{ fontSize: 7, fontWeight: 900, color: p.status === 'Ativo' ? green : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginLeft: 'auto' }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de skill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>NIV</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${skillPct}%`,
                        background: skill >= 8 ? gold : skill >= 5 ? blue : 'rgba(255,255,255,0.3)', transition: 'width .5s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: skill >= 8 ? gold : blue, flexShrink: 0 }}>{skill}/10</span>
                  </div>

                  {/* Info física (se disponível) */}
                  {(p.height || p.weight) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      {p.height && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>📏 {p.height}m</span>}
                      {p.weight && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>⚖️ {p.weight}kg</span>}
                      {p.birth_date && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                        🎂 {new Date().getFullYear() - new Date(p.birth_date).getFullYear()}a
                      </span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      }
    </div>
  );
};
