import config from './config.json';
import beatgrid from './data/beatgrid.json';
import track from './data/track.json';

export const FPS = config.video.fps;
export const W = config.video.width;
export const H = config.video.height;
export const BPM = beatgrid.bpm;
export const FRAMES_PER_BEAT = (FPS * 60) / BPM;
export const OFFSET_FRAMES = Math.round(beatgrid.offsetSec * FPS);

/** Global frame where a beat lands (cuts + impacts snap to this grid). */
export const beatFrame = (b: number) => OFFSET_FRAMES + Math.round(b * FRAMES_PER_BEAT);

export type Clip = (typeof config.clips)[number] & {
  index: number;
  startBeat: number;
  from: number; // global frame
  dur: number; // frames
  srcStart: number; // seconds into source
};

let beat = 0;
export const CLIPS: Clip[] = config.clips.map((c, index) => {
  const from = index === 0 ? 0 : beatFrame(beat);
  const dur = beatFrame(beat + c.beats) - from;
  let srcStart = (c as { src?: number }).src ?? 0;
  const fz = (c as { freeze?: { atSrc: number; afterBeats: number } }).freeze;
  if (fz) srcStart = fz.atSrc - (Math.round(fz.afterBeats * FRAMES_PER_BEAT) / FPS) * c.speed!;
  const clip = { ...c, index, startBeat: beat, from, dur, srcStart } as Clip;
  beat += c.beats;
  return clip;
});
export const TOTAL_BEATS = beat;
export const DURATION = beatFrame(TOTAL_BEATS);
export const clipById = (id: string) => CLIPS.find((c) => c.id === id)!;

/** Source frame shown at local frame f of a clip. */
export const srcFrameAt = (c: Clip, f: number) => c.srcStart * FPS + f * (c.speed ?? 1);

type T = { cx: number; cy: number; x0: number; x1: number; y0: number; y1: number };
const TF = track.frames as T[];
/** Tracked label box (0..1 of frame) at a source frame, linearly interpolated. */
export const trackAt = (srcFrame: number): T => {
  const i = Math.max(0, Math.min(TF.length - 2, Math.floor(srcFrame)));
  const k = Math.max(0, Math.min(1, srcFrame - i));
  const a = TF[i], b = TF[i + 1];
  const m = (x: number, y: number) => x + (y - x) * k;
  return { cx: m(a.cx, b.cx), cy: m(a.cy, b.cy), x0: m(a.x0, b.x0), x1: m(a.x1, b.x1), y0: m(a.y0, b.y0), y1: m(a.y1, b.y1) };
};

export const IMPACT_FRAMES = config.impactBeats.map(beatFrame);
