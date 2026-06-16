import { Composition } from 'remotion';
import { BitcoinHistoryVideo } from './projects/bitcoin-history/BitcoinHistoryVideo';
import { bitcoinVideoConfig } from './projects/bitcoin-history/data';
import { chartVideoConfig } from './projects/fifa-ranking-race/config';
import { ShortsVideo } from './projects/fifa-ranking-race/ShortsVideo';
import { nasdaqVideoConfig } from './projects/nasdaq-history/data';
import { NasdaqHistoryVideo } from './projects/nasdaq-history/NasdaqHistoryVideo';
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from './shared/video';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="QuadrillionShort"
        component={ShortsVideo}
        durationInFrames={chartVideoConfig.durationInSeconds * VIDEO_FPS}
        fps={VIDEO_FPS}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="BitcoinHistory"
        component={BitcoinHistoryVideo}
        durationInFrames={bitcoinVideoConfig.durationInSeconds * VIDEO_FPS}
        fps={VIDEO_FPS}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="NasdaqHistory"
        component={NasdaqHistoryVideo}
        durationInFrames={nasdaqVideoConfig.durationInSeconds * VIDEO_FPS}
        fps={VIDEO_FPS}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
    </>
  );
};
