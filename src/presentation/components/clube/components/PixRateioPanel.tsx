'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faCopy, faCheck, faDivide, faMoneyBillWave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { generatePixCode } from '@/core/services/PixService';
import { FinanceRepository } from '@/infra/repositories/FinanceRepository';
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

export const PixRateioPanel: React.FC<Props> = ({ groupId, groupName, players, onRefresh }) => {
  const financeRepo = new FinanceRepository();

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

  // ── Rateio ────────────────────────────────────────────────────────────
  const activePlayers = players.filter(p => p.status === 'Ativo');
  const [rateioTotal, setRateioTotal] = useState('');
  const [rateioCount, setRateioCount] = useState(String(activePlayers.length || 0));
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);

  const totalNum = parseFloat(rateioTotal.replace(',', '.'));
  const countNum = parseInt(rateioCount) || 0;
  const perHead  = totalNum > 0 && countNum > 0 ? totalNum / countNum : 0;

  const launchRateio = async () => {
    if (perHead <= 0) return;
    if (!confirm(`Lançar cobrança de R$${perHead.toFixed(2)} para ${activePlayers.length} atletas ativos?`)) return;
    setLaunching(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      for (const p of activePlayers) {
        await financeRepo.create({
          group_id: groupId,
          player_id: p.id,
          type: 'Receita',
          category: 'Rateio',
          description: `Rateio da pelada (${today})`,
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Custo total (quadra, etc.)</label>
            <input style={inp} value={rateioTotal} placeholder="200,00" inputMode="decimal"
              onChange={e => setRateioTotal(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Nº de jogadores</label>
            <input style={inp} value={rateioCount} inputMode="numeric"
              onChange={e => setRateioCount(e.target.value)} />
          </div>
        </div>

        {/* Resultado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>
            Por jogador
          </span>
          <span style={{ fontSize: 24, fontWeight: 900, color: perHead > 0 ? neon : 'rgba(255,255,255,0.2)' }}>
            R${perHead.toFixed(2)}
          </span>
        </div>

        <button onClick={launchRateio} disabled={perHead <= 0 || launching || activePlayers.length === 0}
          style={{
            width: '100%', padding: '12px 0', fontWeight: 900, fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.2em', border: 'none', borderRadius: 8,
            cursor: perHead > 0 && !launching ? 'pointer' : 'not-allowed',
            background: launched ? green : perHead > 0 ? `linear-gradient(135deg,${blue},#0088cc)` : 'rgba(255,255,255,0.05)',
            color: perHead > 0 || launched ? '#000' : 'rgba(255,255,255,0.2)',
          }}>
          {launching
            ? <><FontAwesomeIcon icon={faSpinner} spin /> Lançando...</>
            : launched
            ? <><FontAwesomeIcon icon={faCheck} /> Cobranças lançadas!</>
            : <><FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: 6 }} /> Lançar cobrança p/ {activePlayers.length} ativos</>
          }
        </button>
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: 700 }}>
          Cria uma receita pendente por atleta ativo na categoria "Rateio".
        </p>
      </div>
    </div>
  );
};
