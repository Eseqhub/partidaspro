'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const neon  = '#ccff00';
const blue  = '#00b4ff';
const gold  = '#d4a017';
const red   = '#ef4444';
const green = '#22c55e';
const dark  = '#020810';

const FEATURES = [
  { icon: '⚡', color: neon, title: 'Sorteio Inteligente', desc: 'Times equilibrados automaticamente com base no nível e nas características dos atletas. Menos discussão, mais jogo.' },
  { icon: '📋', color: blue, title: 'Chamada Digital', desc: 'Envie um único link e deixe cada atleta confirmar presença. O elenco fica pronto antes da bola rolar.' },
  { icon: '⚽', color: neon, title: 'Placar ao Vivo', desc: 'Cronômetro, gols e lances sincronizados em tempo real. Compartilhe a partida e deixe todo mundo acompanhar.' },
  { icon: '📊', color: blue, title: 'Estatísticas', desc: 'Gols, assistências, vitórias, derrotas e craques. A história de cada jogador é construída partida após partida.' },
  { icon: '💰', color: gold, title: 'Rateio & Financeiro', desc: 'Organize a caixinha, mensalidades e despesas do clube. Tenha tudo registrado sem planilha ou calculadora.' },
  { icon: '🏆', color: gold, title: 'Histórico de Partidas', desc: 'Súmula, placares, craques e resultados ficam salvos. Sua pelada ganha memória e ranking de verdade.' },
  { icon: '👥', color: green, title: 'Gestão de Atletas', desc: 'Cadastre jogadores, posições, nível, foto e contatos. Convide novos atletas pelo link do seu clube.' },
  { icon: '📜', color: '#b45309', title: 'Regras do Clube', desc: 'Defina as regras da pelada e deixe tudo claro para os atletas. Cada clube joga do seu jeito.' },
];

const PROBLEMS = [
  { emoji: '😤', text: 'Ficar contando quem confirmou no grupo do WhatsApp' },
  { emoji: '⚖️', text: 'Sortear times no improviso e ouvir reclamação de desequilíbrio' },
  { emoji: '💸', text: 'Cobrar a caixinha e tentar lembrar quem já pagou' },
  { emoji: '📵', text: 'Apitar, jogar e ainda responder “quanto está o jogo?”' },
  { emoji: '🤔', text: 'Perder o histórico e não saber quem está voando na temporada' },
];

const STEPS = [
  { n: '01', color: neon, title: 'Crie seu clube', desc: 'Cadastre o clube em poucos minutos e gere seu link exclusivo para convidar os atletas.' },
  { n: '02', color: blue, title: 'Monte a partida', desc: 'Escolha modalidade, horário e regras. Faça a chamada e deixe o sistema preparar o jogo.' },
  { n: '03', color: gold, title: 'Jogue. O resto é automático.', desc: 'Times, placar, súmula, estatísticas e financeiro ficam organizados em um só lugar.' },
];

