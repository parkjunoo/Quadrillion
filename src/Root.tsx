import { Composition } from 'remotion';
import { BitcoinHistoryVideo } from './BitcoinHistoryVideo';
import { NasdaqHistoryVideo } from './NasdaqHistoryVideo';
import { ShortsVideo } from './ShortsVideo';
import { chartVideoConfig, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from './script';
import { bitcoinVideoConfig } from './bitcoinHistoryData';
import { nasdaqVideoConfig } from './nasdaqHistoryData';

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
