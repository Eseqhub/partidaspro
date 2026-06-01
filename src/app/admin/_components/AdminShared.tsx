import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

export const STATUS_COLOR: Record<string, string> = {
  'Em curso': '#ccff00', 'Agendada': '#00b4ff', 'Pausada': '#F97316', 'Finalizada': '#6B7280',
};

export const POS_CLR: Record<string, string> = {
  G: '#EAB308', ZAG: '#16A34A', ZGD: '#16A34A', ZGE: '#16A34A', LD: '#22C55E', LE: '#22C55E',
  VOL: '#2563EB', MC: '#3B82F6', MD: '#3B82F6', ME: '#3B82F6', MO: '#8B5CF6',
  PD: '#F97316', PE: '#F97316', SA: '#ccff00', CA: '#EF4444',
};

export function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase',
      letterSpacing: '0.1em', background: `${color ?? '#fff'}15`, border: `1px solid ${color ?? '#fff'}30`,
      color: color ?? 'rgba(255,255,255,0.5)',
    }}>{label}</span>
  );
}

export function KpiCard({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}18`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
      <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{sub}</p>}
    </div>
  );
}

export function ExportBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e',
      borderRadius: 6, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
    }}>
      <FontAwesomeIcon icon={faDownload} /> {label}
    </button>
  );
}
