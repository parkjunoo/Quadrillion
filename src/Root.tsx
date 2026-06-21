import { Composition } from 'remotion';
import { BitcoinHistoryVideo } from './projects/bitcoin-history/BitcoinHistoryVideo';
import { bitcoinVideoConfig } from './projects/bitcoin-history/data';
import { FootballMarketValueVideo } from './projects/football-market-values/FootballMarketValueVideo';
import { marketValueVideoConfig } from './projects/football-market-values/config';
import { GlobalMarketCapVideo } from './projects/global-market-cap/GlobalMarketCapVideo';
import { globalMarketCapVideoConfig } from './projects/global-market-cap/config';
import { chartVideoConfig } from './projects/fifa-ranking-race/config';
import { ShortsVideo } from './projects/fifa-ranking-race/ShortsVideo';
import { nasdaqVideoConfig } from './projects/nasdaq-history/data';
import { NasdaqHistoryVideo } from './projects/nasdaq-history/NasdaqHistoryVideo';
import { qqqDcaVideoConfig } from './projects/qqq-dca/config';
import { QqqDcaVideo } from './projects/qqq-dca/QqqDcaVideo';
import { titleIntroConfig } from './projects/title-intro/config';
import { TitleIntroVideo } from './projects/title-intro/TitleIntroVideo';
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from './shared/video';
import { YoutubeSubscriberRaceVideo } from './projects/youtube-subscriber-race/YoutubeSubscriberRaceVideo';
import { youtubeSubscriberVideoConfig } from './projects/youtube-subscriber-race/config';
import { worldCupSquadValueVideoConfig } from './projects/world-cup-squad-values/config';
import { WorldCupSquadValuesVideo } from './projects/world-cup-squad-values/WorldCupSquadValuesVideo';
import { worldCupSquadMarketValueVideoConfig } from './projects/world-cup-squad-market-values/config';
import { WorldCupSquadMarketValuesVideo } from './projects/world-cup-squad-market-values/WorldCupSquadMarketValuesVideo';
import { worldCupRankTrackerConfig } from './projects/world-cup-rank-tracker/config';
import { WorldCupRankTrackerVideo } from './projects/world-cup-rank-tracker/WorldCupRankTrackerVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TitleIntro"
        component={TitleIntroVideo}
        durationInFrames={titleIntroConfig.durationInSeconds * titleIntroConfig.fps}
        fps={titleIntroConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
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
      <Composition
        id="QqqDca"
        component={QqqDcaVideo}
        durationInFrames={qqqDcaVideoConfig.durationInSeconds * qqqDcaVideoConfig.fps}
        fps={qqqDcaVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="FootballMarketValues"
        component={FootballMarketValueVideo}
        durationInFrames={marketValueVideoConfig.durationInSeconds * marketValueVideoConfig.fps}
        fps={marketValueVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="GlobalMarketCap"
        component={GlobalMarketCapVideo}
        durationInFrames={globalMarketCapVideoConfig.durationInSeconds * globalMarketCapVideoConfig.fps}
        fps={globalMarketCapVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="YoutubeSubscriberRace"
        component={YoutubeSubscriberRaceVideo}
        durationInFrames={youtubeSubscriberVideoConfig.durationInSeconds * youtubeSubscriberVideoConfig.fps}
        fps={youtubeSubscriberVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="WorldCupSquadValues"
        component={WorldCupSquadValuesVideo}
        durationInFrames={worldCupSquadValueVideoConfig.durationInSeconds * worldCupSquadValueVideoConfig.fps}
        fps={worldCupSquadValueVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="WorldCupSquadMarketValues"
        component={WorldCupSquadMarketValuesVideo}
        durationInFrames={worldCupSquadMarketValueVideoConfig.durationInSeconds * worldCupSquadMarketValueVideoConfig.fps}
        fps={worldCupSquadMarketValueVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="WorldCupRankTracker"
        component={WorldCupRankTrackerVideo}
        durationInFrames={worldCupRankTrackerConfig.durationInSeconds * worldCupRankTrackerConfig.fps}
        fps={worldCupRankTrackerConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
    </>
  );
};
