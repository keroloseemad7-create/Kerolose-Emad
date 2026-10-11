import {Composition} from 'remotion';
import {TiddyVideo} from './TiddyVideo';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './theme';
import {TiddyV2} from './v2/TiddyV2';
import {V2} from './v2/config';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Tiddy" component={TiddyVideo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TiddyV2" component={TiddyV2} durationInFrames={V2.frames} fps={V2.fps} width={V2.width} height={V2.height} />
  </>
);
