import React from 'react';
import {AbsoluteFill, Audio, Sequence} from 'remotion';
import {FilmGrain, Vignette} from '../components/Overlays';
import {COLORS} from '../theme';
import {musicSrc, scene, SceneId} from './config';
import {ColdOpen} from './scenes/ColdOpen';
import {Ride} from './scenes/Ride';
import {Turnaround} from './scenes/Turnaround';
import {Trigger} from './scenes/Trigger';
import {Monster} from './scenes/Monster';
import {Shrink} from './scenes/Shrink';
import {BackOnBike} from './scenes/BackOnBike';
import {EndCard} from './scenes/EndCard';

const SCENES: [SceneId, string, React.FC][] = [
  ['coldOpen', '1 · Cold Open', ColdOpen],
  ['turnaround', '2 · The Turnaround', Turnaround],
  ['ride', '3 · The Ride', Ride],
  ['trigger', '4 · The Trigger', Trigger],
  ['monster', '5 · Monster Mode', Monster],
  ['shrink', '6 · The Shrink', Shrink],
  ['backOnBike', '7 · Back on the Bike', BackOnBike],
  ['endCard', '8 · End Card', EndCard],
];

export const TiddyV2: React.FC = () => {
  const music = musicSrc();
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      {music && <Audio src={music} />}
      {SCENES.map(([id, name, C]) => {
        const s = scene(id);
        return (
          <Sequence key={id} name={name} from={s.from} durationInFrames={s.duration}>
            <C />
          </Sequence>
        );
      })}
      <Vignette strength={0.8} />
      <FilmGrain opacity={0.1} />
    </AbsoluteFill>
  );
};
