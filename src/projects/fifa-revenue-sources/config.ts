import { fifaRevenueSourcesCsv } from './generated/fifaRevenueSourcesCsv';

export type FifaRevenueSourcesVideoConfig = {
  csv: string;
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
  valueColumnLabel: string;
};

export const fifaRevenueSourcesVideoConfig: FifaRevenueSourcesVideoConfig = {
  csv: fifaRevenueSourcesCsv,
  durationInSeconds: 35,
  endHoldSeconds: 2,
  fps: 60,
  source:
    'Sources: FIFA annual reports 2010, 2014, 2018-2025; FIFA revised 2026 budget · USD, 2026F',
  startHoldSeconds: 1,
  subtitle: 'Annual FIFA revenue by source · actuals 2007-2025 · 2026 budget',
  title: 'FIFA Money Race',
  titleHook: 'Who Pays The Bill?',
  valueColumnLabel: 'ANNUAL REVENUE',
} as const;
