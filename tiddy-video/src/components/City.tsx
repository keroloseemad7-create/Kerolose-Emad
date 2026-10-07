import React, {useMemo} from 'react';
import {random} from 'remotion';

type Building = {x: number; w: number; h: number; windows: {x: number; y: number; on: number}[]; antenna: boolean};

const makeSkyline = (seed: string, tile: number, minH: number, maxH: number, minW: number, maxW: number) => {
  const out: Building[] = [];
  let x = 0;
  let i = 0;
  while (x < tile) {
    const w = minW + random(`${seed}-w-${i}`) * (maxW - minW);
    const h = minH + Math.pow(random(`${seed}-h-${i}`), 1.4) * (maxH - minH);
    const windows: Building['windows'] = [];
    for (let wy = 24; wy < h - 20; wy += 26) {
      for (let wx = 10; wx < w - 14; wx += 20) {
        const r = random(`${seed}-win-${i}-${wx}-${wy}`);
        if (r > 0.78) windows.push({x: wx, y: wy, on: r});
      }
    }
    out.push({x, w, h, windows, antenna: random(`${seed}-a-${i}`) > 0.75});
    x += w + random(`${seed}-g-${i}`) * 8;
    i++;
  }
  return out;
};

/** Seamlessly tiling city silhouette that scrolls by `offset` px. */
export const City: React.FC<{
  seed: string;
  offset: number;
  baseline: number;
  color: string;
  windowColor?: string;
  minH: number;
  maxH: number;
  minW?: number;
  maxW?: number;
  style?: React.CSSProperties;
}> = ({seed, offset, baseline, color, windowColor, minH, maxH, minW = 60, maxW = 180, style}) => {
  const TILE = 2400;
  const buildings = useMemo(() => makeSkyline(seed, TILE, minH, maxH, minW, maxW), [seed, minH, maxH, minW, maxW]);
  const o = ((offset % TILE) + TILE) % TILE;
  const tile = (key: number) => (
    <g key={key} transform={`translate(${key * TILE - o}, 0)`}>
      {buildings.map((b, i) => (
        <g key={i} transform={`translate(${b.x}, ${baseline - b.h})`}>
          <rect width={b.w} height={b.h + 400} fill={color} />
          {b.antenna && <rect x={b.w / 2 - 2} y={-40} width={4} height={40} fill={color} />}
          {windowColor &&
            b.windows.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width={8} height={12} fill={windowColor} opacity={0.35 + (w.on - 0.78) * 2.5} />
            ))}
        </g>
      ))}
    </g>
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, ...style}}>
      {tile(0)}
      {tile(1)}
    </svg>
  );
};
