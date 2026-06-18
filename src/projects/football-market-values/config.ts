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
  title: 'Football Value Kings',
  titleHook: 'How much is your GOAT worth?',
  subtitle: 'Yearly race · player value motion · 2005-2026',
  dateLabel: 'YEAR',
  valueColumnLabel: 'MARKET VALUE',
  durationInSeconds: 59,
  fps: 60,
  topN: 10,
  startDate: '2005-01-01',
  dataCadence: 'yearly',
  timeLabelCadence: 'yearly',
  source:
    'Source: Transfermarkt estimates via dcaribou/transfermarkt-datasets · 2005-2026, latest source month Jun 2026',
  csv: footballMarketValueTop10RaceCsv,
};
