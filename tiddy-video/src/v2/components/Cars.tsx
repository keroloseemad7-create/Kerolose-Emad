import React from 'react';
import {random} from 'remotion';

/** Tiny traffic on a road line: sells the monster's scale. */
export const Cars: React.FC<{frame: number; y: number; count?: number; scale?: number; seed?: string; panic?: number}> = ({frame, y, count = 7, scale = 1, seed = 'car', panic = 0}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {Array.from({length: count}).map((_, i) => {
      const s = `${seed}-${i}`;
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = (1.5 + random(`${s}v`) * 2) * (1 + panic * 2.5);
      const x = ((random(`${s}x`) * 1400 + dir * frame * speed) % 1400 + 1400) % 1400 - 160;
      const lane = dir > 0 ? 0 : 14 * scale;
      const w = 46 * scale;
      const h = 16 * scale;
      return (
        <g key={s} transform={`translate(${x}, ${y + lane}) scale(${dir}, 1)`}>
          <rect x={-w / 2} y={-h} width={w} height={h * 0.62} rx={3 * scale} fill="#0d0d10" />
          <path d={`M${-w * 0.28},${-h * 0.4} L${-w * 0.15},${-h * 1.05} L${w * 0.2},${-h * 1.05} L${w * 0.32},${-h * 0.4}Z`} fill="#0d0d10" />
          <circle cx={-w * 0.3} cy={-h * 0.36} r={h * 0.22} fill="#050506" />
          <circle cx={w * 0.3} cy={-h * 0.36} r={h * 0.22} fill="#050506" />
          <ellipse cx={w * 0.55} cy={-h * 0.7} rx={w * 0.5} ry={h * 0.18} fill="#ffe2a8" opacity={0.25} />
          <circle cx={w * 0.49} cy={-h * 0.7} r={h * 0.12} fill="#fff3c4" />
          <circle cx={-w * 0.49} cy={-h * 0.7} r={h * 0.1} fill="#ff2a2a" />
        </g>
      );
    })}
  </svg>
);
