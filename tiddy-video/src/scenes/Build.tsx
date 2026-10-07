import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Bearing, Gear, Screw, Spring} from '../components/Parts';
import {Burst, Sparks} from '../components/Sparks';
import {beat, clamp, COLORS, EASE, flashAt, impactShake} from '../theme';

const CX = 960;
const CY = 520;

// Impacts land exactly on beats 2..6 (frames 30..90); beat 7 is the final punch.
const IMPACTS = [beat(2), beat(3), beat(4), beat(5), beat(6)];
const FINAL = beat(7);
const FLY = 13; // frames of flight before each impact

type FlyIn = {from: [number, number]; to: [number, number]; impact: number; arc?: number; spin?: number};

const fly = (frame: number, fps: number, f: FlyIn) => {
  const p = interpolate(frame, [f.impact - FLY, f.impact], [0, 1], {...clamp, easing: EASE.slam});
  const x = f.from[0] + (f.to[0] - f.from[0]) * p;
  const y = f.from[1] + (f.to[1] - f.from[1]) * p - Math.sin(p * Math.PI) * (f.arc ?? 0);
  const pop = spring({frame: frame - f.impact, fps, config: {damping: 9, stiffness: 260, mass: 0.6}});
  const scale = frame < f.impact ? 0.8 + 0.2 * p : 1.18 - 0.18 * pop;
  const spinIn = (1 - p) * (f.spin ?? 0);
  return {x, y, scale, spinIn, visible: frame >= f.impact - FLY, landed: frame >= f.impact};
};

