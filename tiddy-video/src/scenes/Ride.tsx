import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {HBlur} from '../components/HBlur';
import {Bearing} from '../components/Parts';
import {Street, ROAD_Y} from '../components/Street';
import {Tiddy, tiddyWidth} from '../components/Tiddy';
import {BEAT, BEBAS, beat, clamp, COLORS, EASE, impactShake, TIDDY_RIDE} from '../theme';

const TIDDY_H = 560;
const S = TIDDY_H / TIDDY_RIDE.h; // image px -> screen px
const MAX_SPEED = 46; // world px per frame

const speedAt = (f: number, dur: number) =>
  interpolate(f, [0, 30], [8, MAX_SPEED], {...clamp, easing: EASE.out}) +
  interpolate(f, [dur - 40, dur], [0, 26], {...clamp, easing: EASE.in});

export const Ride: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames: dur} = useVideoConfig();

  // integrate speed -> world distance (and keep a table for particle lookups)
  const distTable = useMemo(() => {
    const t = [0];
    for (let f = 1; f <= dur; f++) t.push(t[f - 1] + speedAt(f, dur));
    return t;
  }, [dur]);
  const dist = distTable[frame];
  const speed = speedAt(frame, dur);

  // Tiddy's screen position: ride in, cruise, blast off screen right
  const enterX = interpolate(frame, [0, 40], [-700, 640], {...clamp, easing: EASE.out});
  const exitX = interpolate(frame, [dur - 32, dur], [0, 1700], {...clamp, easing: EASE.in});
  const drift = Math.sin((frame / 70) * Math.PI) * 50;
  const tx = enterX + exitX + drift;

  // bumps on every beat, a bigger one every 4 beats
  const phase = (frame % BEAT) / BEAT;
  const big = Math.floor(frame / BEAT) % 4 === 3;
  const bounce = -Math.pow(Math.sin(phase * Math.PI), 2) * (big ? 34 : 12);
  const tilt = Math.sin(phase * Math.PI * 2) * (big ? 3.5 : 1.2) - speed * 0.04;
  const ty = ROAD_Y + 110 - TIDDY_H + bounce;

  const impacts = Array.from({length: 14}, (_, i) => i * BEAT + BEAT * 4).filter((_, i) => i % 4 === 0);
  const shake = impactShake(frame, impacts, 7, 5);
  const jitter = {x: (random(`jx-${frame}`) - 0.5) * 3, y: (random(`jy-${frame}`) - 0.5) * 3};

  const wheelRot = (dist / (TIDDY_RIDE.frontWheel.r * S)) * (180 / Math.PI);

  // dust & spark trail: particles born at the rear wheel, left behind in world space
  const particles: React.ReactNode[] = [];
  for (let age = 0; age < 28; age++) {
    const born = frame - age;
    if (born < 0) break;
    for (let k = 0; k < 3; k++) {
      const seed = `p-${born}-${k}`;
      const isSpark = random(`${seed}-t`) > 0.6;
      const bornTx =
        interpolate(born, [0, 40], [-700, 640], {...clamp, easing: EASE.out}) +
        interpolate(born, [dur - 32, dur], [0, 1700], {...clamp, easing: EASE.in}) +
        Math.sin((born / 70) * Math.PI) * 50;
      const x0 = bornTx + TIDDY_RIDE.rearWheel.x * S - 20;
      const y0 = ROAD_Y + 105;
      const worldDrift = (distTable[frame] - distTable[born]) * 0.55;
      const vx = -2 - random(`${seed}-vx`) * 6;
      const vy = -(1 + random(`${seed}-vy`) * (isSpark ? 7 : 2.5));
      const x = x0 - worldDrift + vx * age;
      const y = y0 + vy * age + (isSpark ? 0.35 * age * age : 0.02 * age * age);
      const t = age / 28;
      if (isSpark) {
        particles.push(
          <line key={seed} x1={x} y1={y} x2={x + 18 + speed * 0.4} y2={y - vy * 0.8} stroke={t < 0.3 ? COLORS.sparkHot : COLORS.spark} strokeWidth={3 * (1 - t) + 0.6} strokeLinecap="round" opacity={1 - t} />,
        );
      } else {
        particles.push(<circle key={seed} cx={x} cy={Math.min(y, y0 + 10)} r={6 + age * 1.6} fill="#8a7a66" opacity={0.22 * (1 - t)} />);
      }
    }
  }

  // speed lines
  const lines = Array.from({length: 26}).map((_, i) => {
    const y = 80 + random(`sl-y-${i}`) * 900;
    const len = 160 + random(`sl-l-${i}`) * 420;
    const sp = 1.4 + random(`sl-s-${i}`) * 1.4;
    const x = 2400 - (((random(`sl-x-${i}`) * 2400 + dist * sp) % 2800) + 2800) % 2800;
    return <rect key={i} x={x} y={y} width={len} height={2 + random(`sl-h-${i}`) * 3} rx={2} fill="#fff" opacity={0.08 + random(`sl-o-${i}`) * 0.22} />;
  });
  const linesOpacity = interpolate(speed, [10, MAX_SPEED], [0, 1], clamp);

  const hudIn = interpolate(frame, [beat(1), beat(2)], [0, 1], {...clamp, easing: EASE.out});
  const mph = Math.round(speed * 2.1);

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <HBlur id="ride-ghost" amount={14} />
      <AbsoluteFill style={{transform: `translate(${shake.x + jitter.x}px, ${shake.y + jitter.y}px) scale(1.04)`}}>
        <Street id="ride" dist={dist} blur={speed * 0.35} />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {particles}
        </svg>
        {/* shadow */}
        <div
          style={{
            position: 'absolute',
            left: tx + 40,
            top: ROAD_Y + 85,
            width: tiddyWidth(TIDDY_H) * 0.95,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.8), rgba(0,0,0,0) 70%)',
            transform: `scaleX(${1 + bounce * 0.004})`,
          }}
        />
        {/* motion-blur ghosts */}
        {[2, 1].map((g) => (
          <div
            key={g}
            style={{
              position: 'absolute',
              left: tx - g * speed * 1.4 - 30,
              top: ty + g * 1.5,
              opacity: 0.1 / g,
              filter: 'url(#ride-ghost)',
              transformOrigin: '70% 90%',
              transform: `rotate(${tilt}deg)`,
            }}
          >
            <Tiddy height={TIDDY_H} />
          </div>
        ))}
        <div style={{position: 'absolute', left: tx, top: ty, transformOrigin: '70% 90%', transform: `rotate(${tilt}deg)`}}>
          <Tiddy height={TIDDY_H} filter="drop-shadow(0 10px 14px rgba(0,0,0,0.6))" />
          {/* spin streaks over the real bearing wheel */}
          <svg
            width={200}
            height={200}
            viewBox="-100 -100 200 200"
            style={{position: 'absolute', left: TIDDY_RIDE.frontWheel.x * S - 100, top: TIDDY_RIDE.frontWheel.y * S - 100, mixBlendMode: 'screen'}}
          >
            <g transform={`rotate(${wheelRot})`}>
              <circle r={62} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeDasharray="30 60" />
              <circle r={42} fill="none" stroke={COLORS.sparkHot} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="12 30" />
            </g>
          </svg>
        </div>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: linesOpacity, mixBlendMode: 'screen'}}>
          {lines}
        </svg>
      </AbsoluteFill>

      {/* HUD: rotating bearing gauges synced to wheel speed */}
      <div style={{position: 'absolute', left: 60, top: 60, opacity: hudIn * 0.9, transform: `translateX(${(1 - hudIn) * -80}px)`}}>
        <Bearing id="hud1" size={170} rotation={wheelRot} ballRotation={wheelRot * 0.4} />
        <div style={{position: 'absolute', left: 190, top: 22, fontFamily: BEBAS, color: COLORS.steelLight, lineHeight: 0.9}}>
          <div style={{fontSize: 110, whiteSpace: 'nowrap'}}>
            {mph}
            <span style={{fontSize: 36, color: COLORS.spark, marginLeft: 10}}>MPH</span>
          </div>
          <div style={{fontSize: 26, letterSpacing: '0.3em', color: COLORS.steel, whiteSpace: 'nowrap'}}>RIDE MODE // FULL SCRAP</div>
        </div>
      </div>
      <div style={{position: 'absolute', right: -60, bottom: -60, opacity: hudIn * 0.35}}>
        <Bearing id="hud2" size={360} rotation={-wheelRot * 0.5} ballRotation={-wheelRot * 0.2} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: `linear-gradient(90deg, ${COLORS.navyBright}, ${COLORS.spark})`,
          transformOrigin: '0 50%',
          transform: `scaleX(${interpolate(frame, [0, dur], [0, 1], {...clamp, easing: EASE.inOut})})`,
        }}
      />
    </AbsoluteFill>
  );
};
