import React from 'react';
import { FieldCfg, SportKey } from './fieldConfig';

const LINE  = 'rgba(0,180,255,0.70)';
const FAINT = 'rgba(0,180,255,0.32)';
const VFAINT = 'rgba(0,180,255,0.18)';

interface Props { cfg: FieldCfg; sport: SportKey }

export const FieldSVG: React.FC<Props> = ({ cfg, sport }) => {
  const {
    fieldW: W, fieldH: H,
    bigBoxW, bigBoxH, smallBoxW, smallBoxH,
    goalW, circleR, penaltyY, arcR,
    hasCorners,
  } = cfg;

  const cx = W / 2;
  const cy = H / 2;
  const sw = W * 0.013; // strokeWidth base

  // Bordas internas do campo (inset)
  const bx0 = W * 0.03, by0 = H * 0.015;
  const bx1 = W * 0.97, by1 = H * 0.985;

  // ── Área + gol (reutilizável) ──────────────────────────────────────────
  const GoalArea = ({ top }: { top: boolean }) => {
    const yLine = top ? by0 : by1;
    const sign  = top ? 1 : -1;

    // Traves
    const goalEl = (
      <line
        x1={cx - goalW / 2} y1={yLine}
        x2={cx + goalW / 2} y2={yLine}
        stroke={LINE} strokeWidth={sw * 2.2}
      />
    );

    // ── FUTSAL: semicírculo de penalidade ────────────────────────────────
    if (sport === 'Futsal') {
      const arcCy = top ? by0 : by1;
      const sweep = top ? '0 1' : '0 0';
      return (
        <>
          {goalEl}
          {/* Pequena área retangular do goleiro */}
          <rect
            x={cx - smallBoxW / 2}
            y={top ? yLine : yLine - smallBoxH}
            width={smallBoxW} height={smallBoxH}
            fill="none" stroke={FAINT} strokeWidth={sw * 0.8}
          />
          {/* Semicírculo de penalidade */}
          <path
            d={`M ${cx - arcR} ${arcCy} A ${arcR} ${arcR} 0 ${sweep} ${cx + arcR} ${arcCy}`}
            fill={VFAINT} stroke={FAINT} strokeWidth={sw * 0.9}
          />
          {/* Ponto de penalidade */}
          <circle cx={cx} cy={top ? yLine + penaltyY : yLine - penaltyY} r={sw * 0.7} fill={FAINT} />
        </>
      );
    }

    // ── SOCIETY: apenas grande área ──────────────────────────────────────
    if (sport === 'Society') {
      return (
        <>
          {goalEl}
          <rect
            x={cx - bigBoxW / 2}
            y={top ? yLine : yLine - bigBoxH}
            width={bigBoxW} height={bigBoxH}
            fill={VFAINT} stroke={FAINT} strokeWidth={sw}
          />
          {/* Ponto de pênalti */}
          <circle cx={cx} cy={top ? yLine + penaltyY : yLine - penaltyY} r={sw * 0.7} fill={FAINT} />
          {/* Marca de shoot-out */}
          <line
            x1={cx - sw} y1={top ? yLine + penaltyY * 1.6 : yLine - penaltyY * 1.6}
            x2={cx + sw} y2={top ? yLine + penaltyY * 1.6 : yLine - penaltyY * 1.6}
            stroke={FAINT} strokeWidth={sw * 0.6}
          />
        </>
      );
    }

    // ── CAMPO: grande área + pequena área + arco de pênalti ─────────────
    const bigBoxTop    = top ? yLine                 : yLine - bigBoxH;
    const smallBoxTop  = top ? yLine                 : yLine - smallBoxH;
    const penDot       = top ? yLine + penaltyY      : yLine - penaltyY;
    const arcBaseY     = top ? yLine + bigBoxH       : yLine - bigBoxH;
    const arcSweep     = top ? '0 1' : '0 0';
    const arcXOff      = Math.sqrt(Math.max(0, arcR * arcR - (bigBoxH - penaltyY) * (bigBoxH - penaltyY)));

    return (
      <>
        {goalEl}
        {/* Grande área */}
        <rect
          x={cx - bigBoxW / 2} y={bigBoxTop}
          width={bigBoxW} height={bigBoxH}
          fill={VFAINT} stroke={FAINT} strokeWidth={sw}
        />
        {/* Pequena área */}
        <rect
          x={cx - smallBoxW / 2} y={smallBoxTop}
          width={smallBoxW} height={smallBoxH}
          fill="rgba(0,180,255,0.10)" stroke={FAINT} strokeWidth={sw * 0.8}
        />
        {/* Ponto de pênalti */}
        <circle cx={cx} cy={penDot} r={sw * 0.7} fill={FAINT} />
        {/* Arco de pênalti */}
        <path
          d={`M ${cx - arcXOff} ${arcBaseY} A ${arcR} ${arcR} 0 ${arcSweep} ${cx + arcXOff} ${arcBaseY}`}
          fill="none" stroke={FAINT} strokeWidth={sw * 0.7}
        />
      </>
    );
  };

  // ── Arcos de canto (só campo) ──────────────────────────────────────────
  const cr = W * 0.04;
  const Corners = () => !hasCorners ? null : (
    <>
      <path d={`M ${bx0+cr} ${by0} A ${cr} ${cr} 0 0 1 ${bx0} ${by0+cr}`} fill="none" stroke={FAINT} strokeWidth={sw*0.7}/>
      <path d={`M ${bx1-cr} ${by0} A ${cr} ${cr} 0 0 0 ${bx1} ${by0+cr}`} fill="none" stroke={FAINT} strokeWidth={sw*0.7}/>
      <path d={`M ${bx0+cr} ${by1} A ${cr} ${cr} 0 0 0 ${bx0} ${by1-cr}`} fill="none" stroke={FAINT} strokeWidth={sw*0.7}/>
      <path d={`M ${bx1-cr} ${by1} A ${cr} ${cr} 0 0 1 ${bx1} ${by1-cr}`} fill="none" stroke={FAINT} strokeWidth={sw*0.7}/>
    </>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <filter id="fglow2">
          <feGaussianBlur stdDeviation={W * 0.014} result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      {/* Borda do campo */}
      <rect x={bx0} y={by0} width={bx1-bx0} height={by1-by0}
        fill="none" stroke={LINE} strokeWidth={sw * 1.5} filter="url(#fglow2)" />

      {/* Linha de meio campo */}
      <line x1={bx0} y1={cy} x2={bx1} y2={cy} stroke={FAINT} strokeWidth={sw} />

      {/* Círculo central */}
      <circle cx={cx} cy={cy} r={circleR} fill="none" stroke={FAINT} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={sw * 0.9} fill="rgba(0,180,255,0.75)" />

      {/* Ponto central */}
      {sport !== 'Futsal' && (
        <circle cx={cx} cy={cy} r={sw * 0.4} fill={LINE} />
      )}

      {/* Áreas e traves */}
      <GoalArea top />
      <GoalArea top={false} />

      {/* Arcos de canto */}
      <Corners />

      {/* Linhas de lateral extras (só Campo) */}
      {sport === 'Campo' && (
        <>
          {/* Pequenas marcas nas linhas laterais a cada 10m */}
          {[0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9].map(t => (
            <React.Fragment key={t}>
              <line x1={bx0 - sw*0.5} y1={by0 + (by1-by0)*t} x2={bx0 + sw*0.5} y2={by0 + (by1-by0)*t}
                stroke={FAINT} strokeWidth={sw*0.5}/>
              <line x1={bx1 - sw*0.5} y1={by0 + (by1-by0)*t} x2={bx1 + sw*0.5} y2={by0 + (by1-by0)*t}
                stroke={FAINT} strokeWidth={sw*0.5}/>
            </React.Fragment>
          ))}
        </>
      )}
    </svg>
  );
};
