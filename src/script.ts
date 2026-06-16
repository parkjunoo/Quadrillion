import { fifaMensRankingRaceCsv } from './generated/fifaMensRankingRaceCsv';

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
export const VIDEO_ASPECT_RATIO = '9:16';
export const SAFE_ZONE_TOP_RATIO = 0.15;
export const SAFE_ZONE_BOTTOM_RATIO = 0.35;
export const SHORTS_PLATFORM_TOP_CLEARANCE = 50;
export const SAFE_ZONE_TOP_BASE = Math.round(VIDEO_HEIGHT * SAFE_ZONE_TOP_RATIO);
export const SAFE_ZONE_TOP = SAFE_ZONE_TOP_BASE + SHORTS_PLATFORM_TOP_CLEARANCE;
export const SAFE_ZONE_BOTTOM = Math.round(VIDEO_HEIGHT * SAFE_ZONE_BOTTOM_RATIO);
export const SAFE_CONTENT_BOTTOM = VIDEO_HEIGHT - SAFE_ZONE_BOTTOM;
export const SAFE_CONTENT_HEIGHT = SAFE_CONTENT_BOTTOM - SAFE_ZONE_TOP;

export type ChartVideoEvent = {
  year: number;
  month: number;
  title: string;
  detail: string;
  code: string;
  color: string;
};

export type ChartVideoConfig = {
  title: string;
  subtitle: string;
  kickerLabel: string;
  dateLabel: string;
  timelineValueFormat: 'month' | 'year';
  timelineStartMonth: number;
  timelineEndMonth: number;
  valuePrefix: string;
  valueSuffix: string;
  valueColumnLabel: string;
  durationInSeconds: number;
  topN: number;
  source: string;
  events: ChartVideoEvent[];
  csv: string;
};

export const chartVideoConfig: ChartVideoConfig = {
  title: 'FIFA Ranking Kings',
  subtitle: 'How World Cup seasons reshaped the fight for No. 1',
  kickerLabel: 'FIFA RANKING RELEASES',
  dateLabel: 'RELEASE',
  timelineValueFormat: 'month',
  timelineStartMonth: 12,
  timelineEndMonth: 6,
  valuePrefix: '',
  valueSuffix: ' pts',
  valueColumnLabel: 'POINTS',
  durationInSeconds: 50,
  topN: 6,
  source: 'Source: FIFA/Coca-Cola men\'s ranking releases, 1992.12-2026.06 · World Cup winner markers',
  events: [
    {
      year: 1994,
      month: 7,
      title: 'Brazil win USA 1994',
      detail: 'A fourth World Cup star pulls Brazil into the ranking spotlight.',
      code: 'BRA',
      color: '#FFE45C',
    },
    {
      year: 1998,
      month: 7,
      title: 'France win 1998',
      detail: 'The home triumph turns France into a new global power.',
      code: 'FRA',
      color: '#4D7CFF',
    },
    {
      year: 2002,
      month: 6,
      title: 'Brazil win 2002',
      detail: 'Brazil complete a record fifth World Cup title.',
      code: 'BRA',
      color: '#FFE45C',
    },
    {
      year: 2006,
      month: 7,
      title: 'Italy win 2006',
      detail: 'Italy add a fourth star after the final in Berlin.',
      code: 'ITA',
      color: '#31D07D',
    },
    {
      year: 2010,
      month: 7,
      title: 'Spain win 2010',
      detail: 'Spain reach the peak of their golden generation.',
      code: 'ESP',
      color: '#FF4B3E',
    },
    {
      year: 2014,
      month: 7,
      title: 'Germany win 2014',
      detail: 'Germany lift a fourth World Cup in Brazil.',
      code: 'GER',
      color: '#FFCC33',
    },
    {
      year: 2018,
      month: 7,
      title: 'France win 2018',
      detail: 'A second title pushes France back toward the summit.',
      code: 'FRA',
      color: '#4D7CFF',
    },
    {
      year: 2022,
      month: 12,
      title: 'Argentina win 2022',
      detail: 'A third World Cup title makes Argentina the story of the race.',
      code: 'ARG',
      color: '#6EC6FF',
    },
  ],
  csv: fifaMensRankingRaceCsv,
};
