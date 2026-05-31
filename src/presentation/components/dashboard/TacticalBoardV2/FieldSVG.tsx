import React from 'react';
import { FieldCfg, SportKey } from './fieldConfig';

const BLUE       = 'rgba(0,180,255,0.65)';
const BLUE_FAINT = 'rgba(0,180,255,0.32)';

interface FieldSVGProps {
  cfg: FieldCfg;
  sport: SportKey;
}

export const FieldSVG: React.FC<FieldSVGProps> = ({ cfg, sport }) => {
  const { fieldW: W, fieldH: H, bigBoxW, bigBoxH, smallBoxW, smallBoxH,
          goalW, circleR, penaltyY } = cfg;
  const cx = W / 2;
  const cy = H / 2;
  const sw = W * 0.012;
  const futsalArcR = bigBoxH;

  const GoalArea = ({ top }: { top: boolean }) => {
    const yRef = top ? H * 0.015 : H * 0.985;
    const arcDir = top ? 1 : 0;

    if (sport === 'Futsal') return (
      <>
        <path
          d={`M ${cx - futsalArcR} ${yRef} A ${futsalArcR} ${futsalArcR} 0 0 ${arcDir} ${cx + futsalArcR} ${yRef}`}
          fill="none" stroke={BLUE_FAINT} strokeWidth={sw * 0.9}
        />
        <rect x={cx - smallBoxW / 2} y={top ? yRef : yRef - smallBoxH}
          width={smallBoxW} height={smallBoxH}
          fill="none" stroke={BLUE_FAINT} strokeWidth={sw * 0.7}
        />
        <circle cx={cx} cy={top ? yRef + penaltyY : yRef - penaltyY} r={sw * 0.7} fill={BLUE_FAINT} />
        <circle cx={cx} cy={top ? yRef + penaltyY * 1.65 : yRef - penaltyY * 1.65} r={sw * 0.5}
          fill="rgba(0,180,255,0.18)" />
      </>
    );

    if (sport === 'Society') return (
      <>
        <rect x={cx - bigBoxW / 2} y={top ? yRef : yRef - bigBoxH}
          width={bigBoxW} height={bigBoxH}
          fill="none" stroke={BLUE_FAINT} strokeWidth={sw}
        />
        {/* Marca Shoot-out (opcional mas legal) */}
        <line x1={cx - 1} y1={top ? yRef + penaltyY * 1.5 : yRef - penaltyY * 1.5} 
              x2={cx + 1} y2={top ? yRef + penaltyY * 1.5 : yRef - penaltyY * 1.5} 
              stroke={BLUE_FAINT} strokeWidth={sw} />
        {/* Ponto de Penalty */}
        <circle cx={cx} cy={top ? yRef + penaltyY : yRef - penaltyY} r={sw * 0.7} fill={BLUE_FAINT} />
      </>
    );

    // Default Campo
    return (
      <>
        <rect x={cx - bigBoxW / 2} y={top ? yRef : yRef - bigBoxH}
          width={bigBoxW} height={bigBoxH}
          fill="none" stroke={BLUE_FAINT} strokeWidth={sw}
        />
        <rect x={cx - smallBoxW / 2} y={top ? yRef : yRef - smallBoxH}
          width={smallBoxW} height={smallBoxH}
          fill="none" stroke={BLUE_FAINT} strokeWidth={sw * 0.8}
        />
        <circle cx={cx} cy={top ? yRef + penaltyY : yRef - penaltyY} r={sw * 0.7} fill={BLUE_FAINT} />
        <path
          d={top
            ? `M ${cx - circleR * 0.92} ${yRef + bigBoxH} A ${circleR} ${circleR} 0 0 1 ${cx + circleR * 0.92} ${yRef + bigBoxH}`
            : `M ${cx - circleR * 0.92} ${yRef - bigBoxH} A ${circleR} ${circleR} 0 0 0 ${cx + circleR * 0.92} ${yRef - bigBoxH}`
          }
          fill="none" stroke={BLUE_FAINT} strokeWidth={sw * 0.7}
        />
      </>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
      <defs>
        <filter id="fglow2">
          <feGaussianBlur stdDeviation={W * 0.014} result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>

      {/* Borda */}
      <rect x={W*0.03} y={H*0.015} width={W*0.94} height={H*0.97}
        fill="none" stroke={BLUE} strokeWidth={sw*1.5} filter="url(#fglow2)" />

      {/* Linha de meio */}
      <line x1={W*0.03} y1={cy} x2={W*0.97} y2={cy} stroke={BLUE_FAINT} strokeWidth={sw} />

      {/* Círculo central */}
      <circle cx={cx} cy={cy} r={circleR} fill="none" stroke={BLUE_FAINT} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={sw * 0.9} fill="rgba(0,180,255,0.75)" />

      {/* Áreas */}
      <GoalArea top />
      <GoalArea top={false} />

      {/* Traves */}
      <line x1={cx - goalW/2} y1={H*0.015} x2={cx + goalW/2} y2={H*0.015}
        stroke={BLUE} strokeWidth={sw * 2.2} />
      <line x1={cx - goalW/2} y1={H*0.985} x2={cx + goalW/2} y2={H*0.985}
        stroke={BLUE} strokeWidth={sw * 2.2} />

      {/* Arcos de canto — só no Campo */}
      {sport === 'Campo' && (
        <>
          <path d={`M ${W*0.03+2} ${H*0.015+2} A 2 2 0 0 1 ${W*0.03+4} ${H*0.015}`} fill="none" stroke={BLUE_FAINT} strokeWidth={sw} />
          <path d={`M ${W*0.97-2} ${H*0.015+2} A 2 2 0 0 0 ${W*0.97-4} ${H*0.015}`} fill="none" stroke={BLUE_FAINT} strokeWidth={sw} />
          <path d={`M ${W*0.03+2} ${H*0.985-2} A 2 2 0 0 0 ${W*0.03+4} ${H*0.985}`} fill="none" stroke={BLUE_FAINT} strokeWidth={sw} />
          <path d={`M ${W*0.97-2} ${H*0.985-2} A 2 2 0 0 1 ${W*0.97-4} ${H*0.985}`} fill="none" stroke={BLUE_FAINT} strokeWidth={sw} />
        </>
      )}
    </svg>
  );
};
