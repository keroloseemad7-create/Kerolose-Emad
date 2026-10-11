import React from 'react';
import {AbsoluteFill} from 'remotion';
import {City} from '../../components/City';
import {HBlur} from '../../components/HBlur';
import {COLORS} from '../../theme';

export const V_ROAD_Y = 1340;

/** Vertical night street with parallax layers. `dist` = world distance travelled (px). */
export const VStreet: React.FC<{dist: number; blur?: number; id: string; style?: React.CSSProperties}> = ({dist, blur = 0, id, style}) => {
  const dashOffset = dist % 300;
  const lampOffset = (dist * 1.7) % 1300;
  return (
    <AbsoluteFill style={style}>
      <HBlur id={`${id}-near`} amount={blur} />
      <HBlur id={`${id}-mid`} amount={blur * 0.35} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, #03040a 0%, #0a1230 35%, ${COLORS.navy} 58%, #3a1d12 68%, #1a0f0a 72%)`}} />
      <div
        style={{
          position: 'absolute',
          left: 700 - dist * 0.02,
          top: 260,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #f4f1e8, #b9c0c9 60%, #6d7480)',
          boxShadow: '0 0 90px rgba(200,210,255,0.35)',
          opacity: 0.85,
        }}
      />
      <City seed="vfar" offset={dist * 0.12} baseline={V_ROAD_Y} color="#141a35" minH={220} maxH={640} minW={50} maxW={130} width={1080} height={1920} />
      <City
        seed="vmid"
        offset={dist * 0.35}
        baseline={V_ROAD_Y}
        color="#080a12"
        windowColor={COLORS.spark}
        minH={150}
        maxH={480}
        minW={90}
        maxW={220}
        width={1080}
        height={1920}
        style={{filter: blur > 0 ? `url(#${id}-mid)` : undefined}}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: V_ROAD_Y - 200, height: 240, background: 'linear-gradient(180deg, rgba(255,120,40,0) 0%, rgba(255,110,40,0.18) 80%, rgba(255,110,40,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: V_ROAD_Y, bottom: 0, background: 'linear-gradient(180deg, #2a2c31 0%, #16171a 30%, #08080a 100%)', borderTop: `5px solid ${COLORS.steelDark}`}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: blur > 0 ? `url(#${id}-near)` : undefined}}>
        {Array.from({length: 6}).map((_, i) => (
          <rect key={i} x={i * 300 - dashOffset - 100} y={1520} width={170} height={14} rx={3} fill="#d9d2bf" opacity={0.85} />
        ))}
        <rect x={0} y={1356} width={1080} height={4} fill={COLORS.spark} opacity={0.35} />
        {[0, 1].map((i) => {
          const x = i * 1300 - lampOffset + 400;
          return (
            <g key={i} transform={`translate(${x}, 0)`}>
              <rect x={-11} y={520} width={22} height={1400} fill="#050506" />
              <rect x={-11} y={520} width={140} height={16} fill="#050506" />
              <ellipse cx={128} cy={545} rx={38} ry={11} fill="#ffd9a0" />
              <polygon points="95,545 160,545 360,1920 -100,1920" fill="#ffcf8a" opacity={0.06} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
