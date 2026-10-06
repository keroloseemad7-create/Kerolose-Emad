import {Easing, random, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const TOTAL_FRAMES = 900;

// 120 BPM -> one beat every 0.5s = 15 frames. All cuts/impacts land on beats.
export const BEAT = 15;
export const beat = (n: number) => Math.round(n * BEAT);

export const SCENES = {
  build: {from: 0, duration: beat(8)}, // 0-4s
  reveal: {from: beat(8), duration: beat(10)}, // 4-9s
  ride: {from: beat(18), duration: beat(14)}, // 9-16s
  details: {from: beat(32), duration: beat(12)}, // 16-22s
  jump: {from: beat(44), duration: beat(10)}, // 22-27s
  end: {from: beat(54), duration: beat(6)}, // 27-30s
} as const;

export const COLORS = {
  black: '#050506',
  charcoal: '#141518',
  graphite: '#23252b',
  steel: '#b9c0c9',
  steelLight: '#eef2f6',
  steelDark: '#5b626c',
  spark: '#ff8a1f',
  sparkHot: '#ffd27a',
  ember: '#ff4b12',
  navy: '#1d2c66',
  navyBright: '#3d57c4',
};

// Google Fonts (Anton + Bebas Neue), bundled locally in public/fonts so renders work offline.
export const ANTON = 'Anton';
export const BEBAS = 'Bebas Neue';
loadFont({family: ANTON, url: staticFile('fonts/Anton.woff2')});
loadFont({family: BEBAS, url: staticFile('fonts/BebasNeue.woff2')});

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  slam: Easing.bezier(0.9, 0, 1, 0.6),
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Decaying camera shake that kicks on every impact frame. */
export const impactShake = (
  frame: number,
  impacts: number[],
  amp = 18,
  decay = 6,
) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const t of impacts) {
    const d = frame - t;
    if (d < 0 || d > decay * 6) continue;
    const k = amp * Math.exp(-d / decay);
    const s = random(`shake-${t}`) * 10;
    x += k * Math.sin(d * 2.9 + s);
    y += k * Math.cos(d * 3.7 + s * 1.3) * 0.8;
    r += (k / amp) * 0.9 * Math.sin(d * 2.1 + s);
  }
  return {x, y, r, transform: `translate(${x}px, ${y}px) rotate(${r}deg)`};
};

/** Exponential flash envelope (0..1) after an impact frame. */
export const flashAt = (frame: number, t: number, len = 6) => {
  const d = frame - t;
  if (d < 0) return 0;
  return Math.exp(-d / (len / 3)) * (d < len * 3 ? 1 : 0);
};

/** Tiddy riding image (rotated cut-out) and points of interest in its pixel space. */
export const TIDDY_RIDE = {
  src: 'tiddy-ride.png',
  w: 1041,
  h: 1311,
  frontWheel: {x: 870, y: 1128, r: 165},
  rearWheel: {x: 255, y: 1040},
  spring: {x: 245, y: 1055},
  face: {x: 300, y: 255},
};
