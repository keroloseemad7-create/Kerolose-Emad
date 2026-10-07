import React from 'react';
import {random} from 'remotion';
import {MONSTER, PASTEL} from '../config';

type Box = {x: number; y: number; w: number; h: number};

/** Billowing smoke. Emitter is evaluated at each particle's birth frame. */
export const Smoke: React.FC<{
  frame: number;
  emitter: (f: number) => Box;
  from: number;
  to: number;
  rate?: number;
  life?: number;
  size?: number;
  rise?: number;
  wind?: number;
  color?: string;
  opacity?: number;
  seed?: string;
  fadeOut?: number; // 0..1 global fade multiplier
  w?: number;
  h?: number;
}> = ({frame, emitter, from, to, rate = 3, life = 70, size = 90, rise = 3, wind = 0.6, color = MONSTER.smoke, opacity = 0.55, seed = 'smk', fadeOut = 1, w = 1080, h = 1920}) => {
  const out: React.ReactNode[] = [];
  for (let age = 0; age < life; age++) {
    const born = frame - age;
    if (born < from || born > to) continue;
    const box = emitter(born);
    for (let k = 0; k < rate; k++) {
      const s = `${seed}-${born}-${k}`;
      const x0 = box.x + random(`${s}x`) * box.w;
      const y0 = box.y + random(`${s}y`) * box.h;
      const t = age / life;
      const drift = Math.sin(age * 0.07 + random(`${s}p`) * 6) * 22;
      const x = x0 + wind * age * (0.6 + random(`${s}w`)) + drift;
      const y = y0 - rise * age * (0.6 + random(`${s}r`) * 0.8);
      const r = size * (0.35 + t * 1.8) * (0.6 + random(`${s}s`) * 0.8);
      out.push(<circle key={s} cx={x} cy={y} r={r} fill={`url(#${seed}-g)`} opacity={opacity * Math.sin(Math.PI * Math.min(1, t * 1.15)) * fadeOut} />);
    }
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${seed}-g`}>
          <stop offset="0" stopColor={color} stopOpacity={0.9} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.45} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {out}
    </svg>
  );
};

const rockPath = (seed: string, r: number) => {
  const n = 7;
  const pts = Array.from({length: n}).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.6 + random(`${seed}-${i}`) * 0.5);
    return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr * 0.8).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
};

/** Rocks and slabs tearing off the ground and floating up. */
export const Debris: React.FC<{frame: number; start: number; groundY: number; count?: number; spread?: [number, number]; seed?: string; lift?: number}> = ({
  frame,
  start,
  groundY,
  count = 26,
  spread = [0, 1080],
  seed = 'deb',
  lift = 1,
}) => {
  const rocks: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const s = `${seed}-${i}`;
    const born = start + Math.floor(random(`${s}b`) * 70);
    const age = frame - born;
    if (age < 0) continue;
    const depth = random(`${s}d`); // 0 far .. 1 near
    const r = 8 + depth * 46;
    const x = spread[0] + random(`${s}x`) * (spread[1] - spread[0]);
    const riseEase = 1 - Math.exp(-age / 40);
    const y = groundY + depth * 160 - riseEase * (200 + random(`${s}h`) * 900) * lift + Math.sin(age * 0.08 + i) * 10;
    const rot = age * (random(`${s}r`) - 0.5) * 3;
    rocks.push(
      <g key={s} transform={`translate(${x},${y}) rotate(${rot})`} opacity={Math.min(1, age / 8)} style={{filter: depth > 0.85 ? 'blur(3px)' : undefined}}>
        <path d={rockPath(s, r)} fill="#1a1414" stroke={MONSTER.red} strokeOpacity={0.55} strokeWidth={2} />
        <path d={rockPath(s + 'h', r * 0.5)} fill="#2a1f1f" transform={`translate(${-r * 0.2},${-r * 0.2})`} />
      </g>,
    );
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {rocks}
    </svg>
  );
};

const bolt = (seed: string, x0: number, y0: number, x1: number, y1: number, depth = 5, rough = 0.35): [number, number][] => {
  let pts: [number, number][] = [
    [x0, y0],
    [x1, y1],
  ];
  for (let d = 0; d < depth; d++) {
    const next: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      const off = (random(`${seed}-${d}-${i}`) - 0.5) * len * rough;
      const nx = -(by - ay) / len;
      const ny = (bx - ax) / len;
      next.push([(ax + bx) / 2 + nx * off, (ay + by) / 2 + ny * off], pts[i + 1]);
    }
    pts = next;
  }
  return pts;
};

/** Red lightning bolts: each strike = [frame, x0, y0, x1, y1]. */
export const Lightning: React.FC<{frame: number; strikes: [number, number, number, number, number][]; color?: string}> = ({frame, strikes, color = MONSTER.red}) => {
  const out: React.ReactNode[] = [];
  strikes.forEach(([f, x0, y0, x1, y1], i) => {
    const age = frame - f;
    if (age < 0 || age > 9) return;
    if (age > 2 && age % 3 === 1) return; // flicker
    const s = `bolt-${i}-${Math.floor(age / 3)}`;
    const main = bolt(s, x0, y0, x1, y1);
    const pts = main.map((p) => p.join(',')).join(' ');
    const fade = 1 - age / 10;
    out.push(<polyline key={`${s}g`} points={pts} stroke={color} strokeWidth={14} fill="none" opacity={0.5 * fade} strokeLinejoin="round" />);
    out.push(<polyline key={`${s}c`} points={pts} stroke="#fff3f0" strokeWidth={3.5} fill="none" opacity={fade} strokeLinejoin="round" />);
    // two branches
    [0.35, 0.6].forEach((k, b) => {
      const p = main[Math.floor(main.length * k)];
      const br = bolt(`${s}-b${b}`, p[0], p[1], p[0] + (random(`${s}bx${b}`) - 0.5) * 420, p[1] + 120 + random(`${s}by${b}`) * 260, 4, 0.45);
      out.push(<polyline key={`${s}b${b}`} points={br.map((q) => q.join(',')).join(' ')} stroke={color} strokeWidth={2.5} fill="none" opacity={0.8 * fade} />);
    });
  });
  if (!out.length) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 30px ${color})`}}>
      {out}
    </svg>
  );
};

