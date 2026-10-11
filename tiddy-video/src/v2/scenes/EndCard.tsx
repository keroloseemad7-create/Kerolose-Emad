import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MetalText} from '../../components/MetalText';
import {Burst, Sparks} from '../../components/Sparks';
import {BEBAS, clamp, COLORS, EASE} from '../../theme';
import {MonsterTiddy} from '../components/Monster';
import {GroundShadow} from '../components/View';
import {EV, local, MONSTER, scene, TEXT, viewW} from '../config';

const STRIPES = 40;
const TIDDY_H = 560;

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = scene('endCard');
  const L = (s: number) => local('endCard', s);
  const logo = L(EV.endCard.logo);
  const tagline = L(EV.endCard.tagline);
  const [eye1, eye2] = EV.endCard.redEye.map(L);

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: EASE.out});
  const logoIn = spring({frame: frame - logo - 4, fps, config: {damping: 14, stiffness: 120}});
  const tagIn = interpolate(frame, [tagline, tagline + 15], [0, 1], {...clamp, easing: EASE.out});
  const shine = interpolate(frame, [logo + 20, logo + 50], [0, 1], {...clamp, easing: EASE.inOut});
  const float = Math.sin((frame / fps) * Math.PI * 0.8) * 14;
  const tiddyIn = spring({frame: frame - 8, fps, config: {damping: 12, stiffness: 110}});

  // red-eye teaser: two flickers, then the lights die and only the eyes remain
  const flick = (at: number) => (frame >= at && frame < at + 6 ? (random(`re-${frame}`) > 0.3 ? 1 : 0.2) : 0);
  const finalEyes = interpolate(frame, [eye2 + 8, eye2 + 14], [0, 1], {...clamp, easing: EASE.out});
  const eyes = Math.max(flick(eye1), flick(eye2), finalEyes);
  const lightsOut = Math.max(flick(eye1) * 0.55, flick(eye2) * 0.65, interpolate(frame, [eye2 + 6, duration - 4], [0, 0.94], {...clamp, easing: EASE.inOut}));

  const stripes = Array.from({length: STRIPES}).map((_, i) => {
    const x = (i / (STRIPES - 1)) * 1200 - 60;
    const delay = Math.abs(i - STRIPES / 2) * 0.7;
    const draw = interpolate(frame, [delay, delay + 26], [0, 1], {...clamp, easing: EASE.out});
    const wob = 10 + random(`vst-${i}`) * 14;
    const drift = Math.sin(frame / 40 + i) * 4;
    return (
      <path
        key={i}
        d={`M${x + drift},-20 C${x + wob},600 ${x - wob},1300 ${x + drift},1940`}
        stroke={COLORS.navyBright}
        strokeWidth={2.5}
        fill="none"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - draw}
        opacity={0.24 + (i % 3 === 0 ? 0.1 : 0)}
      />
    );
  });
  const bursts: Burst[] = Array.from({length: 12}).map((_, i) => ({
    frame: 4 + Math.floor(random(`veb-f-${i}`) * 90),
    x: 100 + random(`veb-x-${i}`) * 880,
    y: 1930,
    count: 4,
    power: 10,
    angle: -Math.PI / 2,
    spread: 0.7,
    gravity: 0.12,
    life: 70,
    seed: `veb-${i}`,
  }));
  const tw = viewW('front', TIDDY_H);

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden', opacity: fadeIn}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 50% 50%, #1b2140 0%, ${COLORS.charcoal} 45%, ${COLORS.black} 85%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {stripes}
      </svg>
      <Sparks bursts={bursts} frame={frame} width={1080} height={1920} />
      <AbsoluteFill style={{transform: `translateY(${float}px)`}}>
        <GroundShadow x={540} y={1050} w={tw * 0.9} opacity={0.6 * tiddyIn} squash={0.14} />
        <div style={{position: 'absolute', left: 540 - tw / 2, top: 1040 - TIDDY_H - 30 + float * 0.6, opacity: tiddyIn, transform: `scale(${0.8 + 0.2 * tiddyIn})`, transformOrigin: '50% 100%'}}>
          <MonsterTiddy height={TIDDY_H} m={eyes * 0.35} eyes={eyes} frame={frame} flare={eyes > 0.5} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1110, display: 'flex', justifyContent: 'center', opacity: logoIn, transform: `scale(${1.25 - 0.25 * logoIn})`, filter: `blur(${(1 - logoIn) * 20}px)`}}>
          <MetalText text={TEXT.title} fontSize={300} frame={frame} shine={shine} glow={0.8 + 0.2 * Math.sin(frame / 8)} letterSpacing={0.08} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, opacity: tagIn}}>
          <div style={{width: 90 * tagIn, height: 3, background: `linear-gradient(90deg, transparent, ${COLORS.spark})`}} />
          <div style={{fontFamily: BEBAS, fontSize: 66, color: COLORS.steelLight, letterSpacing: `${0.3 - 0.12 * tagIn}em`, whiteSpace: 'nowrap'}}>{TEXT.tagline}</div>
          <div style={{width: 90 * tagIn, height: 3, background: `linear-gradient(270deg, transparent, ${COLORS.spark})`}} />
        </div>
      </AbsoluteFill>
      {/* lights out: everything but the eyes */}
      <AbsoluteFill style={{background: '#000', opacity: lightsOut}} />
      {eyes > 0 && (
        <AbsoluteFill style={{transform: `translateY(${float}px)`, mixBlendMode: 'screen'}}>
          <div style={{position: 'absolute', left: 540 - tw / 2, top: 1040 - TIDDY_H - 30 + float * 0.6}}>
            <MonsterTiddy height={TIDDY_H} m={0} eyes={eyes} frame={frame} flare={finalEyes > 0.5} eyesOnly />
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: MONSTER.red, opacity: (flick(eye1) + flick(eye2)) * 0.12, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
