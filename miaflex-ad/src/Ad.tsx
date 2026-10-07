import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import config from './config.json';
import beatgrid from './data/beatgrid.json';
import { CLIPS, FPS, FRAMES_PER_BEAT, H, IMPACT_FRAMES, W, beatFrame, clipById, trackAt } from './timeline';
import { ClipLayer, lerpPoint } from './ClipLayer';
import { Callout, EndCard, Finish, Hook, Psst, RevealTitle, SprayBurst } from './Graphics';
import { shakeAt } from './fx';

const P = config.palette;

const Flashes: React.FC = () => {
  const f = useCurrentFrame();
  let white = 0, purple = 0;
  for (const c of CLIPS) {
    const a = f - c.from;
    if (a < -1 || a > 2) continue;
    const v = [0.55, 1, 0.65, 0.25][a + 1];
    if (c.in === 'flash-white') white = Math.max(white, v);
    if (c.in === 'flash-purple') purple = Math.max(purple, v);
  }
  return (
    <>
      {white > 0 && <AbsoluteFill style={{ background: '#fff', opacity: white }} />}
      {purple > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle, ${P.lavender}, ${P.purple})`, opacity: purple }} />}
    </>
  );
};

const Shaker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const { x, y, r } = shakeAt(f, IMPACT_FRAMES);
  return <AbsoluteFill style={{ transform: `translate(${x}px,${y}px) rotate(${r}deg)` }}>{children}</AbsoluteFill>;
};

export const Ad: React.FC = () => {
  const reveal = clipById('reveal');
  const fz = reveal.freeze!;
  const revealTitleFrom = reveal.from + Math.round(fz.afterBeats * FRAMES_PER_BEAT);
  const sprayClip = clipById(config.spray.clip);
  const burstLocal = Math.round(((config.spray.burstAtSrc - sprayClip.srcStart) * FPS) / (sprayClip.speed ?? 1));
  const music = beatgrid.source === 'music.mp3' ? 'music.mp3' : 'music_generated.wav';

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shaker>
        {CLIPS.map((c, i) => {
          const outType = CLIPS[i + 1]?.in;
          if (c.id === 'endcard') return null;
          const callout = config.callouts.find((k) => k.clip === c.id);
          return (
            <Sequence key={c.id} from={c.from} durationInFrames={c.dur}>
              <ClipLayer c={c} outType={outType}>
                {(f, srcF) => {
                  if (callout) {
                    const t = trackAt(srcF), h = (t.y1 - t.y0) * H;
                    const anchor = { x: t.cx * W + callout.anchor.ox * h, y: t.cy * H + callout.anchor.oy * h };
                    return <Callout f={f - 4} dur={c.dur - 4} anchor={anchor} box={callout.box} lines={callout.lines} icon={callout.icon} />;
                  }
                  if (c.id === config.spray.clip) {
                    const n = lerpPoint(config.spray.nozzle, srcF / FPS);
                    const x = n.x * W, y = n.y * H;
                    return (<><SprayBurst f={f - burstLocal} x={x} y={y} /><Psst f={f - burstLocal - 2} x={x + 250} y={y - 300} /></>);
                  }
                  return null;
                }}
              </ClipLayer>
            </Sequence>
          );
        })}
        <Sequence from={0} durationInFrames={beatFrame(4)}><Hook beatF={beatFrame} /></Sequence>
        <Sequence from={revealTitleFrom} durationInFrames={reveal.from + reveal.dur - revealTitleFrom}>
          <RevealTitle dur={reveal.from + reveal.dur - revealTitleFrom} />
        </Sequence>
      </Shaker>
      <Sequence from={clipById('endcard').from}><EndCard dur={clipById('endcard').dur} /></Sequence>
      <Flashes />
      <Finish />
      <Audio src={staticFile(music)} volume={0.85} />
      <Audio src={staticFile('sfx.wav')} volume={1} />
    </AbsoluteFill>
  );
};