export default function Home() {
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <div style={{ background: dark, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100dvh', overflowX: 'hidden' }}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow de fundo */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 500, height: 500, background: `${neon}08`, borderRadius: '50%',
          filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
            background: `${neon}10`, border: `1px solid ${neon}30`, borderRadius: 999,
            fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em',
            color: neon, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: neon, boxShadow: `0 0 12px ${neon}` }} />
            Gestão de peladas sem complicação
          </div>

          <h1 style={{ fontSize: 'clamp(36px,8vw,72px)', fontWeight: 900, lineHeight: 1.05,
            textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: 20 }}>
            Sua pelada.<br />
            <span style={{ color: neon }}>Seu clube.</span><br />
            Seu jogo.
          </h1>

          <p style={{ fontSize: 'clamp(15px,2.5vw,20px)', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, maxWidth: 520, margin: '0 auto 36px', fontWeight: 500 }}>
            Organize presença, sorteie times equilibrados, acompanhe o placar, registre os lances e mantenha o financeiro em ordem. <strong style={{ color: '#fff' }}>Tudo em um só lugar.</strong>
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              padding: '16px 32px', fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: '#000', background: `linear-gradient(135deg,${neon},#aadd00)`,
              textDecoration: 'none', borderRadius: 8, boxShadow: `0 0 40px ${neon}33`,
            }}>
              Criar meu clube — grátis
            </Link>
            <Link href="/login" style={{
              padding: '16px 32px', fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none', borderRadius: 8,
            }}>
              Já tenho conta
            </Link>
          </div>

          {/* Prova social rápida */}
          <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Sem cartão · Sem instalação · 2 minutos para começar
          </p>
        </div>
      </section>

      {/* ── RESUMO DE VALOR ─────────────────────────────────────── */}
      <section style={{ padding: '0 24px 56px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            ['01', 'Chamada', 'Presença organizada'],
            ['02', 'Sorteio', 'Times equilibrados'],
            ['03', 'Jogo', 'Placar em tempo real'],
            ['04', 'Histórico', 'Tudo registrado'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ padding: '22px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: neon, fontWeight: 900, letterSpacing: '0.18em', marginBottom: 7 }}>{n}</div>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA ──────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
            Você ainda faz isso?
          </p>
          <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '-0.02em', marginBottom: 36, lineHeight: 1.2 }}>
            Organizar pelada é <span style={{ color: red }}>uma bagunça</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
                background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)',
                borderRadius: 10, textAlign: 'left' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{p.emoji}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{p.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: '16px 20px', background: `${neon}0c`,
            border: `1px solid ${neon}25`, borderRadius: 10 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: neon }}>
              O Partidas Pro resolve <strong>tudo isso</strong> de forma automática.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Tudo incluso</p>
            <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Ferramentas de <span style={{ color: neon }}>clube profissional</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: '22px 20px', background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${f.color}18`, borderLeft: `3px solid ${f.color}`,
                borderRadius: 10, transition: 'transform 0.2s' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#fff', marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontWeight: 500 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Simples assim</p>
          <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '-0.02em', marginBottom: 52, lineHeight: 1.1 }}>
            Pronto em <span style={{ color: neon }}>3 passos</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: 'relative', padding: '28px 22px',
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}20`, borderRadius: 12 }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: `${s.color}20`, marginBottom: 14,
                  fontFamily: 'monospace', lineHeight: 1 }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: s.color, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontWeight: 500 }}>
                  {s.desc}
                </p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 18, color: 'rgba(255,255,255,0.1)', display: 'none' }}>›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS — temporariamente oculto ─────────────────────── */}
      {false && <section style={{ padding: '80px 24px' }} id="planos">
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Sem surpresas</p>
          <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.1 }}>
            Planos simples
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 40, fontWeight: 500 }}>
            Comece grátis. Faça upgrade quando a pelada crescer.
          </p>

          {/* Toggle anual/mensal */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 36,
            padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            {['Mensal', 'Anual (−20%)'].map((label, i) => (
              <button key={label} onClick={() => setBillingAnnual(i === 1)}
                style={{ padding: '8px 18px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.1em', border: 'none', cursor: 'pointer', borderRadius: 5,
                  background: billingAnnual === (i === 1) ? neon : 'transparent',
                  color: billingAnnual === (i === 1) ? '#000' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
            {/* FREE */}
            <div style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, textAlign: 'left' }}>
              <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Free</p>
              <p style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
                R$0
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28, fontWeight: 600 }}>
                para sempre
              </p>
              {['1 clube', 'Até 25 atletas', 'Sorteio inteligente', 'Chamada + placar', 'Estatísticas básicas'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: green, fontSize: 12, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
              <Link href="/signup" style={{
                display: 'block', marginTop: 28, padding: '13px 0', textAlign: 'center',
                fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, textDecoration: 'none',
              }}>
                Começar grátis
              </Link>
            </div>

            {/* PRO */}
            <div style={{ padding: '32px 28px', position: 'relative',
              background: `linear-gradient(135deg,${neon}0e,rgba(0,0,0,0.4))`,
              border: `1px solid ${neon}35`, borderRadius: 14, textAlign: 'left' }}>
              <div style={{ position: 'absolute', top: -12, right: 20, padding: '4px 12px',
                background: neon, color: '#000', fontSize: 9, fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.15em', borderRadius: 4 }}>
                Mais popular
              </div>
              <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                color: neon, marginBottom: 12 }}>Pro</p>
              <p style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
                R${billingAnnual ? '39' : '49'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28, fontWeight: 600 }}>
                por clube / {billingAnnual ? 'mês (cobrado anualmente)' : 'mês'}
              </p>
              {[
                'Clubes ilimitados', 'Atletas ilimitados', 'Financeiro + rateio PIX',
                'Relatórios em PDF', 'Estatísticas completas', 'Temporadas + histórico',
                'Suporte prioritário',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: neon, fontSize: 12, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
              <Link href="/signup" style={{
                display: 'block', marginTop: 28, padding: '13px 0', textAlign: 'center',
                fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
                color: '#000', background: `linear-gradient(135deg,${neon},#aadd00)`,
                borderRadius: 8, textDecoration: 'none',
                boxShadow: `0 0 24px ${neon}33`,
              }}>
                Testar 14 dias grátis
              </Link>
            </div>
          </div>
        </div>
      </section>}

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 400, background: `${neon}06`, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
            Chega de<br /><span style={{ color: neon }}>grupo do zap</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 36, fontWeight: 500 }}>
            Crie seu clube agora, convide os atletas pelo link e faça o próximo sorteio em menos de 2 minutos.
          </p>
          <Link href="/signup" style={{
            display: 'inline-block', padding: '18px 40px',
            fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
            color: '#000', background: `linear-gradient(135deg,${neon},#aadd00)`,
            textDecoration: 'none', borderRadius: 8, boxShadow: `0 0 50px ${neon}44`,
          }}>
            Criar meu Clube — É Grátis
          </Link>
          <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

    </div>
  );
}
