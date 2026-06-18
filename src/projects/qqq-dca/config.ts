export type QqqDcaVideoConfig = {
  dailyInvestmentUsd: number;
  durationInSeconds: number;
  evaluationDate: string;
  fps: number;
  source: string;
  subtitle: string;
  tenYearStartDate: string;
  title: string;
  twentyYearStartDate: string;
};

export const qqqDcaVideoConfig: QqqDcaVideoConfig = {
  dailyInvestmentUsd: 10,
  durationInSeconds: 58,
  evaluationDate: '2026-06-17',
  fps: 60,
  source:
    'Source: Yahoo Finance QQQ daily OHLCV · adjClose used for DCA value · close used for average cost · not financial advice',
  subtitle: '20-year vs 10-year daily buys · through Jun 17, 2026',
  tenYearStartDate: '2016-06-17',
  title: 'QQQ $10/Day Test',
  twentyYearStartDate: '2006-06-17',
};
