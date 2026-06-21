import { worldCupRankSnapshots } from './generated/worldCupRankSnapshots';
import type { WorldCupRankSnapshot } from './rankData';

export type WorldCupRankTrackerConfig = {
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  snapshots: WorldCupRankSnapshot[];
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
};

export const worldCupRankTrackerConfig: WorldCupRankTrackerConfig = {
  durationInSeconds: 45,
  endHoldSeconds: 2,
  fps: 60,
  snapshots: worldCupRankSnapshots,
  source:
    'Source: FIFA/Wikipedia final standings, top 8 extracted from local World Cup top16 CSV.',
  startHoldSeconds: 1,
  subtitle: 'Every completed World Cup top 8, racing through final standings',
  title: 'World Cup Rank Tracker',
  titleHook: 'Every tournament top 8, one moving race',
};
