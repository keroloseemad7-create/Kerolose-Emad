import { random } from 'remotion';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const backOut = (x: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

/** Decaying camera shake after each impact frame. Returns px offsets + small rotation. */
export const shakeAt = (frame: number, impacts: number[], strength = 16) => {
  let x = 0, y = 0, r = 0;
  for (const imp of impacts) {
    const a = frame - imp;
    if (a < 0 || a > 9) continue;
    const d = Math.pow(1 - a / 9, 2) * strength;
    x += (random(`sx${imp}-${frame}`) - 0.5) * 2 * d;
    y += (random(`sy${imp}-${frame}`) - 0.5) * 2 * d;
    r += (random(`sr${imp}-${frame}`) - 0.5) * 0.12 * d;
  }
  return { x, y, r };
};
