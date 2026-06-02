'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faPaperPlane, faMobileScreen } from '@fortawesome/free-solid-svg-icons';

interface Props {
  pushStats: { total: number; perGroup: { group_id: string; count: number }[] };
  groupNameById: Map<string, string>;
}

export function AdminPushTab({ pushStats, groupNameById }: Props) {
  const [target, setTarget] = useState<string>('all'); // 'all' | group_id
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');

  const send = async () => {
    if (!title.trim()) { alert('Informe o título do aviso.'); return; }
    setSending(true);
    setResult('');
    try {
      const payload: any = { title: title.trim(), body: body.trim(), url: '/dashboard', includeSelf: true };
      if (target === 'all') payload.all = true; else payload.groupId = target;
      const res = await fetch('/api/push/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) setResult(`Erro: ${json.error}`);
      else setResult(`✅ Enviado para ${json.total ?? 0} dispositivo(s)${json.removed ? `, ${json.removed} expirado(s) removido(s)` : ''}.`);
      setTitle(''); setBody('');
    } catch (e: any) {
      setResult(`Erro: ${e?.message ?? 'falha no envio'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid #f59e0b18', borderLeft: '3px solid #f59e0b', borderRadius: 8 }}>
          <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Dispositivos inscritos</p>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{pushStats.total}</p>
        </div>
      </div>

      {/* Composer de broadcast */}
      <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02] space-y-3">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
          <FontAwesomeIcon icon={faBell} className="text-amber-400" /> Enviar aviso (broadcast)
        </h3>

        <div>
          <label className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Destino</label>
          <select value={target} onChange={e => setTarget(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] font-bold text-white outline-none focus:border-amber-400/40">
            <option value="all">🌐 Todos os clubes</option>
            {pushStats.perGroup.map(g => (
              <option key={g.group_id} value={g.group_id}>{groupNameById.get(g.group_id) ?? g.group_id} ({g.count})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60}
            placeholder="Ex: ⚽ Pelada confirmada hoje!"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] font-bold text-white placeholder:text-white/20 outline-none focus:border-amber-400/40" />
        </div>

        <div>
          <label className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Mensagem</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={160} rows={2}
            placeholder="Detalhes do aviso..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-amber-400/40 resize-none" />
        </div>

        <button onClick={send} disabled={sending}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 border border-amber-400/40 text-amber-300 font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-amber-500 hover:text-black transition-all disabled:opacity-40">
          <FontAwesomeIcon icon={faPaperPlane} /> {sending ? 'Enviando...' : 'Disparar aviso'}
        </button>
        {result && <p className="text-[10px] font-bold text-white/60">{result}</p>}
      </div>

      {/* Inscrições por clube */}
      <div className="border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <FontAwesomeIcon icon={faMobileScreen} /> Inscrições por clube
          </h3>
        </div>
        {pushStats.perGroup.length === 0 ? (
          <p className="text-center py-10 text-[9px] font-black uppercase text-white/20 tracking-widest">Nenhum dispositivo inscrito ainda</p>
        ) : pushStats.perGroup.map((g, i) => (
          <div key={g.group_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[11px] font-bold text-white/80">{groupNameById.get(g.group_id) ?? g.group_id}</span>
            <span className="text-[11px] font-black text-amber-400">{g.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
