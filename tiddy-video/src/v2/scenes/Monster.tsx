import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MetalText} from '../../components/MetalText';
import {Burst, Sparks} from '../../components/Sparks';
import {clamp, EASE, flashAt, impactShake} from '../../theme';
import {Cracks, Debris, Lightning, RippleFilter, ShockRing, Smoke} from '../components/FX';
import {FaceCloseup, MonsterTiddy, MonsterWorld} from '../components/Monster';
import {Ruler} from '../components/Ruler';
import {GroundShadow} from '../components/View';
import {EV, local, MONSTER, TEXT, viewW} from '../config';
import {TRIGGER_ZOOM_END} from './Trigger';

export const STAGE_H = [150, 520, 980, 1380];
const RED_TEXT = 'linear-gradient(180deg, #fff1ec 0%, #ff9a85 22%, #ff2a1a 48%, #6a0000 53%, #ff3b2f 72%, #ffb4a0 86%, #3a0000 100%)';

/** Monster height + camera ground line for a given local frame (also used by Shrink for its start state). */
export const monsterState = (f: number, fps: number, stages: number[]) => {
  let h = STAGE_H[0];
  stages.forEach((s, i) => {
    const p = spring({frame: f - s, fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
    h += p * (STAGE_H[i + 1] - STAGE_H[i]);
  });
  const lift = (h - STAGE_H[0]) / (STAGE_H[3] - STAGE_H[0]);
  return {h, groundY: 1560 + 200 * lift, level: lift};
};

export const Monster: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = (s: number) => local('monster', s);
  const M = EV.monster;
  const wide = L(M.wide);
  const stages = M.stages.map(L);
  const roar = L(M.roar);
  const words = M.titleWords.map(L);

  // ---------- phase A: the eyes ignite (face close-up)
  if (frame < wide) {
    const zoom = TRIGGER_ZOOM_END + 0.7 * interpolate(frame, [0, wide], [0, 1], {...clamp, easing: EASE.out});
    const glow = interpolate(frame, [2, 6, 9, 20], [0, 0.7, 0.3, 1], {...clamp, easing: EASE.inOut});
    const out = interpolate(frame, [wide - 6, wide], [0, 1], {...clamp, easing: EASE.in});
    const shake = impactShake(frame, [6, 20], 14, 5);
    return (
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        <AbsoluteFill style={{transform: `${shake.transform} scale(${1 - out * 0.5})`, filter: out > 0 ? `blur(${out * 12}px)` : undefined}}>
          <FaceCloseup zoom={zoom} glow={glow} frame={frame} grade={1} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: MONSTER.red, opacity: flashAt(frame, 20, 6) * 0.6 + out * 0.9, mixBlendMode: 'screen'}} />
      </AbsoluteFill>
    );
  }

  // ---------- phase B: the city shot
  const {h, groundY, level} = monsterState(frame, fps, stages);
  const w = viewW('front', h);
  const feetY = groundY + 70;
  const topY = feetY - h;
  const stageIdx = stages.filter((s) => frame >= s).length;
  const crack = interpolate(frame, [wide, wide + 20, stages[0], stages[0] + 10, stages[1], stages[1] + 10, stages[2], stages[2] + 12], [0, 0.3, 0.3, 0.55, 0.55, 0.78, 0.78, 1], {...clamp, easing: EASE.out});
  const fromRed = interpolate(frame, [wide, wide + 8], [1, 0], clamp);

  const shake = impactShake(frame, [wide, ...stages, L(M.rulerSnap), roar, words[1]], 46, 7);
  const ripple = frame >= roar ? 85 * Math.exp(-(frame - roar) / 9) : 0;
  const ringP = interpolate(frame, [roar, roar + 26], [0, 1], {...clamp, easing: EASE.out});

  const strikes: [number, number, number, number, number][] = [];
  [wide, ...stages, roar, roar + 9, words[1]].forEach((f, i) => {
    strikes.push([f, 100 + random(`lx${i}`) * 880, -20, 200 + random(`lx2${i}`) * 680, groundY - 100 - random(`ly${i}`) * 300]);
  });
  for (let i = 0; i < 6; i++) {
    const f = wide + Math.floor(random(`lr-${i}`) * 200);
    strikes.push([f, random(`lrx-${i}`) * 1080, -20, random(`lrx2-${i}`) * 1080, 300 + random(`lry-${i}`) * 500]);
  }

  const bursts: Burst[] = stages.map((s, i) => ({frame: s, x: 540, y: feetY, count: 50, power: 30 + i * 8, angle: -Math.PI / 2, spread: 2.6, seed: `stg${i}`}));
  bursts.push({frame: roar, x: 540, y: topY + h * 0.25, count: 90, power: 46, seed: 'roar'});

  const smokeEmitter = (f: number) => {
    const st = monsterState(f, fps, stages);
    const ww = viewW('front', st.h);
    return {x: 540 - ww * 0.4, y: st.groundY + 70 - st.h * 0.92, w: ww * 0.8, h: st.h * 0.75};
  };
  const smokeSize = 40 + h / 6;
  const tilt = 2 + 8 * level; // low camera looking up: verticals converge

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <RippleFilter id="roar-ripple" scale={ripple} frame={frame} />
      <AbsoluteFill style={{transform: shake.transform, filter: ripple > 0.5 ? 'url(#roar-ripple)' : undefined}}>
        <MonsterWorld frame={frame} groundY={groundY} redness={1} panic={Math.min(1, stageIdx / 2)} cityBlur={1.5} />
        <Smoke frame={frame} emitter={() => ({x: -200, y: 200, w: 1480, h: groundY - 400})} from={wide - 60} to={wide + 400} rate={1} life={120} size={260} rise={0.6} wind={0.9} color="#120404" opacity={0.5} seed="sky" />
        <Lightning frame={frame} strikes={strikes} />
        <Cracks cx={540} cy={feetY - 10} progress={crack} reach={700} glow={0.8 + 0.2 * Math.sin(frame / 3)} />
        <Debris frame={frame} start={wide + 6} groundY={groundY + 40} lift={0.6 + level} />
        <Smoke frame={frame} emitter={smokeEmitter} from={wide} to={wide + 400} rate={3} life={60} size={smokeSize} rise={1.5 + h / 300} wind={0.5} opacity={0.7} color="#4a2a26" seed="body" />
        <GroundShadow x={540} y={feetY - 6} w={w * 1.1} opacity={0.9} squash={0.12} />
        <div style={{position: 'absolute', left: 540 - w / 2, top: topY, transformOrigin: '50% 100%', transform: `perspective(1400px) rotateX(${tilt}deg)`}}>
          <MonsterTiddy height={h} m={1} eyes={1} frame={frame} />
        </div>
        <Smoke frame={frame} emitter={smokeEmitter} from={wide} to={wide + 400} rate={1} life={50} size={smokeSize * 0.8} rise={2 + h / 260} wind={-0.4} opacity={0.35} color="#3a2220" seed="bodyf" />
        <Sparks bursts={bursts} frame={frame} width={1080} height={1920} />
        <ShockRing x={540} y={topY + h * 0.3} p={ringP} size={2600} />
        {/* the ~20 cm size reference ruler, slot-machine label, then it snaps */}
        <div style={{position: 'absolute', left: 40, top: 150}}>
          <Ruler frame={frame} fps={fps} values={TEXT.rulerValues} changes={stages} appear={L(M.ruler)} snapAt={L(M.rulerSnap)} height={620} caption={TEXT.rulerCaption} />
        </div>
        {/* MONSTER TIDDY */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {TEXT.monsterWords.map((wd, i) => {
            const at = words[i];
            if (frame < at) return null;
            const p = spring({frame: frame - at, fps, config: {damping: 11, stiffness: 260, mass: 0.7}});
            const g = Math.exp(-(frame - at) / 5) + (random(`mg-${i}-${Math.floor(frame / 2)}`) > 0.75 ? 0.35 : 0);
            const jit = impactShake(frame, [at], 18, 6);
            return (
              <div key={wd} style={{transform: `translate(${jit.x}px, ${jit.y}px) scale(${2.4 - 1.4 * p})`, opacity: Math.min(1, p * 2), marginTop: i ? -40 : 0}}>
                <MetalText text={wd} fontSize={i ? 330 : 220} frame={frame} glitch={g} glow={1} gradient={RED_TEXT} glowColor="255,20,10" letterSpacing={0.05} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(80,0,0,0) 30%, rgba(40,0,0,0.75) 100%)'}} />
      <AbsoluteFill style={{background: MONSTER.red, opacity: Math.max(fromRed * 0.8, ...stages.map((s) => flashAt(frame, s, 5) * 0.45), flashAt(frame, roar, 7) * 0.6), mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