export const Build: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const bigGear = fly(frame, fps, {from: [-700, -520], to: [0, 0], impact: IMPACTS[0], arc: 120, spin: -720});
  const leftGear = fly(frame, fps, {from: [-1350, 260], to: [-318, 70], impact: IMPACTS[1], arc: 160, spin: 540});
  const rightGear = fly(frame, fps, {from: [1350, -200], to: [318, 70], impact: IMPACTS[2], arc: 140, spin: -540});
  const bearing = fly(frame, fps, {from: [0, 900], to: [0, 0], impact: IMPACTS[3], arc: 0, spin: 900});
  const springP = fly(frame, fps, {from: [1100, 700], to: [0, 300], impact: IMPACTS[4], arc: 60, spin: 0});
  const screwA = fly(frame, fps, {from: [-1300, -900], to: [0, 0], impact: IMPACTS[4], spin: 0});
  const screwB = fly(frame, fps, {from: [1300, -900], to: [0, 0], impact: IMPACTS[4], spin: 0});

  // continuous gear drive once the big gear lands (eased spin-up)
  const drive = interpolate(frame, [IMPACTS[0], IMPACTS[0] + 30], [0, 1], {...clamp, easing: EASE.inOut});
  const bigRot = drive * (frame - IMPACTS[0]) * 1.6;

  // final punch: zoom through the bearing into the next scene
  const zoom = interpolate(frame, [FINAL + 3, beat(8)], [1, 9], {...clamp, easing: EASE.in});
  const finalPop = spring({frame: frame - FINAL, fps, config: {damping: 10, stiffness: 220}});
  const assemblyScale = (frame >= FINAL ? 1.08 - 0.08 * finalPop : 1) * zoom;

  const shake = impactShake(frame, [...IMPACTS, FINAL], 16, 5);

  const springStretch = springP.landed
    ? 1 + 0.25 * Math.exp(-(frame - IMPACTS[4]) / 5) * Math.cos((frame - IMPACTS[4]) * 1.2)
    : 1;

  // sparks: ambient flicker before the build + bursts on every impact
  const bursts: Burst[] = [];
  for (let i = 0; i < 9; i++) {
    const f = Math.floor(random(`amb-f-${i}`) * 34);
    bursts.push({
      frame: f,
      x: 300 + random(`amb-x-${i}`) * 1320,
      y: 250 + random(`amb-y-${i}`) * 560,
      count: 10,
      power: 10,
      life: 18,
      angle: -Math.PI / 2,
      spread: 2.2,
    });
  }
  const impactPoints: [number, number][] = [
    [CX - 80, CY + 120],
    [CX - 200, CY + 80],
    [CX + 200, CY + 80],
    [CX, CY + 140],
    [CX, CY + 300],
  ];
  IMPACTS.forEach((t, i) => {
    bursts.push({frame: t, x: impactPoints[i][0], y: impactPoints[i][1], count: 36, power: 26, life: 26, seed: `imp-${i}`});
  });
  bursts.push({frame: FINAL, x: CX, y: CY, count: 70, power: 40, life: 30, seed: 'final'});

  const flash = Math.max(...IMPACTS.map((t) => flashAt(frame, t, 6) * 0.55), flashAt(frame, FINAL, 8));
  const whiteout = interpolate(frame, [beat(8) - 5, beat(8)], [0, 1], {...clamp, easing: EASE.in});
  const builtCount = IMPACTS.filter((t) => frame >= t).length;

  const place = (x: number, y: number, size: number, extra = ''): React.CSSProperties => ({
    position: 'absolute',
    left: CX + x - size / 2,
    top: CY + y - size / 2,
    transform: extra,
  });

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      {/* builds-up workshop glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 45% at 50% 52%, rgba(61,87,196,${0.05 + builtCount * 0.05}) 0%, rgba(20,21,24,${0.3 + builtCount * 0.1}) 45%, rgba(5,5,6,1) 80%)`,
        }}
      />
      <AbsoluteFill style={{transform: shake.transform}}>
        <AbsoluteFill style={{transform: `scale(${assemblyScale})`, transformOrigin: `${CX}px ${CY}px`}}>
          {/* navy accent ring */}
          {bigGear.landed && (
            <div
              style={{
                position: 'absolute',
                left: CX - 330,
                top: CY - 330,
                width: 660,
                height: 660,
                borderRadius: '50%',
                border: `3px solid ${COLORS.navyBright}`,
                boxShadow: `0 0 40px ${COLORS.navyBright}, inset 0 0 40px ${COLORS.navy}`,
                opacity: interpolate(frame, [IMPACTS[0], IMPACTS[0] + 12], [0, 0.7], {...clamp, easing: EASE.out}),
                transform: `scale(${interpolate(frame, [IMPACTS[0], IMPACTS[0] + 20], [0.6, 1], {...clamp, easing: EASE.out})})`,
              }}
            />
          )}
          {/* crossed screws (behind) */}
          {screwA.visible && (
            <div style={{position: 'absolute', left: CX - 450 + screwA.x, top: CY - 45 + screwA.y, transform: 'rotate(38deg)'}}>
              <Screw id="sa" length={900} />
            </div>
          )}
          {screwB.visible && (
            <div style={{position: 'absolute', left: CX - 450 + screwB.x, top: CY - 45 + screwB.y, transform: 'rotate(142deg)'}}>
              <Screw id="sb" length={900} />
            </div>
          )}
          {leftGear.visible && (
            <div style={place(leftGear.x, leftGear.y, 270, `scale(${leftGear.scale})`)}>
              <Gear id="gl" size={270} teeth={12} spokes={4} rotation={-bigRot * 2 + leftGear.spinIn + 15} />
            </div>
          )}
          {rightGear.visible && (
            <div style={place(rightGear.x, rightGear.y, 270, `scale(${rightGear.scale})`)}>
              <Gear id="gr" size={270} teeth={12} spokes={4} rotation={-bigRot * 2 + rightGear.spinIn + 15} />
            </div>
          )}
          {bigGear.visible && (
            <div style={place(bigGear.x, bigGear.y, 520, `scale(${bigGear.scale})`)}>
              <Gear id="gb" size={520} teeth={24} spokes={6} rotation={bigRot + bigGear.spinIn} />
            </div>
          )}
          {bearing.visible && (
            <div style={place(bearing.x, bearing.y, 300, `scale(${bearing.scale})`)}>
              <Bearing id="bb" size={300} rotation={-bigRot * 1.5 + bearing.spinIn} />
            </div>
          )}
          {springP.visible && (
            <div style={place(springP.x, springP.y, 560, `scale(${springP.scale}) rotate(${(1 - Math.min(1, springP.scale)) * 30}deg)`)}>
              <Spring id="sp" width={560} coils={14} stretch={springStretch} />
            </div>
          )}
        </AbsoluteFill>
        <Sparks bursts={bursts} frame={frame} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,240,210,1) 0%, rgba(255,138,31,0.6) 18%, rgba(255,75,18,0) 45%)`,
          opacity: flash,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill style={{background: '#fff4e2', opacity: whiteout}} />
    </AbsoluteFill>
  );
};
