import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faHandshake, faSquare, faPlus, faChartBar, faRotateLeft, faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
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
}) => {
  const [mvpPickerOpen, setMvpPickerOpen] = useState(false);
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
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    {ev.minute}&apos;
                  </span>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Nova rodada */}
      {userRole === 'owner' && (
        <button
          onClick={() => { if (confirm('Deseja reiniciar e limpar o sorteio?')) handleNewMatch(); }}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white/[0.03] border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all rounded-xl group"
        >
          <FontAwesomeIcon icon={faRotateLeft} className="text-white/15 group-hover:text-red-500 text-xs transition-colors" />
          <span className="text-[9px] font-black uppercase text-white/15 group-hover:text-red-500 tracking-[0.3em] transition-colors">
            Reiniciar Rodada
          </span>
        </button>
      )}
    </div>
  );
};
