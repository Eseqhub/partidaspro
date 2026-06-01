import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faFutbol } from '@fortawesome/free-solid-svg-icons';
import { MatchDraft, green } from './types';

interface Props {
  draft: MatchDraft;
  matchId: string;
  modColor: string;
  onGo: (matchId: string) => void;
  onClose: () => void;
}

export function StepSuccess({ draft, matchId, modColor, onGo, onClose }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: `${green}12`,
        border: `2px solid ${green}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: 32,
      }}>
        <FontAwesomeIcon icon={faCheckCircle} style={{ color: green }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>Partida Criada!</h3>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, lineHeight: 1.6 }}>
        {draft.tipo_campo} · <span style={{ color: modColor, fontWeight: 900 }}>{draft.modalidade}</span>
      </p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 24, lineHeight: 1.6 }}>
        {draft.data ? new Date(draft.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}
        {draft.local ? ` · ${draft.local}` : ''}
      </p>
      <p style={{ fontSize: 10, color: modColor, marginBottom: 24, fontWeight: 700 }}>
        {draft.modalidade === 'Rachão' && '→ Selecione os jogadores e realize o sorteio'}
        {draft.modalidade === 'Bolão'  && '→ Selecione os jogadores e o algoritmo montará os times e o torneio'}
        {draft.modalidade === 'Manual' && '→ Escale os titulares e reservas de cada time'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => onGo(matchId)} style={{
          padding: '12px 24px', background: `linear-gradient(135deg,${modColor},${modColor}99)`,
          color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase',
          letterSpacing: '0.2em', border: 'none', cursor: 'pointer',
        }}>
          <FontAwesomeIcon icon={faFutbol} style={{ marginRight: 8 }} />IR PARA A PARTIDA
        </button>
        <button onClick={onClose} style={{
          padding: '12px 24px', background: 'transparent', color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: 11,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>
          FECHAR
        </button>
      </div>
    </div>
  );
}
