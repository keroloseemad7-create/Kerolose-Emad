import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Burst, Sparks} from '../components/Sparks';
import {Street} from '../components/Street';
import {Tiddy, tiddyWidth} from '../components/Tiddy';
import {ANTON, beat, clamp, COLORS, EASE, flashAt, impactShake} from '../theme';

const H = 520;
const W = tiddyWidth(H);
const GROUND = 965; // wheel contact line
const RAMP0 = {x0: 380, x1: 980, top: 770};
const LAUNCH = beat(2);
const BOOM = beat(4);
const LAND = beat(7);
const LAND_X = 1430;

// slow-motion time warp: slowest at the apex
const warp = (t: number) => 0.5 + 0.6 * (t - 0.5) + 1.6 * Math.pow(t - 0.5, 3);

export const Jump: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames: dur} = useVideoConfig();

  // world scroll runs until launch, then freezes
  const runDist = (f: number) =>
    Math.min(f, LAUNCH) * 44 - interpolate(f, [0, 10], [0, 120], clamp) +
    (f > LAND ? interpolate(f, [LAND, LAND + 30], [0, 1], {...clamp, easing: EASE.inOut}) * (f - LAND) * 30 : 0);
  const dist = runDist(frame);
  // the ramp is world-fixed once Tiddy has left it: it drifts away after landing
  const rampShift = frame > LAND ? dist - runDist(LAND) : 0;
  const RAMP = {x0: RAMP0.x0 - rampShift, x1: RAMP0.x1 - rampShift, top: RAMP0.top};

  let cx: number;
  let cy: number;
  let rot: number;
  if (frame < LAUNCH) {
    cx = interpolate(frame, [0, LAUNCH], [-260, RAMP.x1], {...clamp, easing: EASE.inOut});
    const up = Math.max(0, (cx - RAMP.x0) / (RAMP.x1 - RAMP.x0));
    cy = GROUND - up * (GROUND - RAMP.top);
    rot = -18 * Math.min(1, up * 1.6);
  } else if (frame < LAND) {
    const t = (frame - LAUNCH) / (LAND - LAUNCH);
    const u = warp(t);
    cx = RAMP0.x1 + (LAND_X - RAMP0.x1) * u;
    cy = RAMP0.top + (GROUND - RAMP0.top) * u - 400 * 4 * u * (1 - u);
    rot = interpolate(u, [0, 0.45, 0.85, 1], [-18, -24, 4, 6], {easing: EASE.inOut});
  } else {
    const s = spring({frame: frame - LAND, fps, config: {damping: 10, stiffness: 120}});
    cx = LAND_X + 120 * s;
    cy = GROUND;
    rot = 6 * (1 - s) - Math.sin((frame - LAND) * 0.6) * 2 * Math.exp(-(frame - LAND) / 8);
  }
  const squash = frame >= LAND ? 1 - 0.12 * Math.exp(-(frame - LAND) / 4) * Math.cos((frame - LAND) * 0.7) : 1;

  const airborne = frame >= LAUNCH && frame < LAND;
  const freeze = interpolate(frame, [LAUNCH, LAUNCH + 8, LAND - 6, LAND], [0, 1, 1, 0], {...clamp, easing: EASE.inOut});
  const camZoom = 1 + 0.14 * freeze;
  const centerX = cx + W * 0.2;
  const centerY = cy - H * 0.5;

  const landShake = impactShake(frame, [LAND], 40, 7);
  const boomShake = impactShake(frame, [BOOM], 14, 6);

  const bursts: Burst[] = [
    {frame: LAUNCH, x: RAMP.x1, y: RAMP.top, count: 40, power: 26, angle: Math.PI * 1.1, spread: 1, seed: 'lip'},
    {frame: BOOM, x: centerX, y: centerY, count: 140, power: 48, life: 42, gravity: 0.5, seed: 'boom'},
    {frame: BOOM + 2, x: centerX, y: centerY, count: 60, power: 30, life: 34, gravity: 0.4, seed: 'boom2'},
    {frame: LAND, x: LAND_X - 20, y: GROUND, count: 70, power: 34, angle: Math.PI * 1.15, spread: 0.9, seed: 'landL'},
    {frame: LAND, x: LAND_X + 340, y: GROUND, count: 60, power: 30, angle: -Math.PI * 0.2, spread: 0.9, seed: 'landR'},
  ];

  // radial speed burst around Tiddy while frozen
  const rays = Array.from({length: 56}).map((_, i) => {
    const a = (i / 56) * Math.PI * 2 + random(`ray-a-${i}`) * 0.08;
    const r1 = 260 + random(`ray-r-${i}`) * 220 + (frame - LAUNCH) * 4;
    const len = 300 + random(`ray-l-${i}`) * 700;
    const wd = 2 + random(`ray-w-${i}`) * 7;
    return (
      <line
        key={i}
        x1={Math.cos(a) * r1}
        y1={Math.sin(a) * r1}
        x2={Math.cos(a) * (r1 + len)}
        y2={Math.sin(a) * (r1 + len)}
        stroke={i % 5 === 0 ? COLORS.spark : '#ffffff'}
        strokeWidth={wd}
        strokeLinecap="round"
        opacity={0.25 + random(`ray-o-${i}`) * 0.5}
      />
    );
  });

  const ring = interpolate(frame, [BOOM, BOOM + 22], [0, 1], {...clamp, easing: EASE.out});
  const landRing = interpolate(frame, [LAND, LAND + 18], [0, 1], {...clamp, easing: EASE.out});
  const airText = interpolate(frame, [LAUNCH + 4, LAUNCH + 16], [0, 1], {...clamp, easing: EASE.out}) * (1 - interpolate(frame, [LAND - 8, LAND], [0, 1], clamp));
  const toBlack = interpolate(frame, [dur - 10, dur], [0, 1], {...clamp, easing: EASE.in});

  // dust cloud on landing
  const dust = frame >= LAND
    ? Array.from({length: 26}).map((_, i) => {
        const age = frame - LAND;
        const dir = random(`d-${i}`) > 0.5 ? 1 : -1;
        const sp = 3 + random(`ds-${i}`) * 10;
        const x = LAND_X + 120 + dir * sp * age * Math.exp(-age / 30) * 3;
        const y = GROUND + 10 - random(`dy-${i}`) * 3 * age * Math.exp(-age / 20) * 2;
        const r = 20 + age * (1.5 + random(`dr-${i}`) * 2);
        return <circle key={i} cx={x} cy={y} r={r} fill="#9a8a74" opacity={Math.max(0, 0.32 * (1 - age / 45))} />;
      })
    : null;

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${landShake.x + boomShake.x}px, ${landShake.y + boomShake.y}px) rotate(${landShake.r}deg)`}}>
        <AbsoluteFill style={{transform: `scale(${camZoom})`, transformOrigin: `${centerX}px ${centerY}px`}}>
          <Street
            id="jump"
            dist={dist}
            blur={airborne ? 0 : interpolate(frame, [0, LAUNCH], [6, 16], clamp)}
            style={{filter: `grayscale(${freeze * 0.75}) brightness(${1 - freeze * 0.45}) contrast(${1 + freeze * 0.2})`}}
          />
          {/* scrap-metal ramp */}
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: `brightness(${1 - freeze * 0.4})`}}>
            <defs>
              <linearGradient id="ramp-metal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8d949e" />
                <stop offset="0.5" stopColor="#3b4048" />
                <stop offset="1" stopColor="#1b1d21" />
              </linearGradient>
            </defs>
            <polygon points={`${RAMP.x0},${GROUND + 6} ${RAMP.x1},${GROUND + 6} ${RAMP.x1},${RAMP.top}`} fill="url(#ramp-metal)" stroke="#0b0c0e" strokeWidth={4} />
            <line x1={RAMP.x0} y1={GROUND + 4} x2={RAMP.x1} y2={RAMP.top} stroke={COLORS.steelLight} strokeWidth={4} opacity={0.7} />
            {[0.2, 0.4, 0.6, 0.8].map((k) => (
              <circle key={k} cx={RAMP.x0 + (RAMP.x1 - RAMP.x0) * k + 20} cy={GROUND - (GROUND - RAMP.top) * k + 18} r={5} fill="#c9cfd6" />
            ))}
            <rect x={RAMP.x1 - 14} y={RAMP.top} width={14} height={GROUND - RAMP.top + 6} fill="#23252b" />
          </svg>
          {/* AIRTIME outline text */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 120,
              textAlign: 'center',
              fontFamily: ANTON,
              fontSize: 400,
              letterSpacing: '0.06em',
              color: 'transparent',
              WebkitTextStroke: `3px rgba(238,242,246,${0.55 * airText})`,
              transform: `scale(${0.9 + 0.1 * airText + (frame - LAUNCH) * 0.001})`,
              opacity: airText,
            }}
          >
            AIRTIME
          </div>
          {freeze > 0.01 && (
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: freeze, mixBlendMode: 'screen'}}>
              <g transform={`translate(${centerX}, ${centerY}) rotate(${frame * 0.4})`}>{rays}</g>
            </svg>
          )}
          {/* shockwave rings */}
          {ring > 0 && ring < 1 && (
            <div
              style={{
                position: 'absolute',
                left: centerX - 500,
                top: centerY - 500,
                width: 1000,
                height: 1000,
                borderRadius: '50%',
                border: `${14 * (1 - ring)}px solid ${COLORS.sparkHot}`,
                boxShadow: `0 0 60px ${COLORS.spark}`,
                transform: `scale(${0.1 + ring * 1.4})`,
                opacity: 1 - ring,
              }}
            />
          )}
          {landRing > 0 && landRing < 1 && (
            <div
              style={{
                position: 'absolute',
                left: LAND_X + 120 - 600,
                top: GROUND - 60,
                width: 1200,
                height: 120,
                borderRadius: '50%',
                border: `${10 * (1 - landRing)}px solid rgba(255,220,180,0.8)`,
                transform: `scale(${0.2 + landRing})`,
                opacity: 1 - landRing,
              }}
            />
          )}
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {dust}
          </svg>
          {/* shadow on ground, shrinking with altitude */}
          <div
            style={{
              position: 'absolute',
              left: cx - W * 0.2,
              top: GROUND - 25,
              width: W * 0.9,
              height: 50,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.8), rgba(0,0,0,0) 70%)',
              transform: `scale(${interpolate(GROUND - cy, [0, 500], [1, 0.4], clamp)})`,
              opacity: interpolate(GROUND - cy, [0, 500], [1, 0.3], clamp),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: cx - W * 0.3,
              top: cy - H * 0.93,
              transformOrigin: '30% 93%',
              transform: `rotate(${rot}deg) scaleY(${squash}) scaleX(${2 - squash})`,
            }}
          >
            <Tiddy
              height={H}
              filter={`drop-shadow(0 0 ${30 * freeze}px rgba(255,138,31,${0.6 * freeze})) drop-shadow(0 14px 18px rgba(0,0,0,0.6))`}
            />
          </div>
          <Sparks bursts={bursts} frame={frame} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${centerX}px ${centerY}px, rgba(255,250,235,1), rgba(255,138,31,0.6) 25%, rgba(0,0,0,0) 60%)`,
          opacity: Math.max(flashAt(frame, BOOM, 9), flashAt(frame, LAND, 6) * 0.7),
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill style={{background: COLORS.black, opacity: toBlack}} />
    </AbsoluteFill>
  );
};
