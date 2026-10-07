import React from 'react';
import {COLORS} from '../../theme';

/** Glowing display turntable seen at a low angle. `angle` = platter rotation in degrees. */
export const Turntable: React.FC<{cx: number; cy: number; r: number; angle: number; glow?: number}> = ({cx, cy, r, angle, glow = 1}) => {
  const ry = r * 0.22;
  const ticks = 48;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id="tt-top" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#3a3f48" />
          <stop offset="0.7" stopColor="#1b1d22" />
          <stop offset="1" stopColor="#0c0d10" />
        </radialGradient>
        <linearGradient id="tt-side" x1="0" x2="1">
          <stop offset="0" stopColor="#2a2d33" />
          <stop offset="0.5" stopColor={COLORS.steel} />
          <stop offset="1" stopColor="#2a2d33" />
        </linearGradient>
        <radialGradient id="tt-glow">
          <stop offset="0" stopColor={COLORS.spark} stopOpacity={0.55} />
          <stop offset="1" stopColor={COLORS.spark} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* floor glow */}
      <ellipse cx={cx} cy={cy + 40} rx={r * 1.9} ry={ry * 2.6} fill="url(#tt-glow)" opacity={glow} />
      {/* side band */}
      <path d={`M${cx - r},${cy} A${r},${ry} 0 0 0 ${cx + r},${cy} L${cx + r},${cy + 46} A${r},${ry} 0 0 1 ${cx - r},${cy + 46} Z`} fill="url(#tt-side)" />
      <ellipse cx={cx} cy={cy + 46} rx={r} ry={ry} fill="none" stroke={COLORS.spark} strokeWidth={4} opacity={0.8 * glow} style={{filter: `drop-shadow(0 0 12px ${COLORS.spark})`}} />
      {/* platter */}
      <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill="url(#tt-top)" stroke={COLORS.steelLight} strokeOpacity={0.5} strokeWidth={2} />
      {Array.from({length: ticks}).map((_, i) => {
        const a = ((i / ticks) * 360 + angle) * (Math.PI / 180);
        const front = Math.sin(a) > 0;
        const x1 = cx + Math.cos(a) * r * 0.86;
        const y1 = cy + Math.sin(a) * ry * 0.86;
        const x2 = cx + Math.cos(a) * r * (i % 4 === 0 ? 0.72 : 0.8);
        const y2 = cy + Math.sin(a) * ry * (i % 4 === 0 ? 0.72 : 0.8);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 12 === 0 ? COLORS.spark : COLORS.steel} strokeWidth={i % 4 === 0 ? 3 : 1.5} opacity={front ? 0.9 : 0.35} />;
      })}
      <ellipse cx={cx} cy={cy} rx={r * 0.55} ry={ry * 0.55} fill="none" stroke={COLORS.navyBright} strokeWidth={2} opacity={0.7} />
    </svg>
  );
};
