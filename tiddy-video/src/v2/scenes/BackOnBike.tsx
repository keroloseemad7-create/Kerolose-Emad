import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {HBlur} from '../../components/HBlur';
import {Burst, Sparks} from '../../components/Sparks';
import {Tiddy, tiddyWidth} from '../../components/Tiddy';
import {clamp, COLORS, EASE, flashAt, impactShake, TIDDY_RIDE} from '../../theme';
import {Sparkles} from '../components/FX';
import {GroundShadow, View} from '../components/View';
import {VStreet, V_ROAD_Y} from '../components/VStreet';
import {EV, local, scene, viewW} from '../config';

const H = 820;
const W = tiddyWidth(H);
const S = H / TIDDY_RIDE.h;
const REST_Y = V_ROAD_Y + 170; // image bottom when on the road
const warp = (t: number) => 0.5 + 0.6 * (t - 0.5) + 1.6 * Math.pow(t - 0.5, 3); // slowest at the apex

export const BackOnBike: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration: dur} = scene('backOnBike');
  const L = (s: number) => local('backOnBike', s);
  const land = L(EV.backOnBike.land);
  const jump = L(EV.backOnBike.jump);
  const jumpLand = L(EV.backOnBike.jumpLand);

  const slowmo = interpolate(frame, [jump, jump + 6, jumpLand - 6, jumpLand], [1, 0.18, 0.18, 1], {...clamp, easing: EASE.inOut});
  const speedAt = (f: number) => interpolate(f, [land, land + 30], [0, 46], {...clamp, easing: EASE.in}) * interpolate(f, [jump, jump + 6, jumpLand - 6, jumpLand], [1, 0.18, 0.18, 1], {...clamp, easing: EASE.inOut});
  const distTable = useMemo(() => {
    const t = [0];
    for (let f = 1; f <= dur; f++) t.push(t[f - 1] + speedAt(f));
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur, land, jump, jumpLand]);
  const dist = distTable[frame];
  const speed = speedAt(frame);

  // ---- the hop: little sitting Tiddy springs out of frame, then lands on the bike
  const angledH = 420;
  const hopUp = interpolate(frame, [4, 16], [0, 1], {...clamp, easing: EASE.in});
  const crouch = interpolate(frame, [0, 4, 6], [0, 1, 0], {...clamp, easing: EASE.inOut});
  const dropP = spring({frame: frame - (land - 10), fps, config: {damping: 12, stiffness: 180}});

  let tx = 170;
  let lift = 0;
  let rot = 0;
  if (frame >= jump && frame < jumpLand) {
    const u = warp((frame - jump) / (jumpLand - jump));
    tx = 170 + 180 * u;
    lift = 560 * 4 * u * (1 - u);
    rot = interpolate(u, [0, 0.4, 0.85, 1], [-12, -16, 5, 6], {easing: EASE.inOut});
  } else if (frame >= jumpLand) {
    const k = interpolate(frame, [jumpLand + 4, dur], [0, 1], {...clamp, easing: EASE.in});
    tx = 350 + 1200 * k;
    rot = 6 * Math.exp(-(frame - jumpLand) / 5);
  } else if (frame >= land) {
    tx = 170 + Math.sin((frame - land) / 9) * 10;
    rot = -speed * 0.05;
  }
  const dropY = frame < land ? (1 - dropP) * -1500 : 0;
  const landSquash = frame >= land ? 1 - 0.1 * Math.exp(-(frame - land) / 4) * Math.cos((frame - land) * 0.8) : 1;
  const ty = REST_Y - H - lift + dropY;

  const shake = impactShake(frame, [land, jumpLand], 30, 6);
  const sparkFrame = frame < jump ? frame : jump + (frame - jump) * slowmo; // particles slow down too
  const rear = {x: tx + TIDDY_RIDE.rearWheel.x * S, y: REST_Y - 5 - lift};
  const front = {x: tx + TIDDY_RIDE.frontWheel.x * S, y: REST_Y - 5 - lift};
  const bursts: Burst[] = [
    {frame: land, x: rear.x, y: REST_Y, count: 40, power: 24, angle: Math.PI * 1.15, spread: 1, seed: 'bl1'},
    {frame: land, x: front.x, y: REST_Y, count: 40, power: 24, angle: -Math.PI * 0.15, spread: 1, seed: 'bl2'},
    {frame: jump, x: rear.x, y: REST_Y, count: 60, power: 32, angle: Math.PI * 1.2, spread: 1.2, seed: 'launch', life: 60},
    {frame: jumpLand, x: rear.x, y: REST_Y, count: 50, power: 30, angle: Math.PI * 1.1, spread: 1, seed: 'jl1'},
    {frame: jumpLand, x: front.x, y: REST_Y, count: 50, power: 30, angle: -Math.PI * 0.1, spread: 1, seed: 'jl2'},
  ];
  for (let f = land + 6; f < dur; f += 3) {
    if (f > frame) break;
    if (f >= jump && f < jumpLand) {
      bursts.push({frame: f, x: rear.x - 20, y: rear.y, count: 5, power: 10, angle: Math.PI * 1.05, spread: 0.8, life: 40, gravity: 0.3, seed: `air${f}`});
    } else bursts.push({frame: f, x: rear.x - 10, y: REST_Y - 5, count: 4, power: 14, angle: Math.PI * 1.08, spread: 0.5, life: 18, seed: `rt${f}`});
  }
  // In slow-mo, air sparks are born at the bike's current position, so re-anchor them each frame.
  const airBursts = bursts.map((b) => (b.seed?.startsWith('air') ? {...b, x: rear.x - 20 - (frame - b.frame) * 4, y: rear.y} : b));

  const slow = 1 - slowmo;
  const rays = Array.from({length: 40}).map((_, i) => {
    const a = (i / 40) * Math.PI * 2;
    const r1 = 300 + random(`bray-${i}`) * 200;
    const len = 400 + random(`brl-${i}`) * 700;
    return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * (r1 + len)} y2={Math.sin(a) * (r1 + len)} stroke={i % 4 === 0 ? COLORS.spark : '#fff'} strokeWidth={2 + (i % 3) * 2} opacity={0.4} />;
  });

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <HBlur id="bob-ghost" amount={14} />
      <AbsoluteFill style={{transform: shake.transform}}>
        <VStreet id="bob" dist={dist} blur={speed * 0.3} style={{filter: `saturate(${1 - 0.6 * slow}) brightness(${1 - 0.3 * slow})`}} />
        {slow > 0.05 && (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: slow, mixBlendMode: 'screen'}}>
            <g transform={`translate(${tx + W * 0.5}, ${ty + H * 0.5}) rotate(${frame * 0.3})`}>{rays}</g>
          </svg>
        )}
        <GroundShadow x={(frame < land ? 540 : tx + W * 0.5)} y={REST_Y - 8} w={(frame < land ? viewW('angled', angledH) : W) * interpolate(lift, [0, 560], [1, 0.4])} opacity={0.8} squash={0.1} />
        {frame < land - 4 && (
          <div
            style={{
              position: 'absolute',
              left: 540 - viewW('angled', angledH) / 2,
              top: REST_Y - 10 - angledH - hopUp * 1700,
              transformOrigin: '50% 100%',
              transform: `scale(${1 + 0.15 * crouch}, ${1 - 0.18 * crouch + 0.15 * hopUp}) rotate(${hopUp * 20}deg)`,
            }}
          >
            <View name="angled" height={angledH} filter="drop-shadow(0 6px 8px rgba(0,0,0,0.5))" />
          </div>
        )}
        {frame < 30 && <Sparkles frame={frame} start={0} count={14} area={{x: 300, y: REST_Y - 900, w: 480, h: 800}} />}
        {frame >= land - 10 && (
          <>
            {speed > 8 &&
              [2, 1].map((g) => (
                <div key={g} style={{position: 'absolute', left: tx - g * speed * 1.3 - 30, top: ty, opacity: 0.1 / g, filter: 'url(#bob-ghost)', transformOrigin: '30% 92%', transform: `rotate(${rot}deg)`}}>
                  <Tiddy height={H} />
                </div>
              ))}
            <div style={{position: 'absolute', left: tx, top: ty, transformOrigin: '30% 92%', transform: `rotate(${rot}deg) scaleY(${landSquash})`}}>
              <Tiddy height={H} filter={`drop-shadow(0 12px 16px rgba(0,0,0,0.6)) drop-shadow(0 0 ${30 * slow}px rgba(255,138,31,${0.6 * slow}))`} />
            </div>
          </>
        )}
        <Sparks bursts={airBursts} frame={sparkFrame} width={1080} height={1920} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 75%, rgba(255,240,220,0.8), rgba(255,138,31,0.3) 30%, rgba(0,0,0,0) 60%)', opacity: Math.max(flashAt(frame, land, 5) * 0.6, flashAt(frame, jumpLand, 6) * 0.7), mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#000', opacity: interpolate(frame, [dur - 6, dur], [0, 1], {...clamp, easing: EASE.in})}} />
    </AbsoluteFill>
  );
};
