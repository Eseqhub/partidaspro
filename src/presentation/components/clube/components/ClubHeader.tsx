import React from 'react';
import { Group } from '@/core/entities/group';
import { Player } from '@/core/entities/player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faCopy, faCheckCircle, faPlus,
  faUsers, faWallet, faGear,
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  group: Group;
  players: Player[];
  summary: { balance: number; income: number; expense: number; received: number; pending: number };
  isOwner: boolean;
  canManage?: boolean;
  onOpenSettings?: () => void;
  copied: boolean;
  linkLoading: boolean;
  onCopyLink: () => void;
  onNavigate: (path: string) => void;
}

const neon  = '#ccff00';
const blue  = '#00b4ff';
const gold  = '#d4a017';
const green = '#22c55e';
const red   = '#ef4444';

export const ClubHeader: React.FC<Props> = ({
  group, players, summary, isOwner, canManage, onOpenSettings, copied, linkLoading, onCopyLink, onNavigate,
}) => {
  const activeCount  = players.filter(p => p.status === 'Ativo').length;
  const balanceColor = summary.balance >= 0 ? green : red;

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(0,0,0,0.97) 0%,rgba(0,12,30,0.97) 100%)',
      borderBottom: `1px solid ${blue}18`,
      padding: '28px 0 24px',
    }}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

        {/* Logo */}
        <div style={{
          width: 80, height: 80, flexShrink: 0, overflow: 'hidden',
          border: `2px solid ${blue}33`,
          boxShadow: `0 0 24px ${blue}18`,
          background: 'rgba(0,20,50,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {group.logo_url
            ? <img src={group.logo_url} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <FontAwesomeIcon icon={faShieldHalved} style={{ color: blue, fontSize: 32 }} />
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: blue }}>CLUBE PRO</span>
            {isOwner && (
              <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px', background: `${gold}18`, border: `1px solid ${gold}33`, color: gold, textTransform: 'uppercase' }}>OWNER</span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(22px,5vw,36px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>
            {group.name}
          </h1>
          {group.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{group.description}</p>}
          {group.founded_year && (
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 4 }}>
              Fundado em {group.founded_year}
            </p>
          )}
        </div>

        {/* Mini-stats */}
        <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
          {[
            { icon: faUsers,  val: String(activeCount),                                  label: 'Atletas', color: blue         },
            { icon: faWallet, val: `R$${Math.abs(summary.balance).toFixed(0)}`,           label: summary.balance >= 0 ? 'Caixa' : 'Déficit', color: balanceColor },
          ].map(({ icon, val, label, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <FontAwesomeIcon icon={icon} style={{ color, fontSize: 14, marginBottom: 4, display: 'block' }} />
              <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Ações */}
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
            {/* Config do time — só dono/editores */}
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
