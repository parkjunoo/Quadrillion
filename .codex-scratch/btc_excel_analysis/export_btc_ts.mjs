import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "/Users/junsoo/00_project/Quadrillion/outputs/btc_element_analysis/btc_price_element_analysis_3day.xlsx";
const outputPath = "/Users/junsoo/00_project/Quadrillion/src/bitcoinHistoryData.ts";
const usdKrwRate = 1520.21;
const exchangeRateDate = "2026-06-12";
const exchangeRateSource = "Frankfurter API";
const exchangeRateSourceUrl = "https://api.frankfurter.app/latest?from=USD&to=KRW";
const candleIntervalDays = 3;
const visibleCandles = 122;
const introEvents = [
  {
    date: "2009-01-03",
    kicker: "네트워크의 탄생",
    title: "제네시스 블록 생성",
    detail: "Satoshi Nakamoto가 블록 0을 채굴하며 비트코인 체인을 시작.",
    tone: "bullish",
  },
  {
    date: "2009-01-12",
    kicker: "첫 외부 전송",
    title: "Hal Finney에게 10 BTC",
    detail: "사토시가 Hal Finney에게 보낸 10 BTC가 최초의 비트코인 거래로 기록.",
    tone: "neutral",
  },
  {
    date: "2010-03-17",
    kicker: "가격 발견의 시작",
    title: "첫 거래소 BitcoinMarket.com",
    detail: "비트코인이 달러와 교환되는 최초의 지속 거래 시장이 열림.",
    tone: "bullish",
  },
  {
    date: "2010-05-22",
    kicker: "첫 실물 결제",
    title: "피자 2판에 10,000 BTC",
    detail: "Laszlo Hanyecz가 10,000 BTC로 피자를 구매하며 실사용 사례를 남김.",
    tone: "bullish",
  },
];

function excelSerialToIso(serial) {
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  return date.toISOString().slice(0, 10);
}

function roundKrw(value) {
  return Math.round(value * usdKrwRate);
}

function roundUsd(value) {
  return Math.round(value * 10) / 10;
}

function chartKrw(value, fallback) {
  return roundKrw(value > 0 ? value : fallback);
}

function serialize(value) {
  return JSON.stringify(value, null, 2).replace(/"([a-zA-Z][a-zA-Z0-9]*)":/g, "$1:");
}

const file = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(file);
const candleSheet = workbook.worksheets.getItem("BTC_3D_Merged");
const eventsSheet = workbook.worksheets.getItem("Major_Events");

const candleValues = candleSheet.getRange("A1:L3000").values.slice(1);
const eventValues = eventsSheet.getRange("A1:F21").values.slice(1);

const candles = candleValues
  .filter((row) => typeof row[0] === "number")
  .map((row) => {
    const openUsd = roundUsd(Number(row[2]));
    const highUsd = roundUsd(Number(row[3]));
    const lowUsd = roundUsd(Number(row[4]));
    const closeUsd = roundUsd(Number(row[1]));

    return {
      time: excelSerialToIso(Number(row[0])),
      open: chartKrw(openUsd, closeUsd),
      high: chartKrw(highUsd, closeUsd),
      low: chartKrw(lowUsd, closeUsd),
      close: chartKrw(closeUsd, Math.max(openUsd, 0.1)),
      openUsd,
      highUsd,
      lowUsd,
      closeUsd,
    };
  });

const events = eventValues
  .filter((row) => typeof row[0] === "number" && row[1])
  .map((row) => ({
    date: excelSerialToIso(Number(row[0])),
    title: String(row[1]),
    detail: String(row[2]),
    tone: String(row[3]),
  }));

const contents = `export type BitcoinCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  openUsd: number;
  highUsd: number;
  lowUsd: number;
  closeUsd: number;
};

export type BitcoinEvent = {
  date: string;
  title: string;
  detail: string;
  tone: 'bullish' | 'bearish' | 'neutral';
};

export type BitcoinIntroEvent = BitcoinEvent & {
  kicker: string;
};

export const bitcoinVideoConfig = {
  title: '비트코인 가격 역사',
  subtitle: '원화 기준 3일봉 차트와 주요 시장 사건',
  durationInSeconds: 82,
  visibleCandles: ${visibleCandles},
  candleIntervalDays: ${candleIntervalDays},
  usdKrwRate: ${usdKrwRate},
  exchangeRateDate: '${exchangeRateDate}',
  exchangeRateSource: '${exchangeRateSource}',
  exchangeRateSourceUrl: '${exchangeRateSourceUrl}',
  dataSource: 'Investing.com BTC/USD daily historical table, aggregated into 3-day candles',
  dataWorkbook: '${workbookPath}',
};

export const bitcoinIntroEvents: BitcoinIntroEvent[] = ${serialize(introEvents)};

export const bitcoinCandles: BitcoinCandle[] = ${serialize(candles)};

export const bitcoinEvents: BitcoinEvent[] = ${serialize(events)};

export const eventIndexByDate = new Map(
  bitcoinEvents.map((event) => [
    event.date,
    bitcoinCandles.findIndex((candle) => candle.time >= event.date),
  ]),
);
`;

await fs.writeFile(outputPath, contents);

console.log(
  JSON.stringify(
    {
      outputPath,
      candleCount: candles.length,
      first: candles[0],
      last: candles.at(-1),
      eventCount: events.length,
      usdKrwRate,
      exchangeRateDate,
    },
    null,
    2,
  ),
);
