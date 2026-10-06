import React from 'react';
import {COLORS} from '../theme';

const MetalDefs: React.FC<{id: string; tint?: string}> = ({id, tint}) => (
  <defs>
    <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={COLORS.steelLight} />
      <stop offset="0.28" stopColor={tint ?? COLORS.steel} />
      <stop offset="0.5" stopColor={COLORS.steelDark} />
      <stop offset="0.72" stopColor={COLORS.steel} />
      <stop offset="1" stopColor="#3a3f47" />
    </linearGradient>
    <radialGradient id={`${id}-ball`} cx="0.35" cy="0.3" r="0.75">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.35" stopColor={COLORS.steel} />
      <stop offset="1" stopColor="#2a2d33" />
    </radialGradient>
  </defs>
);

const gearPath = (teeth: number, r: number, depth: number) => {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const seq: [number, number][] = [
      [a - step * 0.25, r - depth],
      [a - step * 0.15, r],
      [a + step * 0.15, r],
      [a + step * 0.25, r - depth],
    ];
    for (const [ang, rad] of seq) {
      pts.push(`${(Math.cos(ang) * rad).toFixed(2)},${(Math.sin(ang) * rad).toFixed(2)}`);
    }
  }
  return `M${pts.join('L')}Z`;
};

type PartProps = {id: string; size: number; rotation?: number; style?: React.CSSProperties};

export const Gear: React.FC<PartProps & {teeth?: number; spokes?: number}> = ({
  id,
  size,
  rotation = 0,
  teeth = 16,
  spokes = 5,
  style,
}) => {
  const r = 100;
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{overflow: 'visible', ...style}}>
      <MetalDefs id={id} />
      <g transform={`rotate(${rotation})`}>
        <path d={gearPath(teeth, r, 16)} fill={`url(#${id}-metal)`} stroke="#1b1d21" strokeWidth={2} />
        <circle r={r - 30} fill="#1a1c20" />
        {Array.from({length: spokes}).map((_, i) => (
          <rect
            key={i}
            x={-9}
            y={-(r - 26)}
            width={18}
            height={r - 26}
            rx={4}
            fill={`url(#${id}-metal)`}
            transform={`rotate(${(360 / spokes) * i})`}
          />
        ))}
        <circle r={30} fill={`url(#${id}-metal)`} stroke="#1b1d21" strokeWidth={2} />
        <circle r={13} fill="#0b0c0e" />
        <circle r={r - 30} fill="none" stroke={COLORS.steelLight} strokeOpacity={0.35} strokeWidth={3} />
      </g>
    </svg>
  );
};

export const Bearing: React.FC<PartProps & {balls?: number; ballRotation?: number}> = ({
  id,
  size,
  rotation = 0,
  balls = 9,
  ballRotation,
  style,
}) => {
  const br = ballRotation ?? rotation * 0.4;
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{overflow: 'visible', ...style}}>
      <MetalDefs id={id} />
      <circle r={102} fill={`url(#${id}-metal)`} stroke="#15171a" strokeWidth={3} />
      <circle r={84} fill="#121317" />
      <g transform={`rotate(${br})`}>
        {Array.from({length: balls}).map((_, i) => {
          const a = (i / balls) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 66} cy={Math.sin(a) * 66} r={15} fill={`url(#${id}-ball)`} />;
        })}
      </g>
      <g transform={`rotate(${rotation})`}>
        <circle r={48} fill={`url(#${id}-metal)`} stroke="#15171a" strokeWidth={3} />
        <circle r={26} fill="#08090a" />
        {[0, 120, 240].map((a) => (
          <circle key={a} cx={0} cy={-37} r={4} fill="#0b0c0e" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={96} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} strokeDasharray="60 240" transform={`rotate(-40)`} />
    </svg>
  );
};

export const Spring: React.FC<{id: string; width: number; coils?: number; stretch?: number; style?: React.CSSProperties}> = ({
  id,
  width,
  coils = 12,
  stretch = 1,
  style,
}) => {
  const len = 300 * stretch;
  const h = 46;
  const seg = len / coils;
  let back = '';
  let front = '';
  for (let i = 0; i < coils; i++) {
    const x0 = -len / 2 + i * seg;
    back += `M${x0},${h / 2} L${x0 + seg / 2},${-h / 2} `;
    front += `M${x0 + seg / 2},${-h / 2} L${x0 + seg},${h / 2} `;
  }
  return (
    <svg width={width} height={width * 0.3} viewBox={`${-len / 2 - 20} -50 ${len + 40} 100`} style={{overflow: 'visible', ...style}}>
      <MetalDefs id={id} />
      <path d={back} stroke="#3c4048" strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d={front} stroke={`url(#${id}-metal)`} strokeWidth={10} strokeLinecap="round" fill="none" />
      <path d={front} stroke="#fff" strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" fill="none" transform="translate(-1.5,-2)" />
    </svg>
  );
};

export const Screw: React.FC<{id: string; length: number; style?: React.CSSProperties}> = ({id, length, style}) => {
  const L = 300;
  const threads = 22;
  return (
    <svg width={length} height={length * 0.2} viewBox="-20 -30 340 60" style={{overflow: 'visible', ...style}}>
      <MetalDefs id={id} />
      <polygon points={`40,-11 ${L - 20},-11 ${L},0 ${L - 20},11 40,11`} fill={`url(#${id}-metal)`} />
      {Array.from({length: threads}).map((_, i) => {
        const x = 50 + i * ((L - 80) / threads);
        return <line key={i} x1={x} y1={-13} x2={x + 7} y2={13} stroke="#2a2d33" strokeWidth={3} />;
      })}
      <rect x={-14} y={-26} width={56} height={52} rx={6} fill={`url(#${id}-metal)`} stroke="#15171a" strokeWidth={2} />
      <rect x={-4} y={-26} width={8} height={52} fill="#15171a" opacity={0.6} />
    </svg>
  );
};

export const Nut: React.FC<PartProps> = ({id, size, rotation = 0, style}) => {
  const pts = Array.from({length: 6})
    .map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return `${Math.cos(a) * 100},${Math.sin(a) * 100}`;
    })
    .join(' ');
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{overflow: 'visible', ...style}}>
      <MetalDefs id={id} />
      <g transform={`rotate(${rotation})`}>
        <polygon points={pts} fill={`url(#${id}-metal)`} stroke="#15171a" strokeWidth={4} />
        <circle r={52} fill="#0d0e10" stroke={COLORS.steelDark} strokeWidth={8} strokeDasharray="10 8" />
      </g>
    </svg>
  );
};
