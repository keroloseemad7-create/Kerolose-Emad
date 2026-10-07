import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.85}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength * 0.55}) 75%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

export const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`gx-${frame}`) * 512);
  const oy = Math.floor(random(`gy-${frame}`) * 512);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: -512,
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundSize: '512px 512px',
          transform: `translate(${ox}px, ${oy}px)`,
        }}
      />
      {/* keep image cached by the renderer */}
      <Img src={staticFile('grain.png')} style={{display: 'none'}} />
    </AbsoluteFill>
  );
};

/** Short white/orange flash used on hard cuts. */
export const CutFlash: React.FC<{at: number[]; color?: string}> = ({at, color = '#fff3e0'}) => {
  const frame = useCurrentFrame();
  let o = 0;
  for (const t of at) {
    const d = frame - t;
    if (d >= 0 && d < 8) o = Math.max(o, Math.exp(-d / 1.8));
  }
  if (o < 0.01) return null;
  return <AbsoluteFill style={{background: color, opacity: o * 0.85, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};
