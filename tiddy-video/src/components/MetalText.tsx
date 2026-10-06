import React from 'react';
import {random} from 'remotion';
import {ANTON} from '../theme';

const METAL =
  'linear-gradient(180deg, #ffffff 0%, #d7dce2 30%, #8b929c 48%, #4b5059 52%, #c3c9d0 68%, #f2f4f7 84%, #7d848e 100%)';

type Props = {
  text: string;
  fontSize: number;
  frame: number;
  /** 0..1 chromatic aberration + slice glitch */
  glitch?: number;
  /** -1 = off, 0..1 progress of the specular sweep */
  shine?: number;
  glow?: number;
  letterSpacing?: number;
  fontFamily?: string;
  style?: React.CSSProperties;
};

export const MetalText: React.FC<Props> = ({
  text,
  fontSize,
  frame,
  glitch = 0,
  shine = -1,
  glow = 0,
  letterSpacing = 0.02,
  fontFamily = ANTON,
  style,
}) => {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    fontFamily,
    fontSize,
    lineHeight: 1,
    letterSpacing: `${letterSpacing}em`,
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  };
  const g = glitch;
  const split = g * 26;
  const slices = g > 0.02 ? 7 : 0;
  return (
    <div style={{position: 'relative', display: 'inline-block', ...style}}>
      {/* sizing ghost */}
      <div style={{...base, position: 'relative', visibility: 'hidden'}}>{text}</div>
      {g > 0.02 && (
        <>
          <div style={{...base, color: '#ff1f4b', mixBlendMode: 'screen', transform: `translate(${-split}px, ${split * 0.15}px)`, opacity: 0.9}}>
            {text}
          </div>
          <div style={{...base, color: '#1fe4ff', mixBlendMode: 'screen', transform: `translate(${split}px, ${-split * 0.15}px)`, opacity: 0.9}}>
            {text}
          </div>
        </>
      )}
      <div
        style={{
          ...base,
          backgroundImage: METAL,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: `drop-shadow(0 6px 0 rgba(0,0,0,0.55))${glow > 0 ? ` drop-shadow(0 0 ${30 * glow}px rgba(61,87,196,${0.9 * glow})) drop-shadow(0 0 ${8 * glow}px rgba(255,255,255,${0.5 * glow}))` : ''}`,
          clipPath: slices ? 'inset(0 0 100% 0)' : undefined,
        }}
      >
        {text}
      </div>
      {Array.from({length: slices}).map((_, i) => {
        const top = (i / slices) * 100;
        const bottom = 100 - ((i + 1) / slices) * 100;
        const off = (random(`slice-${i}-${Math.floor(frame / 2)}`) - 0.5) * 120 * g;
        return (
          <div
            key={i}
            style={{
              ...base,
              backgroundImage: METAL,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              clipPath: `inset(${top}% 0 ${bottom}% 0)`,
              transform: `translateX(${off}px)`,
            }}
          >
            {text}
          </div>
        );
      })}
      {shine >= 0 && shine <= 1 && (
        <div
          style={{
            ...base,
            backgroundImage:
              'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.95) 49%, rgba(255,244,220,1) 50%, rgba(255,255,255,0.95) 51%, rgba(255,255,255,0) 60%)',
            backgroundSize: '300% 100%',
            backgroundPosition: `${100 - shine * 100}% 0`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            mixBlendMode: 'screen',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};
