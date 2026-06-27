import { onlineGameConcurrencyTop10Csv } from './generated/onlineGameConcurrencyTop10Csv';

export const onlineGameConcurrencyVideoConfig = {
  csv: onlineGameConcurrencyTop10Csv,
  dataCadence: 'yearly',
  dateLabel: 'YEAR',
  durationInSeconds: 45,
  fps: 60,
  endHoldSeconds: 2,
  introVoiceoverVolume: 0.95,
  startHoldSeconds: 1,
  source:
    'Sources: SteamCharts annual peaks + publisher/press records. LoL/Roblox gaps use marked midpoint CCU estimates; Roblox experiences excluded.',
  startDate: '2012-01-01',
  subtitle: 'Reported peak CCU + marked midpoint estimates · 2012-2026 YTD',
  timeLabelCadence: 'yearly',
  title: 'The Games That Ruled the World',
  titleHook: 'Reported peak concurrent players',
  topN: 10,
  valueColumnLabel: 'PEAK CCU',
} as const;
