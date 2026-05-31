import React from 'react';

const LIME = '#ccff00';

/**
 * Marca do Partidas Pro: campo minimalista com um time posicionado
 * (formação) — comunica "gestão / escalação de times".
 */
export function LogoMark({ size = 32, color = LIME }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      {/* Campo */}
      <rect x="15" y="6" width="70" height="88" rx="14" stroke={color} strokeWidth="4.5" opacity="0.9" />
      {/* Linha de meio */}
      <line x1="15" y1="50" x2="85" y2="50" stroke={color} strokeWidth="3" opacity="0.5" />
      {/* Círculo central */}
      <circle cx="50" cy="50" r="12" stroke={color} strokeWidth="3" opacity="0.5" />
      {/* Time posicionado (formação) → gestão de times */}
      <circle cx="33" cy="70" r="5.5" fill={color} />
      <circle cx="67" cy="70" r="5.5" fill={color} />
      <circle cx="50" cy="82" r="5.5" fill={color} />
    </svg>
  );
}

interface LogoProps {
  size?: number;          // tamanho da marca
  showWord?: boolean;     // mostra "Partidas Pro"
  wordColor?: string;     // cor da palavra "Partidas"
  className?: string;
}

export function Logo({ size = 30, showWord = true, wordColor = '#fff', className }: LogoProps) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <LogoMark size={size} />
      {showWord && (
        <span style={{ fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1, fontSize: size * 0.58 }}>
          <span style={{ color: wordColor }}>Partidas</span>
          <span style={{ color: LIME }}> Pro</span>
        </span>
      )}
    </span>
  );
}