/** Glowing ground cracks radiating from (cx, cy). progress 0..1 grows them. */
export const Cracks: React.FC<{cx: number; cy: number; progress: number; seed?: string; reach?: number; glow?: number}> = ({cx, cy, progress, seed = 'crk', reach = 620, glow = 1}) => {
  const paths: React.ReactNode[] = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const s = `${seed}-${i}`;
    const ang = (i / N) * Math.PI * 2 + random(`${s}a`) * 0.5;
    const len = reach * (0.55 + random(`${s}l`) * 0.6);
    const segs = 9;
    let x = cx;
    let y = cy;
    let d = `M${x},${y}`;
    const branchPts: [number, number, number][] = [];
    for (let k = 1; k <= segs; k++) {
      const a = ang + (random(`${s}-${k}`) - 0.5) * 0.9;
      const step = len / segs;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step * 0.32; // ground plane perspective
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      if (k === 3 || k === 6) branchPts.push([x, y, a]);
    }
    const p = Math.max(0, Math.min(1, progress * 1.25 - random(`${s}delay`) * 0.25));
    const w = 7 * (1 - i / (N * 2));
    paths.push(
      <g key={s}>
        <path d={d} stroke={MONSTER.red} strokeWidth={w * 3.5} fill="none" opacity={0.35 * glow} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
        <path d={d} stroke="#ffb07a" strokeWidth={w} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
        <path d={d} stroke="#120808" strokeWidth={w * 0.45} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      </g>,
    );
    branchPts.forEach(([bx, by, a], b) => {
      const bl = len * 0.35;
      const a2 = a + (b % 2 ? 0.9 : -0.9);
      const bd = `M${bx},${by} L${bx + Math.cos(a2) * bl * 0.5},${by + Math.sin(a2) * bl * 0.16} L${bx + Math.cos(a2 + 0.3) * bl},${by + Math.sin(a2 + 0.3) * bl * 0.32}`;
      const bp = Math.max(0, Math.min(1, (p - 0.4 - b * 0.2) * 2.5));
      paths.push(<path key={`${s}b${b}`} d={bd} stroke="#ff7a3a" strokeWidth={w * 0.6} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - bp} opacity={0.9} />);
    });
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 ${10 * glow}px ${MONSTER.red})`}}>
      {paths}
    </svg>
  );
};

/** Red anamorphic lens flare. */
export const LensFlare: React.FC<{x: number; y: number; intensity: number; color?: string; frame: number}> = ({x, y, intensity, color = MONSTER.red, frame}) => {
  if (intensity <= 0.01) return null;
  const cx = 540;
  const cy = 960;
  const ghosts = [0.4, -0.3, -0.7, 1.3];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id="lf-core">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.25" stopColor={color} stopOpacity={0.9} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="lf-streak" x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity={0} />
          <stop offset="0.5" stopColor="#ffd0c8" />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g opacity={intensity}>
        <ellipse cx={x} cy={y} rx={900} ry={7} fill="url(#lf-streak)" />
        <ellipse cx={x} cy={y} rx={520} ry={2.5} fill="#fff" opacity={0.8} />
        <circle cx={x} cy={y} r={90 + Math.sin(frame * 0.5) * 6} fill="url(#lf-core)" />
        {[0, 45, 90, 135].map((a) => (
          <rect key={a} x={x - 140} y={y - 1.5} width={280} height={3} fill="#ffd9d0" opacity={0.6} transform={`rotate(${a + frame * 0.6} ${x} ${y})`} />
        ))}
        {ghosts.map((g, i) => (
          <circle key={i} cx={cx + (x - cx) * -g} cy={cy + (y - cy) * -g} r={30 + i * 18} fill={color} opacity={0.12} />
        ))}
      </g>
    </svg>
  );
};

/** SVG displacement filter for full-frame ripples (reference via filter: url(#id)). */
export const RippleFilter: React.FC<{id: string; scale: number; frame: number}> = ({id, scale, frame}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={`${0.004 + 0.002 * Math.sin(frame * 0.3)} 0.012`} numOctaves={2} seed={3} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

/** Twinkling pastel 4-point sparkles. */
export const Sparkles: React.FC<{frame: number; count?: number; area?: Box; start?: number; seed?: string; colors?: string[]}> = ({
  frame,
  count = 30,
  area = {x: 0, y: 0, w: 1080, h: 1920},
  start = 0,
  seed = 'spk',
  colors = PASTEL,
}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const s = `${seed}-${i}`;
    const born = start + Math.floor(random(`${s}b`) * 40);
    const age = frame - born;
    if (age < 0) continue;
    const x = area.x + random(`${s}x`) * area.w;
    const y = area.y + random(`${s}y`) * area.h - age * 0.6;
    const tw = Math.max(0, Math.sin(age * 0.18 + random(`${s}p`) * 6));
    const r = (10 + random(`${s}r`) * 22) * tw * Math.min(1, age / 6);
    const c = colors[i % colors.length];
    out.push(
      <path
        key={s}
        d={`M0,${-r} Q${r * 0.12},${-r * 0.12} ${r},0 Q${r * 0.12},${r * 0.12} 0,${r} Q${-r * 0.12},${r * 0.12} ${-r},0 Q${-r * 0.12},${-r * 0.12} 0,${-r}Z`}
        fill={c}
        transform={`translate(${x},${y}) rotate(${age * 2})`}
        opacity={0.9}
      />,
    );
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.7))'}}>
      {out}
    </svg>
  );
};

/** Small hearts floating up from a point. */
export const Hearts: React.FC<{frame: number; start: number; x: number; y: number; count?: number; seed?: string}> = ({frame, start, x, y, count = 12, seed = 'hrt'}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const s = `${seed}-${i}`;
    const born = start + i * 9 + Math.floor(random(`${s}b`) * 6);
    const age = frame - born;
    if (age < 0 || age > 80) continue;
    const t = age / 80;
    const hx = x + (random(`${s}x`) - 0.5) * 320 + Math.sin(age * 0.12 + i) * 30;
    const hy = y - age * (3 + random(`${s}v`) * 2);
    const sc = (0.6 + random(`${s}s`) * 0.8) * Math.min(1, age / 8) * 1.4;
    out.push(
      <path
        key={s}
        d="M0,6 C-14,-6 -10,-20 0,-12 C10,-20 14,-6 0,6Z"
        fill={PASTEL[i % 2 === 0 ? 0 : 2]}
        transform={`translate(${hx},${hy}) scale(${sc * 2})`}
        opacity={1 - t * t}
      />,
    );
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 0 6px rgba(255,180,210,0.8))'}}>
      {out}
    </svg>
  );
};

/** Volumetric light rays from the top + floating dust motes. */
export const LightRays: React.FC<{frame: number; intensity?: number; color?: string}> = ({frame, intensity = 1, color = '255,225,190'}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', pointerEvents: 'none'}}>
    <defs>
      <linearGradient id="ray-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={`rgb(${color})`} stopOpacity={0.55} />
        <stop offset="1" stopColor={`rgb(${color})`} stopOpacity={0} />
      </linearGradient>
    </defs>
    {[0, 1, 2, 3, 4].map((i) => {
      const x = 80 + i * 190 + Math.sin(frame / 50 + i) * 30;
      const w = 50 + (i % 3) * 40;
      const o = (0.35 + 0.25 * Math.sin(frame / 23 + i * 1.7)) * intensity;
      return <polygon key={i} points={`${x},-50 ${x + w},-50 ${x + w + 380},1920 ${x + 120},1920`} fill="url(#ray-g)" opacity={o} />;
    })}
    {Array.from({length: 40}).map((_, i) => {
      const x = (random(`mote-x-${i}`) * 1080 + frame * (0.3 + random(`mote-v-${i}`))) % 1080;
      const y = (random(`mote-y-${i}`) * 1920 - frame * 0.5 + 1920) % 1920;
      return <circle key={`m${i}`} cx={x} cy={y} r={1 + random(`mote-r-${i}`) * 2.5} fill={`rgb(${color})`} opacity={0.5 * intensity * (0.4 + 0.6 * Math.abs(Math.sin(frame / 15 + i)))} />;
    })}
  </svg>
);

/** Expanding glowing shockwave ring. */
export const ShockRing: React.FC<{x: number; y: number; p: number; color?: string; size?: number; squash?: number}> = ({x, y, p, color = MONSTER.red, size = 1600, squash = 1}) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - (size * squash) / 2,
        width: size,
        height: size * squash,
        borderRadius: '50%',
        border: `${26 * (1 - p)}px solid ${color}`,
        boxShadow: `0 0 80px ${color}, inset 0 0 60px ${color}`,
        transform: `scale(${0.05 + p})`,
        opacity: 1 - p * p,
      }}
    />
  );
};
