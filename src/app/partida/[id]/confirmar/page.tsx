'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/infra/supabase/client';
import { confirmPresenceLoggedIn, onboardAndConfirm } from '@/infra/actions/presenceActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol, faUser, faCheckCircle, faSpinner,
  faShieldHalved, faChartSimple,
} from '@fortawesome/free-solid-svg-icons';

type ScreenState = 'loading' | 'logged-in' | 'onboarding' | 'success' | 'error';

const POSITIONS = ['G', 'ZAG', 'LD', 'LE', 'VOL', 'MC', 'MO', 'PE', 'PD', 'SA', 'CA'];

export default function ConfirmarPresencaPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const matchId = params.id as string;
  const token   = searchParams.get('token') ?? '';

  const [screen, setScreen]   = useState<ScreenState>('loading');
  const [groupId, setGroupId] = useState('');
  const [match, setMatch]     = useState<any>(null);
  const [user, setUser]       = useState<any>(null);

  // Form de onboarding
  const [name, setName]       = useState('');
  const [pos, setPos]         = useState('SA');
  const [skill, setSkill]     = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  useEffect(() => {
    async function init() {
      try {
        // Busca dados da partida
        const { data: m, error: mErr } = await supabase
          .from('matches')
          .select('*, group:groups(name, logo_url)')
          .eq('id', matchId)
          .single();

        if (mErr || !m) { setScreen('error'); return; }
        setMatch(m);
        setGroupId(m.group_id);

        // Verifica sessão
        const { data: { user: u } } = await supabase.auth.getUser();
        setUser(u);
        setScreen(u ? 'logged-in' : 'onboarding');
      } catch {
        setScreen('error');
      }
    }
    init();
  }, [matchId]);

  const handleLoggedInConfirm = async () => {
    setSubmitting(true);
    try {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('group_id', groupId)
        .limit(1)
        .maybeSingle();

      await confirmPresenceLoggedIn(matchId, player?.id ?? user.id);
      setScreen('success');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally { setSubmitting(false); }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await onboardAndConfirm(matchId, groupId, { name, posicao_principal: pos, skill_level: skill });
    if (result.success) { setScreen('success'); }
    else { setErrorMsg(result.error ?? 'Erro ao confirmar.'); }
    setSubmitting(false);
  };

  const blue = '#00b4ff';
  const gold = '#d4a017';
  const green = '#22c55e';

  const panelStyle: React.CSSProperties = {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    background: 'linear-gradient(160deg,#020810 0%,#050e1f 100%)',
    fontFamily: 'inherit',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 420, padding: 32,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${blue}22`,
    boxShadow: `0 0 60px ${blue}11`,
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 p-3 text-white text-xs font-bold uppercase tracking-wider outline-none focus:border-blue-500/50 transition-colors';
  const labelCls = 'block text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1.5';

  // ── LOADING ──────────────────────────────────────────────────
  if (screen === 'loading') return (
    <div style={panelStyle}>
      <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-400" />
    </div>
  );

  // ── ERRO ─────────────────────────────────────────────────────
  if (screen === 'error') return (
    <div style={panelStyle}>
      <div style={cardStyle} className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-white font-black uppercase text-lg mb-2">Partida não encontrada</h1>
        <p className="text-white/40 text-xs">O link pode ter expirado ou ser inválido.</p>
      </div>
    </div>
  );

  // ── SUCESSO ───────────────────────────────────────────────────
  if (screen === 'success') return (
    <div style={panelStyle}>
      <div style={{ ...cardStyle, textAlign: 'center', border: `1px solid ${green}33` }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${green}18`,
          border: `2px solid ${green}44`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>
          <FontAwesomeIcon icon={faCheckCircle} style={{ color: green }} />
        </div>
        <h1 className="text-white font-black uppercase text-xl mb-2">Presença Confirmada!</h1>
        <p className="text-white/40 text-xs mb-6">
          Você está na lista para a partida do {match?.group?.name ?? 'grupo'}.
          O organizador irá sortear os times antes do jogo.
        </p>
        <div style={{ padding: '12px 16px', background: `${green}0a`, border: `1px solid ${green}20`, fontSize: 11, color: `${green}cc` }}>
          🏆 Boa partida!
        </div>
      </div>
    </div>
  );

  const matchDate = match?.date ? new Date(match.date).toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' }) : '—';

  // ── HEADER COMUM ─────────────────────────────────────────────
  const MatchHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      {match?.group?.logo_url
        ? <img src={match.group.logo_url} alt="logo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', border: `2px solid ${blue}44` }} />
        : <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${blue}15`, border: `2px solid ${blue}33`, margin: '0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 28 }}>
            <FontAwesomeIcon icon={faFutbol} style={{ color: blue }} />
          </div>
      }
      <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: blue, lineHeight: 1.2, marginBottom: 4 }}>
        CONVITE DE PARTIDA
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {match?.group?.name ?? 'Partida'}
      </h1>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{matchDate}</p>
    </div>
  );

  // ── USUÁRIO LOGADO ────────────────────────────────────────────
  if (screen === 'logged-in') return (
    <div style={panelStyle}>
      <div style={cardStyle}>
        <MatchHeader />
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24 }}>
          Você está logado como <strong style={{ color: '#fff' }}>{user?.email}</strong>.
        </p>
        {errorMsg && <p style={{ color: '#ef4444', fontSize: 11, marginBottom: 16, textAlign: 'center' }}>{errorMsg}</p>}
        <button
          onClick={handleLoggedInConfirm}
          disabled={submitting}
          style={{
            width: '100%', padding: '16px 0', fontWeight: 900, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.3em', border: 'none',
            cursor: submitting ? 'wait' : 'pointer',
            background: submitting ? 'rgba(34,197,94,0.3)' : `linear-gradient(135deg,${green},#16a34a)`,
            color: '#000', transition: 'all .2s',
          }}
        >
          {submitting
            ? <FontAwesomeIcon icon={faSpinner} spin />
            : <><FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />CONFIRMAR PRESENÇA</>
          }
        </button>
        <button
          onClick={() => setScreen('onboarding')}
          style={{ marginTop: 12, width: '100%', padding: '10px 0', background: 'none',
            border: `1px solid rgba(255,255,255,0.1)`, color: 'rgba(255,255,255,0.4)',
            fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faUser} style={{ marginRight: 6 }} />
          Entrar com outro perfil
        </button>
      </div>
    </div>
  );

  // ── ONBOARDING (não logado) ───────────────────────────────────
  return (
    <div style={panelStyle}>
      <div style={cardStyle}>
        <MatchHeader />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 }}>
          Preencha seus dados para confirmar presença e entrar no sorteio de times.
        </p>

        <form onSubmit={handleOnboard} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nome */}
          <div>
            <label className={labelCls}><FontAwesomeIcon icon={faUser} className="mr-1" /> Nome</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="SEU NOME..." className={inputCls} />
          </div>

          {/* Posição */}
          <div>
            <label className={labelCls}><FontAwesomeIcon icon={faShieldHalved} className="mr-1" /> Posição Principal</label>
            <select value={pos} onChange={e => setPos(e.target.value)}
              className={`${inputCls} appearance-none cursor-pointer`}>
              {POSITIONS.map(p => (
                <option key={p} value={p} className="bg-slate-900">{p}</option>
              ))}
            </select>
          </div>

          {/* Nível de habilidade */}
          <div>
            <label className={labelCls}>
              <FontAwesomeIcon icon={faChartSimple} className="mr-1" />
              Nível de Habilidade — <span style={{ color: gold }}>{skill}/10</span>
            </label>
            <input type="range" min={1} max={10} value={skill} onChange={e => setSkill(+e.target.value)}
              style={{ width: '100%', accentColor: gold }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              <span>Iniciante</span><span>Intermediário</span><span>Expert</span>
            </div>
          </div>

          {errorMsg && (
            <p style={{ color: '#ef4444', fontSize: 11, textAlign: 'center' }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !name}
            style={{
              padding: '16px 0', fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '0.3em', border: 'none', cursor: submitting ? 'wait' : 'pointer',
              background: !name || submitting ? 'rgba(0,180,255,0.2)' : `linear-gradient(135deg,${blue},#0066cc)`,
              color: '#fff', transition: 'all .2s', opacity: !name ? 0.5 : 1,
            }}
          >
            {submitting
              ? <FontAwesomeIcon icon={faSpinner} spin />
              : <><FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />CONFIRMAR PRESENÇA</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
