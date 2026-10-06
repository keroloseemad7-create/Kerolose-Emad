import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {CutFlash, FilmGrain, Vignette} from './components/Overlays';
import {Build} from './scenes/Build';
import {Details} from './scenes/Details';
import {EndCard} from './scenes/EndCard';
import {Jump} from './scenes/Jump';
import {Reveal} from './scenes/Reveal';
import {Ride} from './scenes/Ride';
import {COLORS, SCENES} from './theme';

export const TiddyVideo: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.black}}>
    {/* 120 BPM soundtrack synthesized by music/make_music.py, every hit on the scene beats */}
    <Audio src={staticFile('music.wav')} />
    <Sequence name="1 · The Build" from={SCENES.build.from} durationInFrames={SCENES.build.duration}>
      <Build />
    </Sequence>
    <Sequence name="2 · The Reveal" from={SCENES.reveal.from} durationInFrames={SCENES.reveal.duration}>
      <Reveal />
    </Sequence>
    <Sequence name="3 · The Ride" from={SCENES.ride.from} durationInFrames={SCENES.ride.duration}>
      <Ride />
    </Sequence>
    <Sequence name="4 · The Details" from={SCENES.details.from} durationInFrames={SCENES.details.duration}>
      <Details />
    </Sequence>
    <Sequence name="5 · The Jump" from={SCENES.jump.from} durationInFrames={SCENES.jump.duration}>
      <Jump />
    </Sequence>
    <Sequence name="6 · End Card" from={SCENES.end.from} durationInFrames={SCENES.end.duration}>
      <EndCard />
    </Sequence>
    {/* global finishing: vignette, film grain, flash on beat-aligned hard cuts */}
    <Vignette />
    <FilmGrain />
    <CutFlash at={[SCENES.ride.from, SCENES.details.from]} />
  </AbsoluteFill>
);
