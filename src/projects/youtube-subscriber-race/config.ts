import { youtubeSubscriberRaceCsv } from './generated/youtubeSubscriberRaceCsv';

export type SubscriberRaceEvent = {
  date: string;
  title: string;
  detail: string;
  code: string;
  color: string;
};

export type SubscriberRaceVideoConfig = {
  title: string;
  titleHook: string;
  subtitle: string;
  dateLabel: string;
  valueColumnLabel: string;
  durationInSeconds: number;
  fps: number;
  topN: number;
  source: string;
  csv: string;
  channelMeta: Record<string, SubscriberChannelMeta>;
  events: SubscriberRaceEvent[];
};

export type SubscriberChannelMeta = {
  handle: string;
  firstUploadMonth: string;
  videoCount: number;
};

export const youtubeSubscriberVideoConfig: SubscriberRaceVideoConfig = {
  title: 'YouTube Crown Race',
  titleHook: 'Who owned the subscribe button?',
  subtitle: 'Creator subscribers · reconstructed yearly trend · 2016-2026',
  dateLabel: '20 MONTH WINDOW',
  valueColumnLabel: 'SUBSCRIBERS',
  durationInSeconds: 58,
  fps: 60,
  topN: 10,
  source:
    'Source: SocialBlade profile snapshots, YouTube Creator Award milestones, public profiles/news, and interpolated year-end estimates · public rounded counts',
  csv: youtubeSubscriberRaceCsv,
  channelMeta: {
    MRB: { handle: '@mrbeast', firstUploadMonth: '2012-02', videoCount: 987 },
    TSR: { handle: '@tseries', firstUploadMonth: '2010-12', videoCount: 26404 },
    VNK: { handle: '@vladandniki', firstUploadMonth: '2018-04', videoCount: 1029 },
    STK: { handle: '@stokestwins', firstUploadMonth: '2017-03', videoCount: 450 },
    KIM: { handle: '@kimpro828', firstUploadMonth: '2022-08', videoCount: 4206 },
    PDP: { handle: '@pewdiepie', firstUploadMonth: '2010-04', videoCount: 4663 },
    ALN: { handle: '@alanchikinchow', firstUploadMonth: '2020-02', videoCount: 1715 },
    A4: { handle: '@a4a4a4a4', firstUploadMonth: '2014-11', videoCount: 1041 },
    RBR: { handle: '@markrober', firstUploadMonth: '2011-10', videoCount: 259 },
    DPF: { handle: '@dudeperfect', firstUploadMonth: '2009-04', videoCount: 578 },
  },
  events: [
    {
      date: '2019-05-29',
      title: 'T-Series hits 100M',
      detail: 'The first channel to cross the 100M subscriber mark.',
      code: 'TSR',
      color: '#FF3B30',
    },
    {
      date: '2022-07-28',
      title: 'MrBeast hits 100M',
      detail: 'The creator race starts to tilt hard toward MrBeast.',
      code: 'MRB',
      color: '#00A7FF',
    },
    {
      date: '2024-06-02',
      title: 'MrBeast takes the crown',
      detail: 'MrBeast passes T-Series and becomes No. 1.',
      code: 'MRB',
      color: '#00A7FF',
    },
    {
      date: '2025-04-18',
      title: 'KIMPRO reaches 100M',
      detail: 'A South Korean Shorts rocket joins the 100M club.',
      code: 'KIM',
      color: '#22C55E',
    },
    {
      date: '2026-06-12',
      title: '500M barrier breaks',
      detail: 'MrBeast becomes the first YouTube channel past 500M.',
      code: 'MRB',
      color: '#00A7FF',
    },
  ],
};
