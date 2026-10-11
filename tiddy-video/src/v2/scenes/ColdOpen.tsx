import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MetalText} from '../../components/MetalText';
import {ANTON, clamp, COLORS, EASE, flashAt, impactShake} from '../../theme';
import {LightRays} from '../components/FX';
import {EV, local, scene, TEXT, viewSrc, VIEWS, ViewName} from '../config';

const SHOTS: {name: ViewName; focus: [number, number]; drift: [number, number]}[] = [
  {name: 'texture', focus: [0.5, 0.5], drift: [-30, -60]},
  {name: 'chest', focus: [0.45, 0.45], drift: [40, -30]},
  {name: 'foot', focus: [0.6, 0.6], drift: [-40, 20]},
  {name: 'chest', focus: [0.5, 0.5], drift: [0, -40]},
];

/** Full-bleed macro plate with a slow push-in and shallow depth of field. */
const Macro: React.FC<{name: ViewName; t: number; focus: [number, number]; drift: [number, number]; grade: number}> = ({name, t, focus, drift, grade}) => {
  const {w, h} = VIEWS[name];
  const cover = Math.max(1080 / w, 1920 / h);
  const push = 1.04 + 0.16 * t;
  const W = w * cover * push;
  const H = h * cover * push;
  const left = 540 - W * focus[0] + drift[0] * t;
  const top = 960 - H * focus[1] + drift[1] * t;
  const img = (blur: number, mask?: string) => (
    <Img
      src={viewSrc(name)}
      style={{
        position: 'absolute',
        left,
        top,
        width: W,
        height: H,
        filter: `blur(${blur}px) brightness(${0.62 - grade * 0.1}) contrast(1.25) saturate(0.8) sepia(0.2)`,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
  return (
    <AbsoluteFill>
      {img(14)}
      {img(0, 'radial-gradient(ellipse 48% 34% at 50% 50%, #000 40%, transparent 100%)')}
    </AbsoluteFill>
  );
};

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = scene('coldOpen');
  const shots = EV.coldOpen.shots.map((s) => local('coldOpen', s));
  const hits = EV.coldOpen.hits.map((s) => local('coldOpen', s));
  const idx = shots.filter((s) => frame >= s).length - 1;
  const shotStart = shots[idx];
  const shotEnd = idx + 1 < shots.length ? shots[idx + 1] : duration;
  const t = interpolate(frame, [shotStart, shotEnd], [0, 1], {...clamp, easing: EASE.inOut});
  const shake = impactShake(frame, hits, 26, 5);
  const fadeIn = interpolate(frame, [0, 14], [1, 0], {...clamp, easing: EASE.out});
  const flash = Math.max(...hits.map((h) => flashAt(frame, h, 6)));
  const outro = interpolate(frame, [duration - 6, duration], [0, 1], {...clamp, easing: EASE.in});

  const words = TEXT.coldOpenWords;
  const sizes = [400, 300, 250];

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `${shake.transform} scale(${1 + outro * 0.25})`}}>
        <Macro name={SHOTS[idx].name} t={t} focus={SHOTS[idx].focus} drift={SHOTS[idx].drift} grade={idx === 3 ? 1 : 0} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,5,6,0.6) 0%, rgba(5,5,6,0) 30%, rgba(5,5,6,0) 60%, rgba(5,5,6,0.85) 100%)'}} />
        <LightRays frame={frame} intensity={0.9} />
        {/* stacked lock-up: one word per heavy hit */}
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0}}>
          {words.map((w, i) => {
            const at = hits[i];
            if (frame < at) return null;
            const p = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 260, mass: 0.7}});
            const glitch = Math.exp(-(frame - at) / 4);
            const last = i === words.length - 1;
            return (
              <div key={w} style={{transform: `scale(${2.2 - 1.2 * p})`, opacity: Math.min(1, p * 2), marginTop: i ? -20 : 0}}>
                {last ? (
                  <div
                    style={{
                      fontFamily: ANTON,
                      fontSize: sizes[i],
                      lineHeight: 1,
                      letterSpacing: '0.06em',
                      color: COLORS.spark,
                      textShadow: `0 0 50px rgba(255,138,31,0.8), 0 0 12px rgba(255,220,180,0.8), 0 10px 0 ${COLORS.ember}`,
                    }}
                  >
                    {w}
                  </div>
                ) : (
                  <MetalText text={w} fontSize={sizes[i]} frame={frame} glitch={glitch} glow={0.4} letterSpacing={0.04} />
                )}
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(255,240,220,0.9), rgba(255,138,31,0.35) 35%, rgba(0,0,0,0) 70%)', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
      <AbsoluteFill style={{background: '#fff4e2', opacity: outro}} />
    </AbsoluteFill>
  );
};
