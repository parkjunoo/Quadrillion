import { qqqDailyPricesCsv } from './generated/qqqDailyPricesCsv';
import { qqqDcaVideoConfig } from './config';

export type QqqPricePoint = {
  adjClose: number;
  close: number;
  date: string;
  time: number;
};

export type QqqDcaPoint = QqqPricePoint & {
  tenYearAverageCost: number | null;
  tenYearInvested: number | null;
  tenYearPnl: number | null;
  tenYearShares: number | null;
  tenYearValue: number | null;
  twentyYearAverageCost: number;
  twentyYearInvested: number;
  twentyYearPnl: number;
  twentyYearShares: number;
  twentyYearValue: number;
};

export type QqqDcaStats = {
  finalValue: number;
  firstTradingDate: string;
  gain: number;
  invested: number;
  multiple: number;
  purchaseCount: number;
};

export type QqqDcaData = {
  finalPoint: QqqDcaPoint;
  maxClose: number;
  maxPortfolioValue: number;
  points: QqqDcaPoint[];
  tenYearStartIndex: number;
  tenYearStats: QqqDcaStats;
  twentyYearStats: QqqDcaStats;
};

const parseDateToUtcTime = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

const parseQqqPrices = (csv: string): QqqPricePoint[] => {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine?.split(',') ?? [];
  const dateIndex = headers.indexOf('date');
  const closeIndex = headers.indexOf('close');
  const adjCloseIndex = headers.indexOf('adjClose');

  if (dateIndex < 0 || closeIndex < 0 || adjCloseIndex < 0) {
    throw new Error('QQQ daily price CSV is missing date, close, or adjClose columns.');
  }

  return lines.map((line) => {
    const columns = line.split(',');
    const date = columns[dateIndex] ?? '';
    const close = Number(columns[closeIndex]);
    const adjClose = Number(columns[adjCloseIndex]);

    return {
      adjClose,
      close,
      date,
      time: parseDateToUtcTime(date),
    };
  });
};

const buildStats = ({
  finalValue,
  firstTradingDate,
  invested,
  purchaseCount,
}: {
  finalValue: number;
  firstTradingDate: string;
  invested: number;
  purchaseCount: number;
}): QqqDcaStats => ({
  finalValue,
  firstTradingDate,
  gain: finalValue - invested,
  invested,
  multiple: invested === 0 ? 0 : finalValue / invested,
  purchaseCount,
});

const buildQqqDcaData = (): QqqDcaData => {
  const prices = parseQqqPrices(qqqDailyPricesCsv).filter(
    (point) =>
      point.date >= qqqDcaVideoConfig.twentyYearStartDate &&
      point.date <= qqqDcaVideoConfig.evaluationDate,
  );

  if (prices.length === 0) {
    throw new Error('QQQ DCA data has no prices in the configured date range.');
  }

  let twentyYearShares = 0;
  let tenYearShares = 0;
  let twentyYearCloseShares = 0;
  let tenYearCloseShares = 0;
  let twentyYearInvested = 0;
  let tenYearInvested = 0;
  let maxClose = 0;
  let maxPortfolioValue = 0;
  let tenYearPurchaseCount = 0;
  let tenYearFirstTradingDate = '';

  const points = prices.map((point) => {
    twentyYearShares += qqqDcaVideoConfig.dailyInvestmentUsd / point.adjClose;
    twentyYearCloseShares += qqqDcaVideoConfig.dailyInvestmentUsd / point.close;
    twentyYearInvested += qqqDcaVideoConfig.dailyInvestmentUsd;

    const twentyYearValue = twentyYearShares * point.adjClose;
    const twentyYearAverageCost = twentyYearInvested / twentyYearCloseShares;
    let tenYearAverageCost: number | null = null;
    let tenYearValue: number | null = null;
    let tenYearPnl: number | null = null;
    let currentTenYearShares: number | null = null;
    let currentTenYearInvested: number | null = null;

    if (point.date >= qqqDcaVideoConfig.tenYearStartDate) {
      tenYearShares += qqqDcaVideoConfig.dailyInvestmentUsd / point.adjClose;
      tenYearCloseShares += qqqDcaVideoConfig.dailyInvestmentUsd / point.close;
      tenYearInvested += qqqDcaVideoConfig.dailyInvestmentUsd;
      tenYearPurchaseCount += 1;
      tenYearFirstTradingDate ||= point.date;
      tenYearValue = tenYearShares * point.adjClose;
      tenYearAverageCost = tenYearInvested / tenYearCloseShares;
      tenYearPnl = tenYearValue - tenYearInvested;
      currentTenYearShares = tenYearCloseShares;
      currentTenYearInvested = tenYearInvested;
    }

    maxClose = Math.max(maxClose, point.close);
    maxPortfolioValue = Math.max(maxPortfolioValue, twentyYearValue, tenYearValue ?? 0);

    return {
      ...point,
      tenYearAverageCost,
      tenYearInvested: currentTenYearInvested,
      tenYearPnl,
      tenYearShares: currentTenYearShares,
      tenYearValue,
      twentyYearAverageCost,
      twentyYearInvested,
      twentyYearPnl: twentyYearValue - twentyYearInvested,
      twentyYearShares: twentyYearCloseShares,
      twentyYearValue,
    };
  });

  const finalPoint = points[points.length - 1];

  if (!finalPoint) {
    throw new Error('QQQ DCA data is empty after processing.');
  }

  const tenYearStartIndex = points.findIndex((point) => point.date >= qqqDcaVideoConfig.tenYearStartDate);

  return {
    finalPoint,
    maxClose,
    maxPortfolioValue,
    points,
    tenYearStartIndex,
    tenYearStats: buildStats({
      finalValue: finalPoint.tenYearValue ?? 0,
      firstTradingDate: tenYearFirstTradingDate,
      invested: tenYearInvested,
      purchaseCount: tenYearPurchaseCount,
    }),
    twentyYearStats: buildStats({
      finalValue: finalPoint.twentyYearValue,
      firstTradingDate: points[0].date,
      invested: twentyYearInvested,
      purchaseCount: points.length,
    }),
  };
};

export const qqqDcaData = buildQqqDcaData();
