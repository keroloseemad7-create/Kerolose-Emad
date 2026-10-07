import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ANTON, BEBAS, clamp, EASE, flashAt} from '../../theme';
import {Hearts, Smoke, Sparkles} from '../components/FX';
import {MonsterTiddy, MonsterWorld} from '../components/Monster';
import {GroundShadow, View} from '../components/View';
import {EV, local, PASTEL, scene, TEXT, VIEWS, viewW} from '../config';
import {STAGE_H} from './Monster';

const SMALL_H = 200;

export const Shrink: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = scene('shrink');
  const L = (s: number) => local('shrink', s);
  const pop = L(EV.shrink.pop);
  const sit = L(EV.shrink.sit);
  const oops = L(EV.shrink.oops);

  const groundY = 1760;
  const feetY = groundY + 70;
  const redness = interpolate(frame, [0, pop + 20, sit + 30], [1, 0.35, 0], {...clamp, easing: EASE.inOut});
  const shrinkP = spring({frame: frame - pop, fps, config: {damping: 10, stiffness: 320, mass: 0.6}});
  const h = STAGE_H[3] + (SMALL_H - STAGE_H[3]) * shrinkP;
  const wobble = frame < pop ? Math.sin(frame * 0.9) * 1.5 * (frame / pop) : 0;
  const squash = frame >= pop ? 1 + 0.25 * Math.sin((frame - pop) * 1.1) * Math.exp(-(frame - pop) / 6) : 1;
  const m = interpolate(frame, [pop, pop + 14], [1, 0], {...clamp, easing: EASE.out});

  // camera pushes in on tiny Tiddy, background goes soft (depth of field)
  const zoomP = interpolate(frame, [sit - 4, sit + 26], [0, 1], {...clamp, easing: EASE.inOut});
  const zoom = 1 + 2.3 * zoomP;
  const lift = -430 * zoomP;
  const sitP = spring({frame: frame - sit, fps, config: {damping: 9, stiffness: 200}});

  const angledH = (SMALL_H * VIEWS.angled.h) / VIEWS.front.h;
  const popStar = interpolate(frame, [pop, pop + 4, pop + 12], [0, 1, 0], {...clamp, easing: EASE.out});
  const popRing = interpolate(frame, [pop, pop + 16], [0, 1], {...clamp, easing: EASE.out});
  const oopsChars = Math.floor(interpolate(frame, [oops, oops + 14], [0, TEXT.oops.length], clamp));
  const oopsBounce = spring({frame: frame - oops, fps, config: {damping: 8, stiffness: 180}});
  const idle = Math.sin(frame / 14) * 3;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transformOrigin: `540px ${feetY}px`, transform: `translateY(${lift}px) scale(${zoom})`}}>
        <MonsterWorld frame={frame + 900} groundY={groundY} redness={redness} cityBlur={zoomP * 5} />
        {/* pastel bokeh once the danger is gone */}
        <AbsoluteFill style={{opacity: zoomP}}>
          {PASTEL.map((c, i) => (
            <div
              key={c}
              style={{
                position: 'absolute',
                left: 120 + i * 190 + Math.sin(frame / 30 + i) * 20,
                top: 1380 + (i % 2) * 120 + Math.cos(frame / 25 + i) * 15,
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: c,
                opacity: 0.35,
                filter: 'blur(10px)',
              }}
            />
          ))}
        </AbsoluteFill>
        <GroundShadow x={540} y={feetY - 4} w={(frame < sit ? viewW('front', h) : viewW('angled', angledH)) * 1.05} opacity={0.75} squash={0.13} />
        {frame < sit ? (
          <div
            style={{
              position: 'absolute',
              left: 540 - viewW('front', h) / 2,
              top: feetY - h,
              transformOrigin: '50% 100%',
              transform: `rotate(${wobble}deg) scale(${2 - squash}, ${squash})`,
            }}
          >
            <MonsterTiddy height={h} m={m} eyes={m} frame={frame} flare={false} />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: 540 - viewW('angled', angledH) / 2,
              top: feetY - angledH + idle * 0.2,
              transformOrigin: '50% 100%',
              transform: `scale(${1.15 - 0.15 * sitP}, ${0.85 + 0.15 * sitP})`,
            }}
          >
            <View name="angled" height={angledH} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
          </div>
        )}
        {/* smoke blowing away */}
        <Smoke frame={frame + 300} emitter={() => ({x: 100, y: 600, w: 880, h: 1100})} from={0} to={300} rate={3} life={45} size={260} rise={2} wind={18} color="#3a2420" opacity={0.6} fadeOut={interpolate(frame, [0, pop + 6], [1, 0], clamp)} seed="clear" />
        {/* cartoon POP */}
        {popRing > 0 && popRing < 1 && (
          <div style={{position: 'absolute', left: 540 - 260, top: feetY - 300, width: 520, height: 520, borderRadius: '50%', border: `${18 * (1 - popRing)}px solid #fff`, transform: `scale(${0.2 + popRing})`, opacity: 1 - popRing}} />
        )}
        {popStar > 0 && (
          <div style={{position: 'absolute', left: 540 - 230, top: feetY - 420, width: 460, height: 300, transform: `scale(${0.6 + 0.6 * popStar}) rotate(-8deg)`, opacity: popStar}}>
            <svg width={460} height={300} viewBox="-230 -150 460 300" style={{position: 'absolute'}}>
              <polygon
                points={Array.from({length: 24})
                  .map((_, i) => {
                    const a = (i / 24) * Math.PI * 2;
                    const r = i % 2 ? 110 : 200;
                    return `${Math.cos(a) * r},${Math.sin(a) * r * 0.65}`;
                  })
                  .join(' ')}
                fill="#fff6a8"
                stroke="#ff8fb8"
                strokeWidth={8}
              />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ANTON, fontSize: 120, color: '#ff5fa2', WebkitTextStroke: '4px #fff'}}>POP!</div>
          </div>
        )}
      </AbsoluteFill>
      <Sparkles frame={frame} start={pop} count={34} area={{x: 60, y: 500, w: 960, h: 1100}} />
      <Hearts frame={frame} start={oops + 10} x={540} y={1050} count={14} />
      {/* ...oops */}
      {frame >= oops && (
        <div
          style={{
            position: 'absolute',
            left: 640,
            top: 700,
            fontFamily: BEBAS,
            fontSize: 110,
            letterSpacing: '0.08em',
            color: '#ffd6e8',
            textShadow: '0 0 20px rgba(255,150,200,0.8), 0 6px 0 rgba(120,40,80,0.6)',
            transform: `rotate(-6deg) scale(${0.7 + 0.3 * oopsBounce})`,
            transformOrigin: '0% 100%',
            whiteSpace: 'nowrap',
          }}
        >
          {TEXT.oops.slice(0, oopsChars)}
        </div>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: flashAt(frame, pop, 4) * 0.7}} />
      <AbsoluteFill style={{background: '#000', opacity: interpolate(frame, [duration - 4, duration], [0, 0.6], clamp)}} />
    </AbsoluteFill>
  );
};
