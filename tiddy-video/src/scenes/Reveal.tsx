import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {HBlur} from '../components/HBlur';
import {MetalText} from '../components/MetalText';
import {Burst, Sparks} from '../components/Sparks';
import {Tiddy, tiddyWidth} from '../components/Tiddy';
import {BEBAS, beat, clamp, COLORS, EASE, flashAt, impactShake} from '../theme';

const SLAM = beat(3); // title lands on beat
const TIDDY_H = 730;

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const fromWhite = interpolate(frame, [0, 10], [1, 0], {...clamp, easing: EASE.out});

  // spotlight sweeps in from the left and settles on Tiddy
  const spotX = interpolate(frame, [2, 40], [-350, 960], {...clamp, easing: EASE.inOut});
  const spotR = interpolate(frame, [2, 40, 70], [260, 420, 560], {...clamp, easing: EASE.inOut});

  const enter = spring({frame: frame - 14, fps, config: {damping: 13, stiffness: 90, mass: 1}});
  const tScale = 0.8 + 0.2 * enter;
  const tRot = -9 * (1 - enter);
  const breathe = Math.sin((frame / fps) * Math.PI * 2 * 0.5) * 4;

  // title slam
  const slamP = interpolate(frame, [SLAM - 7, SLAM], [0, 1], {...clamp, easing: EASE.slam});
  const titleSettle = spring({frame: frame - SLAM, fps, config: {damping: 11, stiffness: 240}});
  const titleScale = frame < SLAM ? 3.2 - 2.2 * slamP : 1.06 - 0.06 * titleSettle;
  const titleOpacity = interpolate(frame, [SLAM - 7, SLAM - 4], [0, 1], clamp);
  const glitchSpike = random(`gl-${Math.floor(frame / 2)}`) > 0.72 ? 0.6 : 0;
  const glitch =
    frame >= SLAM ? Math.exp(-(frame - SLAM) / 7) + (frame - SLAM < 26 ? glitchSpike * Math.exp(-(frame - SLAM) / 14) : 0) : 0;
  const shine = interpolate(frame, [beat(5), beat(7)], [0, 1], {...clamp, easing: EASE.inOut});

  const shake = impactShake(frame, [SLAM, beat(4)], 22, 6);

  const tagIn = interpolate(frame, [beat(6), beat(7)], [0, 1], {...clamp, easing: EASE.out});

  // whip pan out on the last beat
  const whip = interpolate(frame, [durationInFrames - 9, durationInFrames], [0, 1], {...clamp, easing: EASE.in});

  const bursts: Burst[] = [
    {frame: SLAM, x: 260, y: 560, count: 40, power: 30, angle: Math.PI, spread: 1.4, seed: 'sl'},
    {frame: SLAM, x: 1660, y: 560, count: 40, power: 30, angle: 0, spread: 1.4, seed: 'sr'},
    {frame: SLAM, x: 960, y: 900, count: 30, power: 24, angle: -Math.PI / 2, spread: 2.4, seed: 'sc'},
  ];
  // slow ember rain
  for (let i = 0; i < 14; i++) {
    bursts.push({
      frame: Math.floor(30 + random(`rain-f-${i}`) * 100),
      x: 200 + random(`rain-x-${i}`) * 1520,
      y: -10,
      count: 3,
      power: 3,
      angle: Math.PI / 2,
      spread: 0.6,
      gravity: 0.25,
      life: 50,
      seed: `rain-${i}`,
    });
  }

  const tw = tiddyWidth(TIDDY_H);

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <HBlur id="reveal-whip" amount={whip * 60} />
      <AbsoluteFill style={{transform: `${shake.transform} translateX(${-whip * 500}px)`, filter: whip > 0 ? 'url(#reveal-whip)' : undefined}}>
        {/* stage: back wall + floor */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 55% at 50% 45%, ${COLORS.graphite} 0%, ${COLORS.charcoal} 45%, ${COLORS.black} 85%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 860,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(60,66,78,0.55) 0%, rgba(10,10,12,1) 100%)',
          }}
        />
        {/* title behind Tiddy */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 40,
            display: 'flex',
            justifyContent: 'center',
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
          }}
        >
          <MetalText text="TIDDY" fontSize={640} frame={frame} glitch={glitch} shine={shine} glow={0.5} letterSpacing={0.04} />
        </div>
        {/* floor shadow */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 360,
            top: 960,
            width: 720,
            height: 90,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 70%)',
            transform: `scale(${tScale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 960 - tw / 2,
            top: 1010 - TIDDY_H + breathe,
            transformOrigin: '50% 100%',
            transform: `scale(${tScale}) rotate(${tRot}deg)`,
          }}
        >
          <Tiddy height={TIDDY_H} filter="drop-shadow(0 20px 30px rgba(0,0,0,0.7)) drop-shadow(0 0 2px rgba(255,255,255,0.15))" />
        </div>
        {/* tagline */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1022,
            textAlign: 'center',
            fontFamily: BEBAS,
            fontSize: 34,
            letterSpacing: `${0.5 - tagIn * 0.2}em`,
            color: COLORS.steel,
            opacity: tagIn,
          }}
        >
          <span style={{color: COLORS.spark}}>///</span> STEAMPUNK JUNKYARD CHOPPER <span style={{color: COLORS.spark}}>///</span>
        </div>
      </AbsoluteFill>
      {/* spotlight darkness mask */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${spotR * 1.25}px ${spotR * 1.6}px at ${spotX}px 560px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.93) 100%)`,
        }}
      />
      {/* light cone */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${interpolate(spotX, [-350, 960], [35, 0])}deg, rgba(255,240,220,0) 0%, rgba(255,240,220,0.07) 50%, rgba(255,240,220,0) 100%)`,
          clipPath: `polygon(${spotX - 70}px 0px, ${spotX + 70}px 0px, ${spotX + spotR}px 1080px, ${spotX - spotR}px 1080px)`,
          mixBlendMode: 'screen',
        }}
      />
      <Sparks bursts={bursts} frame={frame} />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(255,240,220,0.9), rgba(255,138,31,0.3) 30%, rgba(0,0,0,0) 60%)',
          opacity: flashAt(frame, SLAM, 6) * 0.8,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill style={{background: '#fff4e2', opacity: fromWhite}} />
    </AbsoluteFill>
  );
};
