import {
  nasdaqMonthlyCandles,
  nasdaqMonthlyPriceSummary,
  type NasdaqMonthlyCandle,
} from './generated/nasdaqMonthlyCandles';

export type NasdaqCandle = NasdaqMonthlyCandle;

export type NasdaqEventTone = 'bullish' | 'bearish' | 'neutral';

export type NasdaqEvent = {
  date: string;
  title: string;
  detail: string;
  image: {
    alt: string;
    credit: string;
    sourceUrl: string;
    src: string;
  };
  stat: string;
  tone: NasdaqEventTone;
};

export const nasdaqVideoConfig = {
  title: 'Nasdaq Volatility History',
  subtitle: 'Monthly NASDAQ Composite candles, 1980-2026',
  durationInSeconds: 60,
  visibleCandles: 72,
  dataSource:
    'NASDAQ Composite monthly OHLC table parsed into data/nasdaq-history/nasdaq_monthly_prices.csv',
  eventSource: 'data/nasdaq-history/nasdaq_volatility_events_1980_present.md',
  latestDataNote:
    '2026-06 is a partial month in the local source table and should be rechecked before publishing.',
  summary: nasdaqMonthlyPriceSummary,
} as const;

export const nasdaqCandles: NasdaqCandle[] = nasdaqMonthlyCandles.map((candle, index) => {
  const hasFlatBody = candle.open === candle.close;
  const previousClose = index > 0 ? nasdaqMonthlyCandles[index - 1]?.close : null;

  if (!hasFlatBody) {
    return candle;
  }

  const estimatedOpen =
    previousClose && previousClose > 0
      ? previousClose
      : Number.isFinite(candle.changePercent) && candle.changePercent > -99.9
        ? candle.close / (1 + candle.changePercent / 100)
        : candle.open;

  return {
    ...candle,
    high: Math.max(estimatedOpen, candle.high, candle.close),
    low: Math.min(estimatedOpen, candle.low, candle.close),
    open: estimatedOpen,
  };
});

export const nasdaqEvents: NasdaqEvent[] = [
  {
    date: '1987-10-01',
    title: 'Black Monday',
    detail:
      'Program trading, portfolio insurance, and vanishing liquidity turned October into the Nasdaq Composite\'s worst month in this data set.',
    image: {
      alt: 'Trading floor at the New York Stock Exchange',
      credit: 'Carol M. Highsmith / Library of Congress, public domain',
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:No_Known_Restrictions_Trading_Floor,_New_York_Stock_Exchange_(Highsmith_LOC)_(6718386525).jpg',
      src: 'projects/nasdaq-history/images/events/black-monday.jpg',
    },
    stat: '-27.23% month | 57.33% intramonth range',
    tone: 'bearish',
  },
  {
    date: '1998-08-01',
    title: 'Russia Default and LTCM',
    detail:
      'A sovereign debt shock and a highly levered hedge fund crisis pushed global risk appetite sharply lower.',
    image: {
      alt: 'Russian five-ruble banknote from the 1997 series',
      credit: 'Bank of Russia note image, public domain under Russian official symbol rules',
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:Banknote_5_rubles_(1997)_front.jpg',
      src: 'projects/nasdaq-history/images/events/russia-ltcm.jpg',
    },
    stat: '-19.93% month',
    tone: 'bearish',
  },
  {
    date: '2000-04-01',
    title: 'Dot-Com Break',
    detail:
      'After the March 2000 peak, internet and telecom valuations began to reset violently.',
    image: {
      alt: 'Nasdaq MarketSite in Times Square',
      credit: 'ajay_suresh, CC BY 2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nasdaq_MarketSite_(51494550508).jpg',
      src: 'projects/nasdaq-history/images/events/dot-com.jpg',
    },
    stat: '-15.57% month | 41.70% intramonth range',
    tone: 'bearish',
  },
  {
    date: '2001-09-01',
    title: '9/11 Market Shock',
    detail:
      'Markets reopened into a damaged economy and an already fragile post-bubble technology sector.',
    image: {
      alt: 'World Trade Center rubble after the September 11 attacks',
      credit: 'Bri Rodriguez / FEMA, public domain',
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:FEMA_-_5691_-_Photograph_by_Bri_Rodriguez_taken_on_09-27-2001_in_New_York.jpg',
      src: 'projects/nasdaq-history/images/events/nine-eleven.jpg',
    },
    stat: '-16.98% month',
    tone: 'bearish',
  },
  {
    date: '2008-10-01',
    title: 'Credit Freeze',
    detail:
      'The global financial crisis moved from bank balance sheets into every risk market.',
    image: {
      alt: 'Lehman Brothers office signage in Times Square',
      credit: 'David Shankbone, CC BY-SA 3.0',
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:Lehman_Brothers_Times_Square_by_David_Shankbone.jpg',
      src: 'projects/nasdaq-history/images/events/credit-freeze.jpg',
    },
    stat: '-17.73% month | 39.46% intramonth range',
    tone: 'bearish',
  },
  {
    date: '2020-03-01',
    title: 'COVID Crash',
    detail:
      'Circuit breakers, liquidity stress, and pandemic uncertainty produced one of the fastest modern selloffs.',
    image: {
      alt: 'CDC illustration of SARS-CoV-2',
      credit: 'Alissa Eckert, MS; Dan Higgins, MAM / CDC, public domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:SARS-CoV-2_without_background.png',
      src: 'projects/nasdaq-history/images/events/covid-crash.png',
    },
    stat: '-10.12% month | 36.78% intramonth range',
    tone: 'bearish',
  },
  {
    date: '2020-04-01',
    title: 'Policy Rebound',
    detail:
      'Massive central-bank and fiscal support turned the panic into a sudden relief rally.',
    image: {
      alt: 'Federal Reserve Eccles Building in 1937',
      credit: 'Board of Governors of the Federal Reserve System, public domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:US_Federal_Reserve_Eccles_Building_1937.jpg',
      src: 'projects/nasdaq-history/images/events/policy-rebound.jpg',
    },
    stat: '+15.45% month',
    tone: 'bullish',
  },
  {
    date: '2022-04-01',
    title: 'Rate Shock',
    detail:
      'Inflation and aggressive Fed tightening compressed growth-stock valuations.',
    image: {
      alt: 'Federal Reserve building in Washington, D.C.',
      credit: 'DerFussi, CC BY-SA 3.0',
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:Washington_D.C._-_Federal_Reserve_0001-0003_HDR.jpg',
      src: 'projects/nasdaq-history/images/events/rate-shock.jpg',
    },
    stat: '-13.26% month',
    tone: 'bearish',
  },
  {
    date: '2025-04-01',
    title: 'Tariff Whipsaw',
    detail:
      'The monthly close looked calm, but the path inside the month showed a deep shock and fast rebound.',
    image: {
      alt: 'Container ship at the Port of Los Angeles',
      credit: 'Downtowngal, CC BY-SA 4.0',
      sourceUrl:
        'https://commons.wikimedia.org/wiki/File:Container_ship_NYK_Themis_at_the_Port_of_Los_Angeles.jpg',
      src: 'projects/nasdaq-history/images/events/tariff-whipsaw.jpg',
    },
    stat: '+0.85% month | 19.84% intramonth range',
    tone: 'neutral',
  },
];

export const nasdaqEventIndexByDate = new Map(
  nasdaqEvents.map((event) => [
    event.date,
    Math.max(
      0,
      nasdaqCandles.findIndex((candle) => candle.time >= event.date),
    ),
  ]),
);
