import { footballMarketValueTop10RaceCsv } from './generated/footballMarketValueTop10RaceCsv';

export type MarketValueVideoConfig = {
  title: string;
  titleHook: string;
  subtitle: string;
  dateLabel: string;
  valueColumnLabel: string;
  durationInSeconds: number;
  fps: number;
  topN: number;
  startDate: string;
  dataCadence: 'monthly' | 'yearly';
  timeLabelCadence: 'monthly' | 'yearly';
  source: string;
  csv: string;
};

export const marketValueVideoConfig: MarketValueVideoConfig = {
  title: "Who was football's value king?",
  titleHook: 'Football Market Value TOP',
  subtitle: '2005-2026 · Market value race',
  dateLabel: 'PLAYER',
  valueColumnLabel: 'VALUE',
  durationInSeconds: 59,
  fps: 60,
  topN: 10,
  startDate: '2005-01-01',
  dataCadence: 'yearly',
  timeLabelCadence: 'yearly',
  source: 'Source: Transfermarkt estimates · 2005-2026',
  csv: footballMarketValueTop10RaceCsv,
};
