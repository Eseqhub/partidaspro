import React, { useState } from 'react';
import { Group } from '@/core/entities/group';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faCopy, faCheckCircle,
  faUsers, faWallet, faGear, faScroll, faChevronDown, faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  group: Group;
  players: Player[];
  summary: { balance: number; income: number; expense: number; received: number; pending: number };
  isOwner: boolean;
  canManage?: boolean;
  currentUserName?: string;
  onOpenSettings?: () => void;
  copied: boolean;
  linkLoading: boolean;
  onCopyLink: () => void;
  onNavigate: (path: string) => void;
}

const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';
const neon  = '#ccff00';

export const ClubHeader: React.FC<Props> = ({
  group, players, summary, isOwner, canManage, currentUserName,
  onOpenSettings, copied, linkLoading, onCopyLink, onNavigate,
}) => {
  const activeCount  = players.filter(p => p.status === 'Ativo').length;
  const balanceColor = summary.balance >= 0 ? green : red;
  const [rulesOpen,    setRulesOpen]    = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const hasRules     = !!(group.estatuto_regras || group.rules_text);
  const hasEstatuto  = !!group.estatuto_regras;
  // Botão chama "Estatuto" se tiver estatuto_regras, senão "Regras"
  const rulesBtnLabel = hasEstatuto ? 'Estatuto' : 'Regras';
  // Texto inline — prefere rules_text (mais curto/legível)
  const inlineText = group.rules_text || group.estatuto_regras || '';

  // Badge de papel — só mostra para quem gerencia
  const roleBadge = isOwner ? 'Owner' : canManage ? 'Editor' : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(0,0,0,0.97) 0%,rgba(0,12,30,0.97) 100%)',
      borderBottom: `1px solid ${blue}18`,
      padding: '24px 0 20px',
    }}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5">

        {/* ── Escudo ─────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 76, height: 76, overflow: 'hidden',
            border: `2px solid ${blue}33`,
            boxShadow: `0 0 24px ${blue}18`,
            background: 'rgba(0,20,50,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {group.logo_url
              ? <img src={group.logo_url} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FontAwesomeIcon icon={faShieldHalved} style={{ color: blue, fontSize: 30 }} />
            }
          </div>
        </div>

        {/* ── Info principal ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Usuário logado + badge */}
          {currentUserName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
                {currentUserName}
              </span>
              {roleBadge && (
                <span style={{
                  fontSize: 7, fontWeight: 900, padding: '2px 7px',
                  background: isOwner ? `${gold}18` : `${blue}15`,
                  border: `1px solid ${isOwner ? gold : blue}33`,
                  color: isOwner ? gold : blue,
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                }}>
                  {roleBadge}
                </span>
              )}
            </div>
          )}

          {/* Nome do grupo */}
          <h1 style={{ fontSize: 'clamp(20px,5vw,32px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1, marginBottom: 3 }}>
            {group.name}
          </h1>

          {group.description && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{group.description}</p>
          )}

          {group.founded_year && (
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>
              Fundado em {group.founded_year}
            </p>
          )}

          {/* ── Box de regras inline ─────────────────────────────────── */}
          {hasRules ? (
            <div style={{
              marginTop: 6, background: `${gold}06`,
              border: `1px solid ${gold}20`, borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Header clicável */}
              <button
                onClick={() => setRulesExpanded(e => !e)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FontAwesomeIcon icon={faScroll} style={{ fontSize: 9, color: gold }} />
                  <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: gold }}>
                    {rulesBtnLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setRulesOpen(true); }}
                    style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: gold, background: `${gold}18`, border: `1px solid ${gold}30`,
                      padding: '2px 7px', cursor: 'pointer', borderRadius: 4 }}>
                    Ver tudo
                  </button>
                  <FontAwesomeIcon icon={rulesExpanded ? faChevronUp : faChevronDown}
                    style={{ fontSize: 8, color: `${gold}66` }} />
                </div>
              </button>

              {/* Texto inline (colapsável) */}
              {rulesExpanded && (
                <div style={{ padding: '0 10px 10px' }}>
                  <div style={{
                    whiteSpace: 'pre-wrap', fontSize: 10, lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '8px 10px',
                    maxHeight: 160, overflowY: 'auto',
                  }}>
                    {inlineText}
                  </div>
                </div>
              )}
            </div>
          ) : canManage && onOpenSettings ? (
            <button onClick={onOpenSettings}
              style={{ marginTop: 6, padding: '5px 10px', background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)',
                fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 6 }}>
              <FontAwesomeIcon icon={faScroll} style={{ fontSize: 7 }} />
              + Adicionar Regras
            </button>
          ) : null}
        </div>

        {/* ── Modal Regras/Estatuto ───────────────────────────────────── */}
        {rulesOpen && (
          <div onClick={() => setRulesOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 560, maxHeight: '85dvh', overflowY: 'auto',
                background: 'linear-gradient(160deg,#060f20,#020810)', border: `1px solid ${gold}30`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff' }}>
                  📜 {hasEstatuto ? 'Estatuto & Regras' : 'Regras da Pelada'}
                </h2>
                <button onClick={() => setRulesOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              {group.rules_text && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: gold, marginBottom: 6 }}>Regras da Pelada</p>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)',
                    background: `${neon}06`, border: `1px solid ${neon}15`, borderRadius: 8, padding: 14 }}>{group.rules_text}</div>
                </div>
              )}
              {group.estatuto_regras && (
                <div>
                  <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Estatuto do Clube</p>
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 14 }}>{group.estatuto_regras}</div>
                </div>
              )}
              {canManage && (
                <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 16, textAlign: 'center' }}>
                  Edição em Configurações
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Mini-stats ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
          {[
            { icon: faUsers,  val: String(activeCount),                         label: 'Atletas', color: blue         },
            { icon: faWallet, val: `R$${Math.abs(summary.balance).toFixed(0)}`, label: summary.balance >= 0 ? 'Caixa' : 'Déficit', color: balanceColor },
          ].map(({ icon, val, label, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <FontAwesomeIcon icon={icon} style={{ color, fontSize: 14, marginBottom: 4, display: 'block' }} />
              <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Ações ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCopyLink} disabled={linkLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', flex: 1,
                background: 'transparent', color: copied ? green : blue,
                border: `1px solid ${copied ? green : blue}33`, fontWeight: 900, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} />
              {copied ? 'COPIADO!' : linkLoading ? 'GERANDO...' : 'LINK RECRUTAMENTO'}
            </button>
            {canManage && onOpenSettings && (
              <button onClick={onOpenSettings} title="Configurações do time"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, flexShrink: 0,
                  background: 'transparent', color: gold, border: `1px solid ${gold}33`, cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faGear} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
