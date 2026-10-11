import React from 'react';
import {AbsoluteFill, Img, random} from 'remotion';
import {City} from '../../components/City';
import {MONSTER, viewSrc, VIEWS, viewW} from '../config';
import {Cars} from './Cars';
import {LensFlare} from './FX';

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[]) => `rgb(${c.join(',')})`;

/** Extreme close-up of face.png with optional red eye ignition. focus lerps toward the eyes as zoom grows. */
export const FaceCloseup: React.FC<{zoom: number; glow: number; frame: number; grade?: number}> = ({zoom, glow, frame, grade = 0}) => {
  const {w, h, eyes = [], eyeR = 0.04} = VIEWS.face;
  const cover = Math.max(1080 / w, 1920 / h);
  const W = w * cover * zoom;
  const H = h * cover * zoom;
  // push toward his right eye (image left): at extreme zoom one eye fills the frame
  const mid = [eyes[0][0] + 0.03, eyes[0][1] - 0.01];
  const k = Math.min(1, Math.pow((zoom - 1) / 1.3, 0.8));
  const fx = 0.5 + (mid[0] - 0.5) * k;
  const fy = 0.5 + (mid[1] - 0.5) * k;
  const left = 540 - W * fx;
  const top = 960 - H * fy;
  const flick = glow > 0 ? 0.85 + 0.15 * random(`ef-${frame}`) : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <Img
        src={viewSrc('face')}
        style={{
          position: 'absolute',
          left,
          top,
          width: W,
          height: H,
          filter: `brightness(${0.8 - 0.35 * grade - 0.2 * glow}) contrast(${1.15 + 0.2 * glow}) saturate(${0.75 - 0.6 * Math.max(grade, glow)})`,
        }}
      />
      {/* red grade creeping in */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(120,0,0,${0.15 * glow}), rgba(40,0,0,${0.75 * glow}) 75%)`, mixBlendMode: 'multiply'}} />
      {glow > 0.01 &&
        eyes.map(([ex, ey], i) => {
          const x = left + ex * W;
          const y = top + ey * H;
          const r = eyeR * W * 1.1;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: x - r,
                  top: y - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 45% 40%, #fff 0%, #ffd0c0 ${12 * glow}%, ${MONSTER.red} ${45}%, rgba(120,0,0,0.9) 75%, rgba(0,0,0,0) 100%)`,
                  opacity: Math.min(1, glow * 1.4) * flick,
                  boxShadow: `0 0 ${60 * glow}px ${30 * glow}px rgba(255,20,10,${0.7 * glow})`,
                  mixBlendMode: 'screen',
                }}
              />
              <LensFlare x={x} y={y} intensity={glow * flick} frame={frame} />
            </React.Fragment>
          );
        })}
    </AbsoluteFill>
  );
};

