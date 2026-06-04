import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faHandshake, faSquare, faPlus, faChartBar, faRotateLeft, faStar, faTimes, faComment, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { MatchEvent } from '@/core/entities/match';
import { DraftResult } from '@/core/services/DraftService';
import { Player } from '@/core/entities/player';

interface StatsTabProps {
  userRole: string;
  handleNewMatch: () => void;
  draftResult: DraftResult | null;
  setSelectedEventType: (type: any) => void;
  setIsEventModalOpen: (open: boolean) => void;
  events: MatchEvent[];
  onElectMVP?: (playerId: string, team: 'home' | 'away') => void;
  mvpPlayerId?: string | null;
  comments?: any[];
  currentUserName?: string;
  onAddComment?: (message: string, authorName?: string) => void;
}

const EVENT_ICON: Record<string, any> = {
  'Gol':           faFutbol,
  'Assistência':   faHandshake,
  'Cartão Amarelo': faSquare,
  'Cartão Vermelho': faSquare,
  'Entrada':        faChartBar,
  'Saída':          faChartBar,
  'Craque':         faStar,
};
// minute armazena o tempo do evento em SEGUNDOS → exibe mm:ss
const fmtEventTime = (s?: number | null) => {
  const total = Math.max(0, Math.floor(s ?? 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const EVENT_COLOR: Record<string, string> = {
  'Gol':             '#ccff00',
  'Assistência':     '#00b4ff',
  'Cartão Amarelo':  '#EAB308',
  'Cartão Vermelho': '#EF4444',
  'Entrada':         '#22C55E',
  'Saída':           '#6B7280',
  'Craque':          '#FFD700',
};

export const StatsTab: React.FC<StatsTabProps> = ({
  userRole, handleNewMatch, draftResult, setSelectedEventType, setIsEventModalOpen, events,
  onElectMVP, mvpPlayerId,
  comments = [], currentUserName = 'Torcedor', onAddComment,
}) => {
  const [mvpPickerOpen, setMvpPickerOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Atletas da partida (mandante + visitante) para identificar o autor
  const roster: { id: string; name: string }[] = draftResult
    ? [...draftResult.homeTeam, ...draftResult.awayTeam].map(p => ({ id: p.id, name: p.name }))
    : [];

  const [author, setAuthor] = useState<string>(() => {
    if (typeof window === 'undefined') return currentUserName;
    return localStorage.getItem('pp_comment_author') || currentUserName;
  });

  const onChangeAuthor = (name: string) => {
    setAuthor(name);
    try { localStorage.setItem('pp_comment_author', name); } catch { /* ignore */ }
  };

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onAddComment?.(text, author);
    setCommentText('');
  };
  // Agrega eventos da partida atual por jogador
  const playerSummary = new Map<string, { name: string; goals: number; assists: number; yellow: number; red: number; team: string }>();
  events.forEach(ev => {
    const name = (ev as any).player?.name ?? '?';
    const pid  = ev.player_id;
    if (!playerSummary.has(pid)) {
      playerSummary.set(pid, { name, goals: 0, assists: 0, yellow: 0, red: 0, team: ev.team });
    }
    const s = playerSummary.get(pid)!;
    if (ev.type === 'Gol')               s.goals++;
    else if (ev.type === 'Assistência')   s.assists++;
    else if (ev.type === 'Cartão Amarelo') s.yellow++;
    else if (ev.type === 'Cartão Vermelho') s.red++;
  });

  const scorers  = [...playerSummary.values()].filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals);
  const homeGoals = events.filter(e => e.type === 'Gol' && e.team === 'home').length;
  const awayGoals = events.filter(e => e.type === 'Gol' && e.team === 'away').length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Legenda dos ícones */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10,
      }}>
        {([
          { icon: faFutbol,    color: '#ccff00', label: 'Gol'         },
          { icon: faHandshake, color: '#00b4ff', label: 'Assistência' },
          { icon: faSquare,    color: '#EAB308', label: 'Amarelo'     },
          { icon: faSquare,    color: '#EF4444', label: 'Vermelho'    },
          { icon: faStar,      color: '#FFD700', label: 'Craque MVP'  },
        ] as const).map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: `${item.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesomeIcon icon={item.icon as any} style={{ fontSize: 7, color: item.color }} />
            </div>
            <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Botões: registrar evento + eleger craque */}
      {userRole !== 'viewer' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (!draftResult) { alert('Primeiro faça o sorteio dos times!'); return; }
              setSelectedEventType('Gol');
              setIsEventModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border ${
              draftResult
                ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black'
                : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <FontAwesomeIcon icon={faPlus} />
            Evento
          </button>
          <button
            onClick={() => {
              if (!draftResult) { alert('Primeiro faça o sorteio dos times!'); return; }
              setMvpPickerOpen(true);
            }}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border ${
              draftResult
                ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
            }`}
            style={draftResult ? { background: 'rgba(255,215,0,0.08)' } : undefined}
          >
            <FontAwesomeIcon icon={faStar} />
            Craque
          </button>
        </div>
      )}

      {/* Craque eleito */}
      {mvpPlayerId && draftResult && (() => {
        const all = [...draftResult.homeTeam, ...draftResult.awayTeam];
        const mvp = all.find(p => p.id === mvpPlayerId);
        if (!mvp) return null;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 10,
          }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <div>
              <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#FFD700' }}>Craque da Partida</p>
              <p style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{mvp.name}</p>
            </div>
          </div>
        );
      })()}

      {/* Picker de Craque */}
      {mvpPickerOpen && draftResult && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setMvpPickerOpen(false)}>
          <GlassCard className="w-full max-w-md p-6 rounded-2xl border-yellow-500/20" >
            <div onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="text-yellow-400" /> Eleger Craque
                </h3>
                <button onClick={() => setMvpPickerOpen(false)} className="text-white/30 hover:text-white">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {(['home', 'away'] as const).map(side => (
                  <div key={side} className="space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-1">
                      {side === 'home' ? 'Time A' : 'Time B'}
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {(side === 'home' ? draftResult.homeTeam : draftResult.awayTeam).map((p: Player) => (
                        <button key={p.id}
                          onClick={() => { onElectMVP?.(p.id, side); setMvpPickerOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all">
                          <span className="text-[10px] font-black uppercase text-white">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Resumo do placar */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: draftResult ? 'Gols ' + (draftResult.homeTeam.length > 0 ? '' : '') : 'Time A', goals: homeGoals, color: '#ccff00' },
            { label: 'Time B', goals: awayGoals, color: '#00b4ff' },
          ].map((t, i) => (
            <div key={i} style={{
              padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${t.color}15`, borderLeft: `3px solid ${t.color}`, borderRadius: 8,
            }}>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                {i === 0 ? 'Time Mandante' : 'Time Visitante'}
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.goals}</p>
              <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 2, fontWeight: 700 }}>GOLS</p>
            </div>
          ))}
        </div>
      )}

      {/* Artilheiros desta partida */}
      {scorers.length > 0 && (
        <GlassCard className="p-4 border-white/5 bg-white/[0.02] rounded-xl">
          <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faFutbol} className="text-primary" style={{ fontSize: 9 }} />
            Artilheiros desta partida
          </h4>
          <div className="space-y-1.5">
            {scorers.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: s.team === 'home' ? 'rgba(204,255,0,0.2)' : 'rgba(0,180,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faFutbol} style={{ fontSize: 7, color: s.team === 'home' ? '#ccff00' : '#00b4ff' }} />
                </div>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}>{s.name}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: s.team === 'home' ? '#ccff00' : '#00b4ff' }}>
                  {s.goals > 1 ? `${s.goals}×` : '⚽'}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Feed de eventos */}
      <GlassCard className="border-white/5 bg-white/[0.02] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Feed da Partida</h4>
          <span className="text-[8px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded">{events.length}</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">Nenhum evento registrado</p>
            </div>
          ) : (
            events.map(ev => {
              const color = EVENT_COLOR[ev.type] ?? '#fff';
              const icon  = EVENT_ICON[ev.type]  ?? faFutbol;
              return (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ width: 3, height: 24, borderRadius: 2, flexShrink: 0,
                    background: ev.team === 'home' ? '#ccff00' : '#00b4ff' }} />
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={icon} style={{ fontSize: 9, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(ev as any).player?.name ?? '—'}
                      </span>
                      <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 3,
                        background: `${color}18`, color, textTransform: 'uppercase', flexShrink: 0 }}>
                        {ev.type}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    {fmtEventTime(ev.minute)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Comentários ao vivo */}
      <GlassCard className="border-white/5 bg-white/[0.02] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
            <FontAwesomeIcon icon={faComment} className="text-violet-400" style={{ fontSize: 9 }} />
            Comentários
          </h4>
          <span className="text-[8px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded">{comments.length}</span>
        </div>

        {/* Caixa de envio */}
        {onAddComment && (
          <div className="px-3 py-2.5 border-b border-white/5 space-y-2">
            {/* Seletor de quem está comentando */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/25 flex-shrink-0">Comentar como</span>
              <select
                value={author}
                onChange={e => onChangeAuthor(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-violet-200 outline-none focus:border-violet-400/40"
              >
                <option value={currentUserName}>{currentUserName} (eu)</option>
                {roster.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
                maxLength={240}
                placeholder="Comente o lance..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-violet-400/40"
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-300 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 11 }} />
              </button>
            </div>
          </div>
        )}

        {/* Lista de comentários */}
        <div className="max-h-72 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">Seja o primeiro a comentar</p>
            </div>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className="px-4 py-2.5 border-b border-white/[0.04]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-violet-300 flex-shrink-0">{c.author_name}</span>
                  <span className="text-[7px] font-bold text-white/20 flex-shrink-0">
                    {c.created_at ? new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-[12px] text-white/80 mt-0.5 break-words">{c.message}</p>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Nova rodada */}
      {userRole === 'owner' && (
        <button
          onClick={() => { if (confirm('Encerrar a partida atual? Ela vai para o histórico e você poderá criar uma nova.')) handleNewMatch(); }}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white/[0.03] border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all rounded-xl group"
        >
          <FontAwesomeIcon icon={faRotateLeft} className="text-white/15 group-hover:text-red-500 text-xs transition-colors" />
          <span className="text-[9px] font-black uppercase text-white/15 group-hover:text-red-500 tracking-[0.3em] transition-colors">
            Encerrar Partida
          </span>
        </button>
      )}
    </div>
  );
};
