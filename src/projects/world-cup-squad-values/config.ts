import { worldCupSquadValueSnapshots } from './generated/worldCupSquadValueSnapshots';
import type { WorldCupSquadSnapshot } from './squadValues';

export type WorldCupSquadValueVideoConfig = {
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  playerTopN: number;
  snapshots: WorldCupSquadSnapshot[];
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
  topN: number;
};

export const worldCupSquadValueVideoConfig: WorldCupSquadValueVideoConfig = {
  durationInSeconds: 58,
  endHoldSeconds: 2,
  fps: 60,
  playerTopN: 0,
  snapshots: worldCupSquadValueSnapshots,
  source:
    'Source: Transfermarkt estimates via dcaribou/transfermarkt-datasets - country totals from available player market values; not official squad totals.',
  startHoldSeconds: 1,
  subtitle: 'Completed World Cups - country total value proxy - 2006-2022',
  title: 'World Cup Squad Values',
  titleHook: 'Total national team value, tournament by tournament',
  topN: 8,
};