/** Low-angle city at the monster's feet. redness 0 = calm dusk, 1 = apocalypse. */
export const MonsterWorld: React.FC<{frame: number; groundY: number; redness: number; panic?: number; cityBlur?: number}> = ({frame, groundY, redness, panic = 0, cityBlur = 0}) => {
  const sky0 = rgb(mix([18, 16, 40], [6, 0, 0], redness));
  const sky1 = rgb(mix([70, 54, 110], [60, 6, 6], redness));
  const sky2 = rgb(mix([255, 170, 160], [160, 20, 10], redness));
  const pulse = 0.8 + 0.2 * Math.sin(frame / 6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky0} 0%, ${sky1} ${(groundY / 1920) * 70}%, ${sky2} ${(groundY / 1920) * 100}%)`}} />
      <div style={{position: 'absolute', left: -200, right: -200, top: groundY - 420, height: 560, background: `radial-gradient(ellipse 50% 50% at 50% 70%, rgba(255,40,20,${0.45 * redness * pulse}), rgba(255,40,20,0) 70%)`}} />
      <div style={{position: 'absolute', inset: 0, filter: cityBlur ? `blur(${cityBlur}px)` : undefined}}>
        <City seed="mfar" offset={300} baseline={groundY - 30} color={rgb(mix([52, 40, 80], [34, 6, 8], redness))} minH={200} maxH={560} minW={40} maxW={110} width={1080} height={1920} />
        <City
          seed="mmid"
          offset={900}
          baseline={groundY + 8}
          color={rgb(mix([24, 18, 40], [12, 3, 4], redness))}
          windowColor={redness > 0.5 ? '#ff4a2a' : '#ffd9a0'}
          minH={120}
          maxH={380}
          minW={70}
          maxW={170}
          width={1080}
          height={1920}
        />
      </div>
      {/* ground plane */}
      <div style={{position: 'absolute', left: 0, right: 0, top: groundY, bottom: 0, background: `linear-gradient(180deg, ${rgb(mix([60, 50, 70], [40, 12, 10], redness))} 0%, #0a0606 40%, #030202 100%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={groundY + 6} width={1080} height={40} fill="#141012" />
        {Array.from({length: 9}).map((_, i) => (
          <line key={i} x1={540} y1={groundY} x2={540 + (i - 4) * 520} y2={1920} stroke={redness > 0.5 ? '#5a1010' : '#3a3550'} strokeWidth={2} opacity={0.5} />
        ))}
      </svg>
      <Cars frame={frame} y={groundY + 34} scale={1.1} panic={panic} />
    </AbsoluteFill>
  );
};

/** Tiddy front view with monster treatment: m = 0 normal .. 1 full monster (dark, red rim, lava stripes, glowing eyes). */
export const MonsterTiddy: React.FC<{height: number; m: number; eyes: number; frame: number; flare?: boolean; eyesOnly?: boolean}> = ({height, m, eyes, frame, flare = true, eyesOnly = false}) => {
  const w = viewW('front', height);
  const {eyes: eyePts = [], eyeR = 0.03} = VIEWS.front;
  const lavaPulse = 0.7 + 0.3 * Math.sin(frame / 4) + 0.1 * random(`lp-${frame}`);
  return (
    <div style={{position: 'relative', width: w, height}}>
      <Img
        src={viewSrc('front')}
        style={{
          width: w,
          height,
          display: 'block',
          visibility: eyesOnly ? 'hidden' : undefined,
          filter: `brightness(${1 - 0.62 * m}) saturate(${1 - 0.85 * m}) contrast(${1 + 0.35 * m}) drop-shadow(0 0 ${2 + 6 * m}px rgba(255,40,20,${0.9 * m})) drop-shadow(0 0 ${40 * m}px rgba(255,0,0,${0.55 * m}))`,
        }}
      />
      {m > 0.01 && !eyesOnly && (
        <Img
          src={viewSrc('front_lava')}
          style={{position: 'absolute', left: 0, top: 0, width: w, height, opacity: m * lavaPulse, mixBlendMode: 'screen', filter: `drop-shadow(0 0 ${height / 160}px #ff3010) brightness(1.4)`}}
        />
      )}
      {eyes > 0.01 &&
        eyePts.map(([ex, ey], i) => {
          const r = eyeR * w * 1.3;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: ex * w - r,
                  top: ey * height - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, #fff 0%, #ffb0a0 18%, ${MONSTER.red} 45%, rgba(255,0,0,0) 100%)`,
                  boxShadow: `0 0 ${r * 3}px ${r}px rgba(255,20,10,${0.7 * eyes})`,
                  opacity: eyes,
                }}
              />
              {flare && (
                <div style={{position: 'absolute', left: ex * w - 540, top: ey * height - 960, width: 1080, height: 1920, pointerEvents: 'none', transform: `scale(${Math.max(0.25, height / 1600)})`}}>
                  <LensFlare x={540} y={960} intensity={eyes * 0.8} frame={frame} />
                </div>
              )}
            </React.Fragment>
          );
        })}
    </div>
  );
};
