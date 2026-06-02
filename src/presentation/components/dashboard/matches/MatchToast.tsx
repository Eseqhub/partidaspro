'use client';

import React from 'react';

interface Props {
  notification: {
    id: string;
    kind: 'event' | 'comment';
    title: string;
    subtitle: string;
    color: string;
  } | null;
  onDismiss: () => void;
}

export const MatchToast: React.FC<Props> = ({ notification, onDismiss }) => {
  if (!notification) return null;
  const { id, title, subtitle, color } = notification;

  return (
    <div
      key={id}
      onClick={onDismiss}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        width: 'min(92vw, 380px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 14,
        background: 'rgba(10,14,20,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${color}55`,
        borderLeft: `4px solid ${color}`,
        boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 24px ${color}22`,
        animation: 'matchToastIn .35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 900, color, lineHeight: 1.2,
          textTransform: 'uppercase', letterSpacing: '0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {subtitle}
        </p>
      </div>
      <style>{`
        @keyframes matchToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};
