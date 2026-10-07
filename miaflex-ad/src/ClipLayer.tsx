import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import config from './config.json';
import { Clip, FPS, FRAMES_PER_BEAT, H, W, srcFrameAt, trackAt } from './timeline';
import { easeOut, lerp, seg } from './fx';

const G = config.grade;
const GRADE = `contrast(${G.contrast}) saturate(${G.saturate}) brightness(${G.brightness})`;
const SRC = staticFile(config.video.source);

/** Transform for transitions: punch-in on every cut + constant slow push + whip / zoom-through in & out. */
const transitionStyle = (c: Clip, f: number, outType?: string) => {
  let s = 1.06 + 0.09 * easeOut(seg(f, 0, 5)) + 0.035 * (f / c.dur); // punch 1.0->1.15 feel + slow zoom
  let tx = 0, blur = 0;
  if (c.in === 'whip') { const k = 1 - easeOut(seg(f, 0, 4)); tx += k * W * 0.12; s *= 1 + k * 0.3; blur += k * 30; }
  if (c.in === 'zoom') { const k = 1 - easeOut(seg(f, 0, 6)); s *= 1 + k * 0.45; blur += k * 22; }
  const left = c.dur - f;
  if (outType === 'whip') { const k = seg(4 - left, 0, 3); tx -= k * k * W * 0.12; s *= 1 + k * k * 0.3; blur += k * 30; }
  if (outType === 'zoom') { const k = seg(5 - left, 0, 4); s *= 1 + k * k * 0.7; blur += k * 20; }
  return { s, tx, blur };
};

const Video: React.FC<{ trim: number; rate: number; style: React.CSSProperties }> = ({ trim, rate, style }) => (
  <OffthreadVideo src={SRC} trimBefore={Math.round(trim)} playbackRate={rate} muted style={{ width: W, height: H, objectFit: 'cover', ...style }} />
);

/** Sharp graded bottle over a blurred, darkened copy of the street. */
const Separated: React.FC<{ c: Clip; trim: number; rate: number; srcF: number; still?: string }> = ({ c, trim, rate, srcF, still }) => {
  const tr = trackAt(srcF);
  const lw = (tr.x1 - tr.x0) * W, lh = (tr.y1 - tr.y0) * H;
  const cx = tr.cx * W, cy = tr.cy * H - lh * 0.25;
  const rx = lw * 1.9 + 170, ry = lh * 2.1 + 260;
  const mask = `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, #000 55%, transparent 100%)`;
  const bg: React.CSSProperties = { filter: `${GRADE} blur(${G.bgBlurPx}px) brightness(${G.bgDarken})` };
  const fg: React.CSSProperties = { filter: GRADE, WebkitMaskImage: mask, maskImage: mask };
  const layer = (style: React.CSSProperties) =>
    still ? <Img src={staticFile(still)} style={{ width: W, height: H, objectFit: 'cover', ...style }} />
          : <Video trim={trim} rate={rate} style={style} />;
  return (
    <>
      <AbsoluteFill>{layer(bg)}</AbsoluteFill>
      <AbsoluteFill>{layer(fg)}</AbsoluteFill>
      {/* cool, clean whites */}
      <AbsoluteFill style={{ background: `rgba(205,220,255,${G.coolTint})`, mixBlendMode: 'soft-light' }} />
    </>
  );
};

export const ClipLayer: React.FC<{ c: Clip; outType?: string; children?: (f: number, srcF: number) => React.ReactNode }> = ({ c, outType, children }) => {
  const f = useCurrentFrame();
  const { s, tx, blur } = transitionStyle(c, f, outType);
  const rate = c.speed ?? 1;
  let body: React.ReactNode;
  let srcF = srcFrameAt(c, f);

  const fz = (c as { freeze?: { atSrc: number; afterBeats: number; holdBeats: number } }).freeze;
  if (fz) {
    const at = Math.round(fz.afterBeats * FRAMES_PER_BEAT);
    const hold = Math.round(fz.holdBeats * FRAMES_PER_BEAT);
    const atSrcF = fz.atSrc * FPS;
    if (f >= at && f < at + hold) srcF = atSrcF;
    else if (f >= at + hold) srcF = atSrcF + (f - at - hold) * rate;
    const glow = seg(f, at, at + 4) * (1 - seg(f, at + hold, at + hold + 6));
    const pulse = 0.75 + 0.25 * Math.sin((f - at) * 0.5);
    body = (
      <>
        <Sequence durationInFrames={at}><Separated c={c} trim={c.srcStart * FPS} rate={rate} srcF={srcF} /></Sequence>
        <Sequence from={at} durationInFrames={hold}>
          <Separated c={c} trim={0} rate={1} srcF={atSrcF} still="still_reveal.jpg" />
          {/* purple glow outline traced from the bottle cutout */}
          <AbsoluteFill style={{ opacity: glow }}>
            <Img src={staticFile('cut_upright.png')} style={{ width: W, height: H, objectFit: 'cover',
              filter: `${GRADE} drop-shadow(0 0 ${6 * pulse}px ${config.palette.glow}) drop-shadow(0 0 ${22 * pulse}px ${config.palette.glow}) drop-shadow(0 0 ${60 * pulse}px ${config.palette.purple})` }} />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={at + hold}><Separated c={c} trim={atSrcF} rate={rate} srcF={srcF} /></Sequence>
      </>
    );
  } else {
    body = <Separated c={c} trim={c.srcStart * FPS} rate={rate} srcF={srcF} />;
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
      <AbsoluteFill style={{ transform: `translateX(${tx}px) scale(${s})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        {body}
        {children?.(f, srcF)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const lerpPoint = (pts: { t: number; x: number; y: number }[], t: number) => {
  if (t <= pts[0].t) return pts[0];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (t <= b.t) { const k = (t - a.t) / (b.t - a.t); return { t, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
  }
  return pts[pts.length - 1];
};
