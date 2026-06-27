import { exchangeRateRaceCsv } from './generated/exchangeRateRaceCsv';

export type ExchangeRateRaceVideoConfig = {
  title: string;
  titleHook: string;
  subtitle: string;
  dateLabel: string;
  valueColumnLabel: string;
  durationInSeconds: number;
  startHoldSeconds: number;
  endHoldSeconds: number;
  fps: number;
  topN: number;
  source: string;
  csv: string;
};

export const exchangeRateRaceVideoConfig: ExchangeRateRaceVideoConfig = {
  title: 'USD Exchange Rate Race',
  titleHook: 'How much local currency does $1 buy?',
  subtitle: 'Annual average official exchange rates - OECD members - 2005-2024',
  dateLabel: 'YEAR',
  valueColumnLabel: 'LCU PER USD',
  durationInSeconds: 50,
  startHoldSeconds: 1,
  endHoldSeconds: 2,
  fps: 60,
  topN: 10,
  source:
    'Source: World Bank PA.NUS.FCRF; OECD 38 member countries; 2005-2024 annual average official exchange rate.',
  csv: exchangeRateRaceCsv,
};
