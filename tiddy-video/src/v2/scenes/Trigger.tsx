import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, EASE} from '../../theme';
import {ShockRing} from '../components/FX';
import {FaceCloseup} from '../components/Monster';
import {EV, local} from '../config';
import {Ride} from './Ride';

/** Zoom curve shared with Monster so the push into the eyes is continuous across the cut. */
export const TRIGGER_ZOOM_END = 2.3;

export const Trigger: React.FC = () => {
  const frame = useCurrentFrame();
  const face = local('trigger', EV.trigger.face);
  const beats = EV.trigger.heartbeats.map((s) => local('trigger', s));

  if (frame < face) {
    const p = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: EASE.out});
    return (
      <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
        <AbsoluteFill style={{filter: `grayscale(${p}) brightness(${1 - 0.35 * p}) contrast(${1 + 0.2 * p})`, transform: `scale(${1 + 0.05 * p})`}}>
          <Ride frozen />
        </AbsoluteFill>
        <ShockRing x={540} y={1100} p={interpolate(frame, [0, 12], [0, 1], {...clamp, easing: EASE.out})} color="rgba(220,235,255,0.9)" size={2200} />
        <AbsoluteFill style={{background: '#dfe8ff', opacity: interpolate(frame, [0, 4], [0.6, 0], clamp), mixBlendMode: 'screen'}} />
      </AbsoluteFill>
    );
  }
  const t = interpolate(frame, [face, 60], [0, 1], clamp);
  const zoom = 1.05 + (TRIGGER_ZOOM_END - 1.05) * Math.pow(t, 1.6);
  let thump = 0;
  for (const b of beats) if (frame >= b) thump = Math.max(thump, Math.exp(-(frame - b) / 4));
  const tease = frame >= beats[1] && frame < beats[1] + 3 ? 0.35 : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.035 * thump})`}}>
        <FaceCloseup zoom={zoom} glow={tease} frame={frame} grade={1} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 45% at 50% 47%, rgba(0,0,0,0) 30%, rgba(0,0,0,${0.75 + 0.2 * thump}) 100%)`}} />
      <AbsoluteFill style={{background: '#000', opacity: interpolate(frame, [face, face + 6], [1, 0], {...clamp, easing: EASE.out})}} />
    </AbsoluteFill>
  );
};
