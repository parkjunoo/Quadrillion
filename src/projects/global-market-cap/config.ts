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
  topN: number;
  labelTopN: number;
  source: string;
  csv: string;
};

export const globalMarketCapVideoConfig: GlobalMarketCapVideoConfig = {
  title: 'World Market Cap Giants',
  titleHook: 'Who owns the biggest piece of the market?',
  subtitle: 'Top 6 territory race - companies by market cap - 2000-2026',
  dateLabel: 'YEAR',
  valueColumnLabel: 'MARKET CAP',
  durationInSeconds: 59,
  startHoldSeconds: 1,
  endHoldSeconds: 2,
  fps: 60,
  topN: 6,
  labelTopN: 6,
  source:
    'Source: CompaniesMarketCap, 2000-2026; SpaceX uses private valuation.',
  csv: filterMarketCapCsvFromYear(globalMarketCapRaceCsv, 2000),
};

function filterMarketCapCsvFromYear(csv: string, startYear: number) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const filteredRows = rows.filter((row) => Number(row.slice(0, 4)) >= startYear);

  return [header, ...filteredRows].join('\n');
}
