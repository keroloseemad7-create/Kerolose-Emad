import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {HBlur} from '../../components/HBlur';
import {Bearing} from '../../components/Parts';
import {Burst, Sparks} from '../../components/Sparks';
import {Tiddy, tiddyWidth} from '../../components/Tiddy';
import {BEBAS, clamp, COLORS, EASE, impactShake, TIDDY_RIDE} from '../../theme';
import {GroundShadow} from '../components/View';
import {VStreet, V_ROAD_Y} from '../components/VStreet';
import {BEAT_F, EV, local, scene, TEXT} from '../config';

const H = 820;
const W = tiddyWidth(H);
const S = H / TIDDY_RIDE.h;
const MAX = 48;

/** Vertical ride. Pass `frozen` to render the stopped final pose (used by the Trigger freeze). */
export const Ride: React.FC<{frozen?: boolean}> = ({frozen}) => {
  const live = useCurrentFrame();
  const {duration: dur} = scene('ride');
  const frame = frozen ? dur - 1 : live;
  const brake = local('ride', EV.ride.brake);
  const stop = local('ride', EV.ride.stop);

  const speedAt = (f: number) =>
    interpolate(f, [0, 30], [10, MAX], {...clamp, easing: EASE.out}) * interpolate(f, [brake, stop - 2], [1, 0], {...clamp, easing: EASE.out});
  const distTable = useMemo(() => {
    const t = [0];
    for (let f = 1; f <= dur; f++) t.push(t[f - 1] + speedAt(f));
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur, brake, stop]);
  const dist = distTable[frame];
  const speed = speedAt(frame);

  const enter = interpolate(frame, [0, 36], [-800, 170], {...clamp, easing: EASE.out});
  const cruise = Math.sin(frame / 40) * 40 * interpolate(frame, [brake - 10, brake], [1, 0], clamp);
  const lurch = interpolate(frame, [brake, brake + 10, stop], [0, 70, 55], {...clamp, easing: EASE.out});
  const tx = enter + cruise + lurch;

  const phase = (frame % BEAT_F) / BEAT_F;
  const moving = speed / MAX;
  const bounce = -Math.pow(Math.sin(phase * Math.PI), 2) * 14 * moving;
  const brakeTilt = interpolate(frame, [brake, brake + 8, stop], [0, 5, 0], {...clamp, easing: EASE.inOut});
  const tilt = Math.sin(phase * Math.PI * 2) * 1.2 * moving - speed * 0.04 + brakeTilt;
  const ty = V_ROAD_Y + 170 - H + bounce;

  const shake = impactShake(frame, [brake], 12, 6);
  const jitter = frozen ? {x: 0, y: 0} : {x: (random(`vj-${frame}`) - 0.5) * 3 * moving, y: (random(`vjy-${frame}`) - 0.5) * 3 * moving};
  const wheelRot = (dist / (TIDDY_RIDE.frontWheel.r * S)) * (180 / Math.PI);
  const front = {x: tx + TIDDY_RIDE.frontWheel.x * S, y: V_ROAD_Y + 165};
  const rear = {x: tx + TIDDY_RIDE.rearWheel.x * S, y: V_ROAD_Y + 165};

  // trail sparks while riding, a fan of brake sparks from both wheels when stopping
  const bursts: Burst[] = [];
  for (let f = Math.max(0, frame - 30); f <= frame; f++) {
    if (f < brake && f % 3 === 0 && f > 20) bursts.push({frame: f, x: rear.x - 10, y: rear.y, count: 4, power: 14, angle: Math.PI * 1.08, spread: 0.5, life: 18, seed: `tr${f}`});
    if (f >= brake && f < stop) {
      bursts.push({frame: f, x: front.x, y: front.y, count: 10, power: 24, angle: Math.PI * 1.1, spread: 0.7, life: 22, seed: `bf${f}`});
      if (f % 2 === 0) bursts.push({frame: f, x: rear.x, y: rear.y, count: 6, power: 20, angle: Math.PI * 1.15, spread: 0.6, life: 20, seed: `br${f}`});
    }
  }
  const lines = Array.from({length: 22}).map((_, i) => {
    const y = 200 + random(`vsl-y-${i}`) * 1500;
    const len = 200 + random(`vsl-l-${i}`) * 500;
    const sp = 1.3 + random(`vsl-s-${i}`) * 1.4;
    const x = 1500 - ((((random(`vsl-x-${i}`) * 1800 + dist * sp) % 2200) + 2200) % 2200);
    return <rect key={i} x={x} y={y} width={len} height={2 + random(`vsl-h-${i}`) * 3} rx={2} fill="#fff" opacity={0.08 + random(`vsl-o-${i}`) * 0.22} />;
  });

  const hudIn = interpolate(frame, [15, 30], [0, 1], {...clamp, easing: EASE.out});
  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <HBlur id="vride-ghost" amount={16} />
      <AbsoluteFill style={{transform: `translate(${shake.x + jitter.x}px, ${shake.y + jitter.y}px) scale(1.04)`}}>
        <VStreet id="vride" dist={dist} blur={speed * 0.35} />
        <GroundShadow x={tx + W * 0.5} y={V_ROAD_Y + 165} w={W * 1.05} squash={0.09} />
        {!frozen &&
          [2, 1].map((g) => (
            <div key={g} style={{position: 'absolute', left: tx - g * speed * 1.4 - 30, top: ty, opacity: (0.1 / g) * moving, filter: 'url(#vride-ghost)', transformOrigin: '70% 90%', transform: `rotate(${tilt}deg)`}}>
              <Tiddy height={H} />
            </div>
          ))}
        <div style={{position: 'absolute', left: tx, top: ty, transformOrigin: '70% 92%', transform: `rotate(${tilt}deg)`}}>
          <Tiddy height={H} filter="drop-shadow(0 12px 16px rgba(0,0,0,0.6))" />
          <svg width={240} height={240} viewBox="-120 -120 240 240" style={{position: 'absolute', left: TIDDY_RIDE.frontWheel.x * S - 120, top: TIDDY_RIDE.frontWheel.y * S - 120, mixBlendMode: 'screen', opacity: moving}}>
            <g transform={`rotate(${wheelRot})`}>
              <circle r={80} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeDasharray="34 70" />
              <circle r={54} fill="none" stroke={COLORS.sparkHot} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="14 34" />
            </g>
          </svg>
        </div>
        <Sparks bursts={bursts} frame={frame} width={1080} height={1920} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: moving, mixBlendMode: 'screen'}}>
          {lines}
        </svg>
      </AbsoluteFill>
      {/* HUD: bearing gauges synced to the wheels */}
      <div style={{position: 'absolute', left: 60, top: 140, opacity: hudIn * 0.92, display: 'flex', alignItems: 'center', gap: 24}}>
        <Bearing id="vhud" size={150} rotation={wheelRot} ballRotation={wheelRot * 0.4} />
        <div style={{fontFamily: BEBAS, color: COLORS.steelLight, lineHeight: 0.9}}>
          <div style={{fontSize: 120, whiteSpace: 'nowrap'}}>
            {Math.round(speed * 2.1)}
            <span style={{fontSize: 40, color: COLORS.spark, marginLeft: 10}}>MPH</span>
          </div>
          <div style={{fontSize: 30, letterSpacing: '0.3em', color: COLORS.steel, whiteSpace: 'nowrap'}}>{TEXT.rideHud}</div>
        </div>
      </div>
      <div style={{position: 'absolute', right: -90, bottom: 120, opacity: hudIn * 0.35}}>
        <Bearing id="vhud2" size={380} rotation={-wheelRot * 0.5} ballRotation={-wheelRot * 0.2} />
      </div>
    </AbsoluteFill>
  );
};
