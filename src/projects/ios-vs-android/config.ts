import { iosVsAndroidAnnualCsv } from './generated/iosVsAndroidAnnualCsv';

export type IosAndroidNewsPlatform = 'Android' | 'iOS';

export type IosAndroidNewsEvent = {
  detail: string;
  platform: IosAndroidNewsPlatform;
  title: string;
  year: number;
};

export type IosAndroidUsageVideoConfig = {
  annualCsv: string;
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  introVoiceoverVolume: number;
  newsEvents: IosAndroidNewsEvent[];
  raceCountries: string[];
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
  topN: number;
};

export const iosAndroidUsageVideoConfig: IosAndroidUsageVideoConfig = {
  annualCsv: iosVsAndroidAnnualCsv,
  durationInSeconds: 35,
  endHoldSeconds: 2,
  fps: 60,
  introVoiceoverVolume: 0.95,
  newsEvents: [
    {
      detail: 'Verizon and Motorola turn Android into an iPhone rival.',
      platform: 'Android',
      title: 'Droid makes Android mainstream',
      year: 2009,
    },
    {
      detail: 'Retina Display, FaceTime, and iOS 4 raise the bar.',
      platform: 'iOS',
      title: 'iPhone 4 resets the screen race',
      year: 2010,
    },
    {
      detail: 'iPhone 4S brings voice AI into the mainstream.',
      platform: 'iOS',
      title: 'Siri enters the phone war',
      year: 2011,
    },
    {
      detail: 'Apps, games, books, music, and video unite.',
      platform: 'Android',
      title: 'Google Play replaces Android Market',
      year: 2012,
    },
    {
      detail: 'The platform becomes a truly global default.',
      platform: 'Android',
      title: 'Android passes 1B activations',
      year: 2013,
    },
    {
      detail: 'iPhone 6 and 6 Plus answer large-screen Android.',
      platform: 'iOS',
      title: 'iPhone finally goes big',
      year: 2014,
    },
    {
      detail: 'Marshmallow lets users approve permissions at runtime.',
      platform: 'Android',
      title: 'Android changes app permissions',
      year: 2015,
    },
    {
      detail: 'Google starts building its own flagship phone line.',
      platform: 'Android',
      title: 'Pixel is born',
      year: 2016,
    },
    {
      detail: 'Face ID and the all-screen notch era begin.',
      platform: 'iOS',
      title: 'iPhone X changes iPhone design',
      year: 2017,
    },
    {
      detail: 'Google faces a EUR 4.34B Android antitrust penalty.',
      platform: 'Android',
      title: 'EU hits Android with record fine',
      year: 2018,
    },
    {
      detail: 'A top Android maker is forced outside Google apps.',
      platform: 'Android',
      title: 'Huawei loses Google services',
      year: 2019,
    },
    {
      detail: 'iPhone 12 brings 5G to Apple phones.',
      platform: 'iOS',
      title: 'iPhone joins the 5G race',
      year: 2020,
    },
    {
      detail: 'Apps must ask before tracking users across services.',
      platform: 'iOS',
      title: 'App tracking prompt arrives',
      year: 2021,
    },
    {
      detail: 'iPhone 14 adds emergency texting off the grid.',
      platform: 'iOS',
      title: 'Satellite SOS reaches iPhone',
      year: 2022,
    },
    {
      detail: 'iPhone 15 drops Lightning for the universal port.',
      platform: 'iOS',
      title: 'USB-C comes to iPhone',
      year: 2023,
    },
    {
      detail: 'Alternative marketplaces arrive under the DMA.',
      platform: 'iOS',
      title: 'EU opens iOS distribution',
      year: 2024,
    },
    {
      detail: 'iOS 26 brings Apple\'s broadest visual redesign.',
      platform: 'iOS',
      title: 'Liquid Glass redesign lands',
      year: 2025,
    },
    {
      detail: 'Brazil adds alternative app stores and payments.',
      platform: 'iOS',
      title: 'Brazil opens iOS too',
      year: 2026,
    },
  ],
  raceCountries: [
    'United States',
    'Japan',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Spain',
    'Sweden',
    'Switzerland',
    'Korea Republic of',
    'China',
    'India',
    'Brazil',
    'Mexico',
    'Indonesia',
    'Turkey',
    'Vietnam',
    'South Africa',
    'Russian Federation',
    'Netherlands',
  ],
  source: 'Source: StatCounter GlobalStats, mobile OS web usage share by country.',
  startHoldSeconds: 1,
  subtitle: 'Country-by-country mobile web usage share, 2009-2026 YTD',
  title: 'iOS vs Android',
  titleHook: 'Which phone OS leads each country?',
  topN: 9,
};
