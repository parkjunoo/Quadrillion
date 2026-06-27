import { globalMarketCapRaceCsv } from './generated/globalMarketCapRaceCsv';

export type GlobalMarketCapVideoConfig = {
  title: string;
  titleHook: string;
  subtitle: string;
  dateLabel: string;
  valueColumnLabel: string;
  durationInSeconds: number;
  startHoldSeconds: number;
  endHoldSeconds: number;
  fps: number;
  introVoiceoverVolume: number;
  topN: number;
  labelTopN: number;
  source: string;
  csv: string;
};

export const globalMarketCapVideoConfig: GlobalMarketCapVideoConfig = {
  title: 'World Market Cap Race',
  titleHook: 'No stock stays king forever',
  subtitle: 'Top 7 companies by market cap - 2012-2026',
  dateLabel: 'YEAR',
  valueColumnLabel: 'MARKET CAP',
  durationInSeconds: 27,
  startHoldSeconds: 1,
  endHoldSeconds: 2,
  fps: 60,
  introVoiceoverVolume: 1,
  topN: 7,
  labelTopN: 7,
  source:
    'Source: CompaniesMarketCap, 2012-2026; SpaceX uses private valuation.',
  csv: filterMarketCapCsvFromYear(globalMarketCapRaceCsv, 2012),
};

function filterMarketCapCsvFromYear(csv: string, startYear: number) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const filteredRows = rows.filter((row) => Number(row.slice(0, 4)) >= startYear);

  return [header, ...filteredRows].join('\n');
}
