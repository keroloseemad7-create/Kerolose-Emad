import React from 'react';
import {AbsoluteFill} from 'remotion';
import {City} from './City';
import {HBlur} from './HBlur';
import {COLORS} from '../theme';

export const ROAD_Y = 860;

/** Night street with parallax layers. `dist` = world distance travelled (px). */
export const Street: React.FC<{dist: number; blur?: number; id: string; style?: React.CSSProperties}> = ({dist, blur = 0, id, style}) => {
  const dashOffset = dist % 260;
  const lampOffset = (dist * 1.6) % 1400;
  return (
    <AbsoluteFill style={style}>
      <HBlur id={`${id}-near`} amount={blur} />
      <HBlur id={`${id}-mid`} amount={blur * 0.35} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, #05070f 0%, #0b1330 38%, ${COLORS.navy} 62%, #3a1d12 80%, #1a0f0a 86%)`,
        }}
      />
      {/* moon */}
      <div
        style={{
          position: 'absolute',
          left: 1420 - dist * 0.02,
          top: 110,
          width: 170,
          height: 170,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #f4f1e8, #b9c0c9 60%, #6d7480)',
          boxShadow: '0 0 80px rgba(200,210,255,0.35)',
          opacity: 0.85,
        }}
      />
      <City seed="far" offset={dist * 0.12} baseline={ROAD_Y} color="#141a35" minH={140} maxH={420} minW={50} maxW={130} />
      <City
        seed="mid"
        offset={dist * 0.35}
        baseline={ROAD_Y}
        color="#080a12"
        windowColor={COLORS.spark}
        minH={90}
        maxH={330}
        minW={90}
        maxW={220}
        style={{filter: blur > 0 ? `url(#${id}-mid)` : undefined}}
      />
      {/* haze over horizon */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ROAD_Y - 160,
          height: 200,
          background: 'linear-gradient(180deg, rgba(255,120,40,0) 0%, rgba(255,110,40,0.16) 80%, rgba(255,110,40,0) 100%)',
        }}
      />
      {/* road */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ROAD_Y,
          bottom: 0,
          background: 'linear-gradient(180deg, #2a2c31 0%, #16171a 35%, #0b0b0d 100%)',
          borderTop: `4px solid ${COLORS.steelDark}`,
        }}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: blur > 0 ? `url(#${id}-near)` : undefined}}>
        {Array.from({length: 10}).map((_, i) => (
          <rect key={i} x={i * 260 - dashOffset - 100} y={958} width={150} height={12} rx={3} fill="#d9d2bf" opacity={0.85} />
        ))}
        <rect x={0} y={872} width={1920} height={3} fill={COLORS.spark} opacity={0.35} />
        {/* passing lamp posts */}
        {[0, 1, 2].map((i) => {
          const x = i * 1400 - lampOffset + 300;
          return (
            <g key={i} transform={`translate(${x}, 0)`}>
              <rect x={-9} y={260} width={18} height={820} fill="#050506" />
              <rect x={-9} y={260} width={120} height={14} fill="#050506" />
              <ellipse cx={110} cy={282} rx={34} ry={10} fill="#ffd9a0" />
              <polygon points="80,282 140,282 300,1080 -80,1080" fill="#ffcf8a" opacity={0.06} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
