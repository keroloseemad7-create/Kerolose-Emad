import React from 'react';
import { Composition } from 'remotion';
import { Ad } from './Ad';
import { DURATION, FPS, H, W } from './timeline';

export const Root: React.FC = () => (
  <Composition id="MiaflexAd" component={Ad} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
