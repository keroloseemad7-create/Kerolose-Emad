import {getStaticFiles, staticFile} from 'remotion';
import timeline from './timeline.json';
import views from './views.json';

export const T = timeline;
export const TEXT = timeline.text;
export const EV = timeline.events;
export const V2 = {
  fps: timeline.fps,
  width: timeline.width,
  height: timeline.height,
  frames: Math.round(timeline.durationSec * timeline.fps),
};

const SPB = 60 / timeline.music.bpm; // seconds per beat
/** Beat length in frames (15 at 120 BPM / 30 fps). */
export const BEAT_F = SPB * timeline.fps;

/** Seconds -> frame, snapped to the nearest beat of the music grid. */
export const snap = (sec: number) => {
  const beats = Math.round((sec - timeline.music.offsetSec) / SPB);
  return Math.round((timeline.music.offsetSec + beats * SPB) * timeline.fps);
};
/** Seconds -> frame without snapping (for things that must not move, like scene cuts). */
export const sec = (s: number) => Math.round(s * timeline.fps);

export type SceneId = keyof typeof timeline.scenes;
export const scene = (id: SceneId) => {
  const [a, b] = timeline.scenes[id];
  return {from: sec(a), duration: sec(b) - sec(a)};
};
/** Absolute event time (seconds) -> frame local to a scene, beat-snapped. */
export const local = (id: SceneId, s: number) => snap(s) - scene(id).from;

/** ./public/music.mp3 wins if present, otherwise the generated soundtrack. */
export const musicSrc = () => {
  const files = getStaticFiles().map((f) => f.name);
  const name = files.includes(timeline.music.external) ? timeline.music.external : timeline.music.generated;
  return files.includes(name) ? staticFile(name) : null;
};

export type ViewName = keyof typeof views;
export const VIEWS = views as Record<ViewName, {w: number; h: number; eyes?: number[][]; eyeR?: number}>;
export const viewSrc = (n: ViewName | 'front_lava') => staticFile(`views/hd/${n}.png`);
export const viewW = (n: ViewName, height: number) => (height * VIEWS[n].w) / VIEWS[n].h;

export const MONSTER = {
  red: '#ff1a1a',
  deepRed: '#7a0000',
  blood: '#3a0303',
  smoke: '#0b0909',
  lava: '#ff5a14',
};
export const PASTEL = ['#ffb3d1', '#b8f2e6', '#cdb4ff', '#ffe6a7', '#a7d8ff'];
