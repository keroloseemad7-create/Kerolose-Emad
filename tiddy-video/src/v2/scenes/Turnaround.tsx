import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {HBlur} from '../../components/HBlur';
import {MetalText} from '../../components/MetalText';
import {Burst, Sparks} from '../../components/Sparks';
import {BEBAS, clamp, COLORS, EASE, flashAt, impactShake} from '../../theme';
import {GroundShadow, View} from '../components/View';
import {Turntable} from '../components/Turntable';
import {EV, local, scene, TEXT, VIEWS, viewW, ViewName} from '../config';

const ORDER: ViewName[] = ['front', 'right', 'back', 'left', 'front'];
const CX = 540;
const CY = 1500; // platter centre
const FRONT_H = 1000;

export const Turnaround: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = scene('turnaround');
  const land = local('turnaround', EV.turnaround.land);
  const swaps = EV.turnaround.swaps.map((s) => local('turnaround', s));
  const title = local('turnaround', EV.turnaround.title);

  const fromWhite = interpolate(frame, [0, 8], [1, 0], {...clamp, easing: EASE.out});
  const drop = spring({frame: frame - land + 10, fps, config: {damping: 11, stiffness: 160}});
  const dropY = (1 - drop) * -1400;

  const idx = swaps.filter((s) => frame >= s).length;
  const view = ORDER[idx];
  // squash + directional blur around every swap = fake 3D spin
  let squash = 0;
  for (const s of swaps) squash = Math.max(squash, Math.exp(-(((frame - s) / 2.6) ** 2)));
  const turned = swaps.reduce((acc, s) => acc + interpolate(frame, [s - 5, s + 3], [0, 90], {...clamp, easing: EASE.inOut}), 0);
  const settleSpin = interpolate(frame, [swaps[swaps.length - 1], duration], [0, 50], {...clamp, easing: EASE.out});
  const h = (FRONT_H * VIEWS[view].h) / VIEWS.front.h;
  const w = viewW(view, h);
  const breathe = Math.sin(frame / 12) * 4;

  const titleP = interpolate(frame, [title - 6, title], [0, 1], {...clamp, easing: EASE.slam});
  const titleSettle = spring({frame: frame - title, fps, config: {damping: 11, stiffness: 240}});
  const titleScale = frame < title ? 3 - 2 * titleP : 1.06 - 0.06 * titleSettle;
  const glitch = frame >= title ? Math.exp(-(frame - title) / 6) + (random(`tg-${Math.floor(frame / 2)}`) > 0.8 && frame - title < 20 ? 0.4 : 0) : 0;
  const shine = interpolate(frame, [title + 15, title + 45], [0, 1], {...clamp, easing: EASE.inOut});
  const labelIn = interpolate(frame, [title + 10, title + 22], [0, 1], {...clamp, easing: EASE.out});

  const shake = impactShake(frame, [land, title], 30, 6);
  const swapShake = impactShake(frame, swaps, 6, 3);
  const outro = interpolate(frame, [duration - 8, duration], [0, 1], {...clamp, easing: EASE.in});

  const bursts: Burst[] = [
    {frame: land, x: CX - 200, y: CY, count: 30, power: 22, angle: Math.PI * 1.1, spread: 1, seed: 'tl'},
    {frame: land, x: CX + 200, y: CY, count: 30, power: 22, angle: -Math.PI * 0.1, spread: 1, seed: 'tr'},
    {frame: title, x: CX, y: 420, count: 70, power: 34, seed: 'tt'},
    ...swaps.map((s, i) => ({frame: s, x: CX + (i % 2 ? 380 : -380), y: CY, count: 14, power: 16, angle: -Math.PI / 2, spread: 1.6, seed: `sw${i}`})),
  ];

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <HBlur id="spin-blur" amount={squash * 26} />
      <HBlur id="tt-outro" amount={outro * 50} />
      <AbsoluteFill style={{transform: `${shake.transform} translate(${swapShake.x}px, 0)`, filter: outro > 0 ? 'url(#tt-outro)' : undefined}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 50% 62%, ${COLORS.graphite} 0%, ${COLORS.charcoal} 40%, ${COLORS.black} 80%)`}} />
        {/* overhead spotlight cone */}
        <AbsoluteFill
          style={{
            background: 'linear-gradient(180deg, rgba(255,236,210,0.16), rgba(255,236,210,0.03))',
            clipPath: `polygon(${CX - 90}px 0, ${CX + 90}px 0, ${CX + 470}px ${CY + 60}px, ${CX - 470}px ${CY + 60}px)`,
          }}
        />
        <Turntable cx={CX} cy={CY} r={400} angle={turned + settleSpin + frame * 0.6} glow={0.6 + 0.4 * Math.min(1, drop)} />
        <GroundShadow x={CX} y={CY + 6} w={w * 0.9} opacity={0.75 * drop} />
        {/* title sits behind Tiddy */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', opacity: titleP, transform: `scale(${titleScale})`}}>
          <MetalText text={TEXT.title} fontSize={330} frame={frame} glitch={glitch} shine={shine} glow={0.6} letterSpacing={0.05} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: CX - w / 2,
            top: CY + 20 - h + dropY + breathe,
            transformOrigin: '50% 100%',
            transform: `scaleX(${1 - 0.5 * squash}) scaleY(${1 + 0.04 * squash})`,
            filter: squash > 0.05 ? 'url(#spin-blur)' : undefined,
          }}
        >
          <View name={view} height={h} filter="drop-shadow(0 18px 24px rgba(0,0,0,0.6))" />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: CY + 170,
            textAlign: 'center',
            fontFamily: BEBAS,
            fontSize: 40,
            letterSpacing: `${0.5 - 0.2 * labelIn}em`,
            color: COLORS.steel,
            opacity: labelIn,
          }}
        >
          <span style={{color: COLORS.spark}}>[ </span>
          {TEXT.turntableLabel}
          <span style={{color: COLORS.spark}}> ]</span>
        </div>
        <Sparks bursts={bursts} frame={frame} width={1080} height={1920} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(255,240,220,0.85), rgba(255,138,31,0.3) 35%, rgba(0,0,0,0) 65%)', opacity: flashAt(frame, title, 6) * 0.8, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#fff4e2', opacity: fromWhite}} />
    </AbsoluteFill>
  );
};
