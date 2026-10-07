import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {HBlur} from '../components/HBlur';
import {Tiddy} from '../components/Tiddy';
import {ANTON, BEBAS, BEAT, clamp, COLORS, EASE, flashAt, impactShake, TIDDY_RIDE} from '../theme';

const SHOT = BEAT * 4; // 2s per shot

type ShotDef = {
  focus: {x: number; y: number};
  zoom: number;
  words: string[];
  label: string;
  side: 'left' | 'right';
};

const SHOTS: ShotDef[] = [
  {focus: TIDDY_RIDE.frontWheel, zoom: 2.15, words: ['BUILT', 'FROM', 'SCRAP.'], label: 'PART 01 // BALL-BEARING WHEEL', side: 'left'},
  {focus: TIDDY_RIDE.spring, zoom: 2.6, words: ['BORN', 'TO', 'RIDE.'], label: 'PART 02 // COIL-SPRING SUSPENSION', side: 'right'},
  {focus: TIDDY_RIDE.face, zoom: 2.0, words: ['TOO CUTE', 'TO', 'STOP.'], label: 'PART 03 // THE LEGEND HIMSELF', side: 'left'},
];

const PANEL = {w: 960, h: 900};

const Shot: React.FC<{def: ShotDef; f: number; fps: number; index: number}> = ({def, f, fps, index}) => {
  const left = def.side === 'left';
  const panelX = left ? 70 : 1920 - 70 - PANEL.w;
  const panelY = 90;

  // diagonal wipe in, punch-in zoom with overshoot, slow push after
  const wipe = interpolate(f, [0, 8], [0, 1], {...clamp, easing: EASE.out});
  const punch = spring({frame: f, fps, config: {damping: 12, stiffness: 170, mass: 0.7}});
  const push = interpolate(f, [8, SHOT], [0, 0.1], {...clamp, easing: EASE.inOut});
  const z = def.zoom * (0.62 + 0.38 * punch + push);
  const exit = interpolate(f, [SHOT - 6, SHOT], [0, 1], {...clamp, easing: EASE.in});

  const imgH = TIDDY_RIDE.h * z;
  const imgX = PANEL.w / 2 - def.focus.x * z;
  const imgY = PANEL.h / 2 - def.focus.y * z;

  const clip = left
    ? `polygon(0 0, ${wipe * 108}% 0, ${wipe * 100}% 100%, 0 100%)`
    : `polygon(${100 - wipe * 100}% 0, 100% 0, 100% 100%, ${100 - wipe * 108}% 100%)`;
  const skew = 'polygon(7% 0, 100% 0, 93% 100%, 0 100%)';

  const reticle = interpolate(f, [4, 16], [0, 1], {...clamp, easing: EASE.out});
  const textX = left ? panelX + PANEL.w + 40 : 90;
  const shiftOut = (left ? 1 : -1) * exit * 260;

  return (
    <AbsoluteFill style={{filter: exit > 0 ? 'url(#details-whip)' : undefined, transform: `translateX(${shiftOut}px)`, opacity: 1 - exit * 0.6}}>
      {/* panel frame */}
      <div style={{position: 'absolute', left: panelX - 12, top: panelY - 12, width: PANEL.w + 24, height: PANEL.h + 24, clipPath: clip}}>
        <div style={{position: 'absolute', inset: 0, clipPath: skew, background: `linear-gradient(135deg, ${COLORS.spark}, ${COLORS.ember} 40%, ${COLORS.navyBright})`}} />
      </div>
      <div style={{position: 'absolute', left: panelX, top: panelY, width: PANEL.w, height: PANEL.h, clipPath: clip}}>
        <div style={{position: 'absolute', inset: 0, clipPath: skew, overflow: 'hidden', background: `radial-gradient(circle at 50% 50%, ${COLORS.graphite}, ${COLORS.black})`}}>
          <div style={{position: 'absolute', left: imgX, top: imgY}}>
            <Tiddy height={imgH} filter="contrast(1.12) saturate(1.05)" />
          </div>
          {/* lens light streak */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,240,220,0.18) 45%, rgba(255,255,255,0) 55%)',
              transform: `translateX(${interpolate(f, [0, SHOT], [-500, 500], {...clamp, easing: EASE.inOut})}px)`,
              mixBlendMode: 'screen',
            }}
          />
          {/* reticle */}
          <svg width={PANEL.w} height={PANEL.h} style={{position: 'absolute', inset: 0, opacity: reticle}}>
            <g transform={`translate(${PANEL.w / 2}, ${PANEL.h / 2}) rotate(${f * 1.5}) scale(${1.3 - 0.3 * reticle})`}>
              <circle r={330} fill="none" stroke={COLORS.sparkHot} strokeWidth={3} strokeDasharray="40 22" opacity={0.8} />
              <circle r={360} fill="none" stroke="#fff" strokeWidth={1} opacity={0.35} />
            </g>
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`translate(${PANEL.w / 2}, ${PANEL.h / 2}) rotate(${a})`}>
                <line x1={0} y1={-390} x2={0} y2={-345} stroke="#fff" strokeWidth={3} opacity={0.8} />
              </g>
            ))}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 90,
              bottom: 40,
              fontFamily: BEBAS,
              fontSize: 34,
              letterSpacing: '0.18em',
              color: COLORS.steelLight,
              background: 'rgba(5,5,6,0.7)',
              padding: '6px 16px',
              borderLeft: `5px solid ${COLORS.spark}`,
              opacity: reticle,
              transform: `translateX(${(1 - reticle) * -40}px)`,
              whiteSpace: 'nowrap',
            }}
          >
            {def.label}
          </div>
        </div>
      </div>
      {/* kinetic typography: one word per beat */}
      <div style={{position: 'absolute', left: textX, top: 170, width: 1920 - PANEL.w - 200, textAlign: left ? 'left' : 'right'}}>
        <div style={{fontFamily: BEBAS, fontSize: 40, letterSpacing: '0.4em', color: COLORS.navyBright, marginBottom: 10, opacity: wipe}}>
          0{index + 1} / 03
        </div>
        {def.words.map((w, i) => {
          const t = i * BEAT;
          const p = spring({frame: f - t, fps, config: {damping: 14, stiffness: 260, mass: 0.6}});
          const appear = f >= t ? 1 : 0;
          const last = i === def.words.length - 1;
          return (
            <div
              key={w}
              style={{
                fontFamily: ANTON,
                fontSize: last ? 210 : 165,
                lineHeight: 0.98,
                color: last ? COLORS.spark : COLORS.steelLight,
                textShadow: last ? `0 0 40px rgba(255,138,31,0.55), 0 8px 0 ${COLORS.ember}55` : '0 8px 0 rgba(0,0,0,0.6)',
                opacity: appear * Math.min(1, p * 1.5),
                transform: `translateX(${(1 - p) * (left ? 120 : -120)}px) scale(${1.5 - 0.5 * p})`,
                transformOrigin: left ? '0% 50%' : '100% 50%',
                whiteSpace: 'nowrap',
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Details: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shotIndex = Math.min(SHOTS.length - 1, Math.floor(frame / SHOT));
  const f = frame - shotIndex * SHOT;
  const wordImpacts = SHOTS.flatMap((_, s) => [0, 1, 2].map((w) => s * SHOT + w * BEAT));
  const shake = impactShake(frame, wordImpacts, 10, 4);
  const exit = interpolate(f, [SHOT - 6, SHOT], [0, 1], {...clamp, easing: EASE.in});
  const stripeShift = frame * 3;

  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <HBlur id="details-whip" amount={exit * 40} />
      {/* animated navy pinstripes */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(100deg, rgba(61,87,196,0.16) 0px, rgba(61,87,196,0.16) 2px, transparent 2px, transparent 34px)`,
          backgroundPosition: `${stripeShift}px 0`,
          opacity: 0.9,
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${SHOTS[shotIndex].side === 'left' ? '30%' : '70%'} 50%, rgba(29,44,102,0.45), rgba(5,5,6,0.95) 70%)`}} />
      <AbsoluteFill style={{transform: shake.transform}}>
        <Shot def={SHOTS[shotIndex]} f={f} fps={fps} index={shotIndex} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff3e0', opacity: flashAt(f, 0, 4) * 0.45, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
