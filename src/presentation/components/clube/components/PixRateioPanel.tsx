'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faCopy, faCheck, faDivide, faMoneyBillWave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { generatePixCode } from '@/core/services/PixService';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
import { MatchRepository } from '@/infra/repositories/MatchRepository';
import { supabase } from '@/infra/supabase/client';
import { Player } from '@/core/entities/player';

interface Props {
  groupId: string;
  groupName: string;
  players: Player[];
  onRefresh: () => void;
}

const green = '#22c55e';
const blue  = '#00b4ff';
const neon  = '#ccff00';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12,
  fontWeight: 600, outline: 'none', boxSizing: 'border-box', borderRadius: 6,
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
  letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 5,
};

export const PixRateioPanel: React.FC<Props> = ({ groupId, groupName, onRefresh }) => {
  const financeRepo = new FinanceRepository();
  const matchRepo = new MatchRepository();

  // ── PIX ───────────────────────────────────────────────────────────────
  const [pixKey,  setPixKey]  = useState('');
  const [pixName, setPixName] = useState(groupName);
  const [pixAmount, setPixAmount] = useState('');
  const [pixDesc, setPixDesc] = useState('Pelada');
  const [copied,  setCopied]  = useState(false);

  // Persiste chave/nome localmente (sem migração de banco)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pix:${groupId}`);
      if (saved) {
        const o = JSON.parse(saved);
        if (o.pixKey)  setPixKey(o.pixKey);
        if (o.pixName) setPixName(o.pixName);
      }
    } catch {}
  }, [groupId]);

  const savePix = (key: string, name: string) => {
    try { localStorage.setItem(`pix:${groupId}`, JSON.stringify({ pixKey: key, pixName: name })); } catch {}
  };

  const amountNum = parseFloat(pixAmount.replace(',', '.'));
  const pixCode = pixKey
    ? generatePixCode({
        pixKey: pixKey.trim(),
        merchantName: pixName || groupName,
        amount: !isNaN(amountNum) && amountNum > 0 ? amountNum : undefined,
        description: pixDesc,
      })
    : '';

  const copyPix = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Rateio (por partida, só quem participou) ──────────────────────────
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [participants, setParticipants] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loadingPart, setLoadingPart] = useState(false);
  const [rateioTotal, setRateioTotal] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);

  const toggleExcluded = (id: string) =>
    setExcluded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Carrega as partidas do grupo
  useEffect(() => {
    supabase.from('matches')
      .select('id, date, home_team_name, away_team_name, status, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setMatches(data ?? []);
        if (data && data.length && !selectedMatchId) setSelectedMatchId(data[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Carrega quem participou da partida selecionada
  useEffect(() => {
    if (!selectedMatchId) { setParticipants([]); return; }
    setLoadingPart(true);
    matchRepo.getPresence(selectedMatchId)
      .then(rows => {
        const ps = (rows ?? [])
          .filter((r: any) => r.player)
          .map((r: any) => ({ id: r.player_id, name: r.player?.name ?? '—', phone: r.player?.phone }));
        setParticipants(ps);
        setExcluded(new Set());
      })
      .catch(() => setParticipants([]))
      .finally(() => setLoadingPart(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId]);

  const included = participants.filter(p => !excluded.has(p.id));
  const totalNum = parseFloat(rateioTotal.replace(',', '.'));
  const countNum = included.length;
  const perHead  = totalNum > 0 && countNum > 0 ? totalNum / countNum : 0;

  // PIX com o valor POR JOGADOR (para a mensagem do WhatsApp)
  const perHeadPixCode = pixKey && perHead > 0
    ? generatePixCode({ pixKey: pixKey.trim(), merchantName: pixName || groupName, amount: Number(perHead.toFixed(2)), description: 'Rateio da pelada' })
    : '';

  const sanitizePhone = (raw?: string) => {
    if (!raw) return '';
    let d = raw.replace(/\D/g, '');
    if (d.length >= 10 && d.length <= 11) d = '55' + d; // adiciona DDI Brasil se faltar
    return d;
  };

  const whatsappCobranca = (p: { name: string; phone?: string }) => {
    const phone = sanitizePhone(p.phone);
    const first = p.name.split(' ')[0];
    const linhas = [
      `⚽ *Rateio da pelada*`,
      `Olá ${first}! Sua parte ficou em *R$${perHead.toFixed(2)}*.`,
    ];
    if (perHeadPixCode) linhas.push('', 'PIX copia e cola:', perHeadPixCode);
    const text = encodeURIComponent(linhas.join('\n'));
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const matchLabel = (m: any) =>
    `${new Date(m.date ?? m.created_at).toLocaleDateString('pt-BR')} · ${m.home_team_name || 'Time A'} x ${m.away_team_name || 'Time B'}`;

  const launchRateio = async () => {
    if (perHead <= 0 || included.length === 0) return;
    if (!confirm(`Lançar cobrança de R$${perHead.toFixed(2)} para os ${included.length} jogadores selecionados?`)) return;
    setLaunching(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      for (const p of included) {
        await financeRepo.create({
          group_id: groupId,
          player_id: p.id,
          type: 'Receita',
          category: 'Rateio',
          description: `Rateio da partida (${today})`,
          amount: Number(perHead.toFixed(2)),
          status: 'Pendente',
          date: today,
        } as any);
      }
      setLaunched(true);
      setTimeout(() => setLaunched(false), 3000);
      onRefresh();
    } catch (e: any) {
      alert(`Erro ao lançar rateio: ${e.message}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PIX copia e cola ── */}
      <div style={{ padding: 20, background: 'rgba(34,197,94,0.03)', border: `1px solid ${green}25`, borderRadius: 10 }}>
        <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: green, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faQrcode} /> PIX da Pelada
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Chave PIX</label>
            <input style={inp} value={pixKey} placeholder="CPF, e-mail, telefone..."
              onChange={e => { setPixKey(e.target.value); savePix(e.target.value, pixName); }} />
          </div>
          <div>
            <label style={lbl}>Recebedor</label>
            <input style={inp} value={pixName}
              onChange={e => { setPixName(e.target.value); savePix(pixKey, e.target.value); }} />
          </div>
          <div>
            <label style={lbl}>Valor (opcional)</label>
            <input style={inp} value={pixAmount} placeholder="0,00" inputMode="decimal"
              onChange={e => setPixAmount(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Descrição</label>
            <input style={inp} value={pixDesc} onChange={e => setPixDesc(e.target.value)} />
          </div>
        </div>

        {pixCode ? (
          <div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${green}30`,
                fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', borderRadius: 6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pixCode}
              </div>
              <button onClick={copyPix} style={{
                padding: '8px 16px', background: copied ? green : `${green}20`, color: copied ? '#000' : green,
                border: `1px solid ${green}44`, fontWeight: 900, fontSize: 9, textTransform: 'uppercase',
                borderRadius: 6, cursor: 'pointer', flexShrink: 0, letterSpacing: '0.1em',
              }}>
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ marginRight: 5 }} />
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: 700 }}>
              📋 Copie e cole no app do banco, ou compartilhe no grupo do WhatsApp.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
            Informe a chave PIX para gerar o código copia-e-cola.
          </p>
        )}
      </div>

      {/* ── Rateio automático ── */}
      <div style={{ padding: 20, background: 'rgba(0,180,255,0.03)', border: `1px solid ${blue}25`, borderRadius: 10 }}>
        <h3 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: blue, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faDivide} /> Rateio da Partida
        </h3>

        {/* Seletor de partida */}
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Partida (cobra só quem participou)</label>
          <select style={{ ...inp, cursor: 'pointer' }} value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
            {matches.length === 0 && <option value="">Nenhuma partida encontrada</option>}
            {matches.map(m => (
              <option key={m.id} value={m.id}>{matchLabel(m)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Custo total (quadra, etc.)</label>
            <input style={inp} value={rateioTotal} placeholder="200,00" inputMode="decimal"
              onChange={e => setRateioTotal(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Participaram</label>
            <div style={{ ...inp, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 900, color: countNum ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {loadingPart ? '...' : `${countNum} jogador${countNum === 1 ? '' : 'es'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Resultado + PIX inline */}
        {(() => {
          const [copiedRateio, setCopiedRateio] = React.useState(false);
          const copyRateio = () => {
            if (!perHeadPixCode) return;
            navigator.clipboard.writeText(perHeadPixCode);
            setCopiedRateio(true);
            setTimeout(() => setCopiedRateio(false), 2500);
          };
          return (
            <div style={{ marginBottom: 14 }}>
              {/* Valor por jogador */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: perHeadPixCode ? '8px 8px 0 0' : 8,
                borderBottom: perHeadPixCode ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                    Por jogador
                  </p>
                  {perHead > 0 && countNum > 0 && (
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                      R${totalNum.toFixed(2)} ÷ {countNum} jogadores
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 28, fontWeight: 900, color: perHead > 0 ? neon : 'rgba(255,255,255,0.2)' }}>
                  R${perHead.toFixed(2)}
                </span>
              </div>

              {/* PIX por jogador — aparece automaticamente quando calculado */}
              {perHeadPixCode && (
                <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.06)',
                  border: `1px solid ${green}30`, borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                  <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                    color: green, marginBottom: 6 }}>
                    PIX por jogador (R${perHead.toFixed(2)})
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(0,0,0,0.5)',
                      border: `1px solid ${green}25`, borderRadius: 6, fontSize: 8, fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {perHeadPixCode}
                    </div>
                    <button onClick={copyRateio} style={{
                      padding: '6px 14px', background: copiedRateio ? green : `${green}18`,
                      color: copiedRateio ? '#000' : green, border: `1px solid ${green}40`,
                      fontWeight: 900, fontSize: 8, textTransform: 'uppercase', borderRadius: 6,
                      cursor: 'pointer', flexShrink: 0, letterSpacing: '0.1em',
                    }}>
                      <FontAwesomeIcon icon={copiedRateio ? faCheck : faCopy} style={{ marginRight: 4 }} />
                      {copiedRateio ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Lista de quem vai ratear (toque pra incluir/excluir + WhatsApp) */}
        {participants.length > 0 && (
          <div style={{ marginBottom: 14, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>Quem vai ratear</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{countNum}/{participants.length}</span>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {participants.map(p => {
                const isIn = !excluded.has(p.id);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: isIn ? 1 : 0.4 }}>
                    <button onClick={() => toggleExcluded(p.id)} title={isIn ? 'Remover do rateio' : 'Incluir no rateio'}
                      style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 4, cursor: 'pointer',
                        background: isIn ? green : 'transparent', border: `1px solid ${isIn ? green : 'rgba(255,255,255,0.2)'}`,
                        color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                      {isIn && <FontAwesomeIcon icon={faCheck} />}
                    </button>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                      {!p.phone && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>sem telefone</span>}
                    </span>
                    {isIn && perHead > 0 && (
                      <button onClick={() => whatsappCobranca(p)} title="Cobrar no WhatsApp"
                        style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                          background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366',
                          fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        WhatsApp
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={launchRateio} disabled={perHead <= 0 || launching || countNum === 0}
          style={{
            width: '100%', padding: '12px 0', fontWeight: 900, fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.2em', border: 'none', borderRadius: 8,
            cursor: perHead > 0 && countNum > 0 && !launching ? 'pointer' : 'not-allowed',
            background: launched ? green : (perHead > 0 && countNum > 0) ? `linear-gradient(135deg,${blue},#0088cc)` : 'rgba(255,255,255,0.05)',
            color: (perHead > 0 && countNum > 0) || launched ? '#000' : 'rgba(255,255,255,0.2)',
          }}>
          {launching
            ? <><FontAwesomeIcon icon={faSpinner} spin /> Lançando...</>
            : launched
            ? <><FontAwesomeIcon icon={faCheck} /> Cobranças lançadas!</>
            : <><FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: 6 }} /> Lançar cobrança p/ {countNum} participante{countNum === 1 ? '' : 's'}</>
          }
        </button>
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: 700 }}>
          Cria uma receita pendente só para quem esteve presente na partida selecionada.
        </p>
      </div>
    </div>
  );
};
