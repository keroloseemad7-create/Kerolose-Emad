import React from 'react';
import {interpolate, spring} from 'remotion';
import {Sparks} from '../../components/Sparks';
import {BEBAS, clamp, COLORS, EASE} from '../../theme';
import {MONSTER} from '../config';

const LINE_H = 96;
const JUNK = ['7 m', '45 cm', '3 km', '88 m', '0.5 m', '9 m', '650 m', '12 cm'];

/**
 * The "~20 cm" size-reference ruler. Each entry in `changes` is the frame its value lands;
 * the label spins like a slot machine into it. At `snapAt` the ruler breaks in half.
 */
export const Ruler: React.FC<{
  frame: number;
  fps: number;
  values: string[];
  changes: number[]; // frames for values[1..]
  appear: number;
  snapAt: number;
  height: number;
  caption: string;
}> = ({frame, fps, values, changes, appear, snapAt, height, caption}) => {
  // reel = v0, junk..., v1, junk..., v2 ...
  const reel: string[] = [values[0]];
  const targets = [0];
  values.slice(1).forEach((v, i) => {
    for (let k = 0; k < 6; k++) reel.push(JUNK[(i * 3 + k) % JUNK.length]);
    reel.push(v);
    targets.push(reel.length - 1);
  });
  let pos = 0;
  let speed = 0;
  changes.forEach((c, i) => {
    const p = interpolate(frame, [c - 12, c], [0, 1], {...clamp, easing: EASE.inOut});
    pos += p * (targets[i + 1] - targets[i]);
    if (frame > c - 12 && frame < c) speed = 1;
  });
  const lastChange = [...changes].reverse().find((c) => frame >= c);
  const bounce = lastChange !== undefined ? spring({frame: frame - lastChange, fps, config: {damping: 8, stiffness: 300}}) : 1;
  const offset = -pos * LINE_H + (1 - bounce) * 24;

  const show = spring({frame: frame - appear, fps, config: {damping: 13, stiffness: 140}});
  const broken = frame >= snapAt;
  const sp = broken ? spring({frame: frame - snapAt, fps, config: {damping: 20, stiffness: 50}}) : 0;
  const fall = broken ? (frame - snapAt) : 0;
  const stageIdx = changes.filter((c) => frame >= c).length;
  const hot = stageIdx >= 2;

  const half = (top: boolean) => {
    const tr = broken
      ? top
        ? `translate(${-120 * sp}px, ${-80 * sp + 0.5 * fall * fall * 0.6}px) rotate(${-38 * sp}deg)`
        : `translate(${90 * sp}px, ${60 * sp + 0.5 * fall * fall * 0.9}px) rotate(${27 * sp}deg)`
      : '';
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: top ? 'polygon(0 0, 100% 0, 100% 48%, 60% 52%, 30% 47%, 0 51%)' : 'polygon(0 51%, 30% 47%, 60% 52%, 100% 48%, 100% 100%, 0 100%)',
          transform: tr,
          transformOrigin: '50% 50%',
        }}
      >
        <svg width={120} height={height} style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <linearGradient id={`rul-${top}`} x1="0" x2="1">
              <stop offset="0" stopColor="#f6d35a" />
              <stop offset="0.5" stopColor="#ffe9a0" />
              <stop offset="1" stopColor="#c99a1e" />
            </linearGradient>
          </defs>
          <rect x={30} y={0} width={60} height={height} rx={6} fill={`url(#rul-${top})`} stroke="#5a4405" strokeWidth={3} />
          {Array.from({length: 41}).map((_, i) => {
            const y = 10 + (i / 40) * (height - 20);
            const long = i % 5 === 0;
            return <line key={i} x1={30} y1={y} x2={30 + (long ? 30 : 14)} y2={y} stroke="#3a2c03" strokeWidth={long ? 3 : 1.5} />;
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{position: 'relative', width: 120, height, opacity: show, transform: `translateX(${(1 - show) * 200}px)`}}>
      {half(true)}
      {half(false)}
      {/* label: slot-machine window */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: height / 2 - 120,
          opacity: broken ? 1 - Math.min(1, sp * 1.4) : 1,
          transform: broken ? `translateY(${fall * 4}px) rotate(${fall * 0.8}deg)` : undefined,
        }}
      >
        <div style={{fontFamily: BEBAS, fontSize: 30, letterSpacing: '0.3em', color: COLORS.steel, marginBottom: 6, whiteSpace: 'nowrap'}}>{caption}</div>
        <div
          style={{
            width: 360,
            height: LINE_H,
            overflow: 'hidden',
            background: 'rgba(8,8,10,0.85)',
            border: `3px solid ${hot ? MONSTER.red : COLORS.sparkHot}`,
            boxShadow: `0 0 ${hot ? 40 : 14}px ${hot ? MONSTER.red : 'rgba(255,200,120,0.5)'}`,
            borderRadius: 10,
            position: 'relative',
          }}
        >
          <div style={{transform: `translateY(${offset}px)`, filter: speed ? 'blur(3px)' : undefined}}>
            {reel.map((v, i) => (
              <div
                key={i}
                style={{
                  height: LINE_H,
                  lineHeight: `${LINE_H}px`,
                  textAlign: 'center',
                  fontFamily: BEBAS,
                  fontSize: 84,
                  color: hot ? '#ffdede' : '#fff6e0',
                  textShadow: hot ? `0 0 18px ${MONSTER.red}` : undefined,
                }}
              >
                {i === 0 ? `~${v}` : v}
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.7))'}} />
        </div>
      </div>
      {broken && (
        <div style={{position: 'absolute', left: -480, top: height / 2 - 540}}>
          <Sparks
            frame={frame}
            width={1080}
            height={1080}
            bursts={[{frame: snapAt, x: 540, y: 540, count: 50, power: 26, seed: 'ruler-snap'}]}
          />
        </div>
      )}
    </div>
  );
};
