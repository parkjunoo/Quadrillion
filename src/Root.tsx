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
import { iosAndroidUsageVideoConfig } from './projects/ios-vs-android/config';
import { IosVsAndroidUsageVideo } from './projects/ios-vs-android/IosVsAndroidUsageVideo';
import { onlineGameConcurrencyVideoConfig } from './projects/online-game-concurrency/config';
import { OnlineGameConcurrencyVideo } from './projects/online-game-concurrency/OnlineGameConcurrencyVideo';
import { timeUse24hVideoConfig } from './projects/time-use-24h/config';
import { TimeUse24hVideo } from './projects/time-use-24h/TimeUse24hVideo';
import { exchangeRateRaceVideoConfig } from './projects/exchange-rate-race/config';
import { ExchangeRateRaceVideo } from './projects/exchange-rate-race/ExchangeRateRaceVideo';
import { memeTrends2025VideoConfig } from './projects/meme-trends-2025/config';
import { MemeTrends2025Video } from './projects/meme-trends-2025/MemeTrends2025Video';
import { countryStockMarketCapVideoConfig } from './projects/country-stock-market-cap/config';
import { CountryStockMarketCapVideo } from './projects/country-stock-market-cap/CountryStockMarketCapVideo';
import { worldCupHostingCostsVideoConfig } from './projects/world-cup-hosting-costs/config';
import { WorldCupHostingCostsVideo } from './projects/world-cup-hosting-costs/WorldCupHostingCostsVideo';
import { fifaRevenueSourcesVideoConfig } from './projects/fifa-revenue-sources/config';
import { FifaRevenueSourcesVideo } from './projects/fifa-revenue-sources/FifaRevenueSourcesVideo';
import { aiModelBenchmarkVideoConfig } from './projects/ai-model-benchmark-race/config';
import { AiCompanyBenchmarkLineRaceVideo } from './projects/ai-model-benchmark-race/AiCompanyBenchmarkLineRaceVideo';

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
      <Composition
        id="IosVsAndroidUsage"
        component={IosVsAndroidUsageVideo}
        durationInFrames={iosAndroidUsageVideoConfig.durationInSeconds * iosAndroidUsageVideoConfig.fps}
        fps={iosAndroidUsageVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="OnlineGameConcurrency"
        component={OnlineGameConcurrencyVideo}
        durationInFrames={onlineGameConcurrencyVideoConfig.durationInSeconds * onlineGameConcurrencyVideoConfig.fps}
        fps={onlineGameConcurrencyVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="TimeUse24h"
        component={TimeUse24hVideo}
        durationInFrames={timeUse24hVideoConfig.durationInSeconds * timeUse24hVideoConfig.fps}
        fps={timeUse24hVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="ExchangeRateRace"
        component={ExchangeRateRaceVideo}
        durationInFrames={exchangeRateRaceVideoConfig.durationInSeconds * exchangeRateRaceVideoConfig.fps}
        fps={exchangeRateRaceVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="MemeTrends2025"
        component={MemeTrends2025Video}
        durationInFrames={memeTrends2025VideoConfig.durationInSeconds * memeTrends2025VideoConfig.fps}
        fps={memeTrends2025VideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="WorldCupHostingCosts"
        component={WorldCupHostingCostsVideo}
        durationInFrames={worldCupHostingCostsVideoConfig.durationInSeconds * worldCupHostingCostsVideoConfig.fps}
        fps={worldCupHostingCostsVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="CountryStockMarketCap"
        component={CountryStockMarketCapVideo}
        durationInFrames={countryStockMarketCapVideoConfig.durationInSeconds * countryStockMarketCapVideoConfig.fps}
        fps={countryStockMarketCapVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="FifaRevenueSources"
        component={FifaRevenueSourcesVideo}
        durationInFrames={fifaRevenueSourcesVideoConfig.durationInSeconds * fifaRevenueSourcesVideoConfig.fps}
        fps={fifaRevenueSourcesVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
      <Composition
        id="AIModelBenchmarkRace"
        component={AiCompanyBenchmarkLineRaceVideo}
        durationInFrames={aiModelBenchmarkVideoConfig.durationInSeconds * aiModelBenchmarkVideoConfig.fps}
        fps={aiModelBenchmarkVideoConfig.fps}
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
      />
    </>
  );
};
