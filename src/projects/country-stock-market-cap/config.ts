import { countryStockMarketCapEntries } from './generated/countryStockMarketCapEntries';

export type CountryMarketCapObservation = {
  year: number;
  valueUsd: number;
};

export type CountryStockMarketCapEntry = {
  adjustedUsd2026: number;
  code: string;
  color: string;
  firstYear: number;
  host: string;
  iso2: string;
  lastYear: number;
  latestValueUsd: number;
  note: string;
  observations: CountryMarketCapObservation[];
  region: string;
  year: number;
};

export const countryStockMarketCapRaceEntries: CountryStockMarketCapEntry[] =
  countryStockMarketCapEntries;

export const countryStockMarketCapVideoConfig = {
  durationInSeconds: 35,
  endHoldSeconds: 2,
  fps: 60,
  introVoiceoverVolume: 1,
  source:
    'Source: World Bank WDI CM.MKT.LCAP.CD via WFE · listed domestic companies · current USD',
  startHoldSeconds: 1,
  startYear: 2000,
  subtitle: 'Listed domestic companies · current USD · since 2000',
  title: 'Biggest Stock Markets',
  titleHook: 'Country Market Cap TOP 7',
  topN: 7,
  valueColumnLabel: 'MARKET CAP',
} as const;
