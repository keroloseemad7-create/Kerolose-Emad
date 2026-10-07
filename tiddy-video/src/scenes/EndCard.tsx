import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MetalText} from '../components/MetalText';
import {Bearing} from '../components/Parts';
import {Burst, Sparks} from '../components/Sparks';
import {BEBAS, beat, clamp, COLORS, EASE} from '../theme';

const STRIPES = 64;

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: EASE.out});
  const logoIn = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 120}});
  const logoBlur = interpolate(logoIn, [0, 1], [24, 0]);
  const shine = interpolate(frame, [beat(2), beat(4)], [0, 1], {...clamp, easing: EASE.inOut});
  const tagIn = interpolate(frame, [beat(2), beat(3)], [0, 1], {...clamp, easing: EASE.out});
  const float = Math.sin((frame / fps) * Math.PI * 0.9) * 10;
  const glowPulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.2);

  const stripes = Array.from({length: STRIPES}).map((_, i) => {
    const x = (i / (STRIPES - 1)) * 2100 - 90;
    const delay = Math.abs(i - STRIPES / 2) * 0.6;
    const draw = interpolate(frame, [delay, delay + 26], [0, 1], {...clamp, easing: EASE.out});
    const wob = 10 + random(`st-${i}`) * 14;
    const drift = Math.sin(frame / 40 + i) * 4;
    const d = `M${x + drift},-20 C${x + wob},300 ${x - wob},700 ${x + drift},1100`;
    return (
      <path
        key={i}
        d={d}
        stroke={COLORS.navyBright}
        strokeWidth={2}
        fill="none"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - draw}
        opacity={0.22 + (i % 3 === 0 ? 0.1 : 0)}
      />
    );
  });

  const bursts: Burst[] = Array.from({length: 10}).map((_, i) => ({
    frame: 6 + Math.floor(random(`eb-f-${i}`) * 80),
    x: 300 + random(`eb-x-${i}`) * 1320,
    y: 1090,
    count: 4,
    power: 9,
    angle: -Math.PI / 2,
    spread: 0.7,
    gravity: 0.15,
    life: 60,
    seed: `eb-${i}`,
  }));

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden', opacity: fadeIn}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 50% at 50% 48%, #1b2140 0%, ${COLORS.charcoal} 45%, ${COLORS.black} 85%)`}} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {stripes}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 40% 30% at 50% 46%, rgba(5,5,6,0.85), rgba(5,5,6,0) 100%)'}} />
      <Sparks bursts={bursts} frame={frame} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translateY(${float}px)`}}>
        <div style={{transform: `scale(${1.25 - 0.25 * logoIn})`, filter: `blur(${logoBlur}px)`, opacity: logoIn, marginTop: -60}}>
          <MetalText text="TIDDY" fontSize={330} frame={frame} shine={shine} glow={glowPulse} letterSpacing={0.08} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 16, opacity: tagIn}}>
          <div style={{width: 160 * tagIn, height: 3, background: `linear-gradient(90deg, transparent, ${COLORS.spark})`}} />
          <Bearing id="end-b" size={56} rotation={frame * 4} />
          <div
            style={{
              fontFamily: BEBAS,
              fontSize: 56,
              color: COLORS.steelLight,
              letterSpacing: `${0.55 - 0.2 * tagIn}em`,
              whiteSpace: 'nowrap',
            }}
          >
            Legend on two bearings
          </div>
          <Bearing id="end-b2" size={56} rotation={frame * 4} />
          <div style={{width: 160 * tagIn, height: 3, background: `linear-gradient(270deg, transparent, ${COLORS.spark})`}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
