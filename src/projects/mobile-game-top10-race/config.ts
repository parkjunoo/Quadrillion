import { mobileGameTop10RankCsv } from './generated/mobileGameTop10RankCsv';

export const mobileGameTop10VideoConfig = {
  csv: mobileGameTop10RankCsv,
  dateLabel: 'YEAR',
  durationInSeconds: 42,
  endHoldSeconds: 2,
  fps: 60,
  source:
    'Sources: Sensor Tower annual reports; data.ai/App Annie public ranks; Mobilegamer.biz via AppMagic, 2022-2025. Bar length uses rank score, not revenue dollars.',
  startHoldSeconds: 1,
  subtitle: 'Annual global grossing Top 10, normalized as rank score',
  title: 'Mobile Game Revenue Kings',
  titleHook: '10 Years of Global Top 10',
  topN: 10,
  valueColumnLabel: 'ANNUAL RANK',
} as const;
