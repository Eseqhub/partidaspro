import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCopy, faCheckCircle, faFutbol } from '@fortawesome/free-solid-svg-icons';
import { neon, gold, green } from './types';

interface Props {
  challengeLink: string;
  copied: boolean;
  matchId: string;
  onCopy: () => void;
  onGo: (matchId: string) => void;
}

export function StepChallenge({ challengeLink, copied, matchId, onCopy, onGo }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center', paddingBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: `${gold}12`,
          border: `2px solid ${gold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 26,
        }}>
          <FontAwesomeIcon icon={faTrophy} style={{ color: gold }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 6 }}>Link de Desafio Gerado!</h3>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Envie este link para o clube adversário aceitar.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${gold}33`, fontSize: 10, fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {challengeLink}
        </div>
        <button onClick={onCopy} style={{
          padding: '12px 18px', background: copied ? `${green}20` : `${gold}18`,
          border: `1px solid ${copied ? green : gold}44`, color: copied ? green : gold,
          fontWeight: 900, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer',
          flexShrink: 0, transition: 'all .2s',
        }}>
          <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} style={{ marginRight: 6 }} />
          {copied ? 'COPIADO!' : 'COPIAR'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => onGo(matchId)} style={{
          padding: '12px 24px', background: `linear-gradient(135deg,${neon},#aadd00)`,
          color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', border: 'none', cursor: 'pointer',
        }}>
          <FontAwesomeIcon icon={faFutbol} style={{ marginRight: 8 }} />IR PARA A PARTIDA
        </button>
      </div>
    </div>
  );
}
