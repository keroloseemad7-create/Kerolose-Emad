import React from 'react';
import {random} from 'remotion';

export type Burst = {
  frame: number;
  x: number;
  y: number;
  count?: number;
  power?: number;
  /** Center direction in radians (0 = right). Omit for 360° spray. */
  angle?: number;
  spread?: number;
  gravity?: number;
  life?: number;
  seed?: string;
};

const sparkColor = (t: number) => {
  // hot white -> yellow -> orange -> deep red
  if (t < 0.15) return '#fff6de';
  if (t < 0.4) return '#ffd27a';
  if (t < 0.7) return '#ff8a1f';
  return '#ff4b12';
};

/** Physically-ish simulated spark streaks, fully deterministic per frame. */
export const Sparks: React.FC<{bursts: Burst[]; frame: number; width?: number; height?: number; glow?: boolean}> = ({
  bursts,
  frame,
  width = 1920,
  height = 1080,
  glow = true,
}) => {
  const lines: React.ReactNode[] = [];
  bursts.forEach((b, bi) => {
    const age = frame - b.frame;
    const maxLife = b.life ?? 26;
    if (age < 0 || age > maxLife * 1.6) return;
    const count = b.count ?? 24;
    const seed = b.seed ?? `${bi}-${b.frame}-${b.x}`;
    for (let i = 0; i < count; i++) {
      const r1 = random(`${seed}-a-${i}`);
      const r2 = random(`${seed}-s-${i}`);
      const r3 = random(`${seed}-l-${i}`);
      const life = maxLife * (0.45 + r3 * 0.9);
      if (age > life) continue;
      const ang = b.angle === undefined ? r1 * Math.PI * 2 : b.angle + (r1 - 0.5) * (b.spread ?? 1.2);
      const speed = (b.power ?? 22) * (0.35 + r2 * 0.9);
      const g = b.gravity ?? 0.9;
      const drag = 0.94;
      // integrate with drag analytically: distance = v*(1-drag^t)/(1-drag)
      const dist = (n: number) => (speed * (1 - Math.pow(drag, n))) / (1 - drag);
      const px = (n: number) => b.x + Math.cos(ang) * dist(n);
      const py = (n: number) => b.y + Math.sin(ang) * dist(n) + 0.5 * g * n * n * 0.35;
      const t = age / life;
      const x2 = px(age);
      const y2 = py(age);
      const x1 = px(Math.max(0, age - 2.2));
      const y1 = py(Math.max(0, age - 2.2));
      lines.push(
        <line
          key={`${bi}-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={sparkColor(t)}
          strokeWidth={Math.max(0.8, 4.2 * (1 - t))}
          strokeLinecap="round"
          opacity={1 - t * t}
        />,
      );
    }
  });
  return (
    <svg
      width={width}
      height={height}
      style={{position: 'absolute', inset: 0, overflow: 'visible', filter: glow ? 'drop-shadow(0 0 6px #ff8a1f) drop-shadow(0 0 14px rgba(255,90,20,0.7))' : undefined}}
    >
      {lines}
    </svg>
  );
};
