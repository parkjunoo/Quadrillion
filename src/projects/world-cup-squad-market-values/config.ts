import { worldCupSquadMarketValueTop5Csv } from './generated/worldCupSquadMarketValueTop5Csv';

export type WorldCupSquadMarketValueVideoConfig = {
  csv: string;
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  labelTopN: number;
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
  topN: number;
  valueColumnLabel: string;
};

export const worldCupSquadMarketValueVideoConfig: WorldCupSquadMarketValueVideoConfig = {
  csv: worldCupSquadMarketValueTop5Csv,
  durationInSeconds: 45,
  endHoldSeconds: 2,
  fps: 60,
  labelTopN: 5,
  source:
    'Estimated USD squad market values based on public player valuation data; approximate, not official FIFA figures.',
  startHoldSeconds: 1,
  subtitle: 'Top 5 country squad values - 1998-2026',
  title: 'World Cup Squad Values',
  titleHook: 'Which nations bring the most expensive squads?',
  topN: 5,
  valueColumnLabel: 'SQUAD VALUE',
};
