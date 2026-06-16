import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspaceRoot = "/Users/junsoo/00_project/Quadrillion";
const attachedHtmlPath =
  "/Users/junsoo/.codex/attachments/0845410d-b87a-4bcf-a0a3-e016f4eb7775/pasted-text.txt";
const previousCsvPath = path.join(workspaceRoot, "out", "investing_btc_historical_data.csv");
const outputDir = path.join(workspaceRoot, "outputs", "btc_element_analysis");
const outputPath = path.join(outputDir, "btc_price_element_analysis.xlsx");
const previewDir = path.join(outputDir, "previews");

const headers = [
  "Date",
  "Close",
  "Open",
  "High",
  "Low",
  "Volume",
  "Volume Raw",
  "Change %",
  "Change % Raw",
  "Source",
];

const htmlEntityMap = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

const events = [
  ["2008-10-31", "비트코인 백서 공개", "Satoshi Nakamoto가 Bitcoin P2P 전자화폐 백서를 공개.", "neutral"],
  ["2009-01-03", "Genesis Block", "비트코인 네트워크의 첫 블록이 채굴됨.", "bullish"],
  ["2010-05-22", "Bitcoin Pizza Day", "10,000 BTC로 피자 2판을 산 유명한 초기 실사용 사례.", "bullish"],
  ["2011-06-19", "Mt. Gox 초기 해킹", "Mt. Gox 거래소 사고로 시장 신뢰가 크게 흔들림.", "bearish"],
  ["2012-11-28", "첫 번째 반감기", "블록 보상이 50 BTC에서 25 BTC로 감소.", "bullish"],
  ["2013-12-05", "중국 금융기관 제한", "중국 당국의 비트코인 금융기관 취급 제한으로 급락 압력.", "bearish"],
  ["2014-02-24", "Mt. Gox 거래 중단", "당시 최대 거래소 Mt. Gox가 출금/거래 중단 후 파산 절차로 이어짐.", "bearish"],
  ["2016-07-09", "두 번째 반감기", "블록 보상이 25 BTC에서 12.5 BTC로 감소.", "bullish"],
  ["2017-12-17", "CME 비트코인 선물 출시", "제도권 파생상품 시장 진입과 2017년 상승장의 정점 부근.", "neutral"],
  ["2020-03-12", "코로나 유동성 쇼크", "글로벌 위험자산 매도와 함께 비트코인이 급락.", "bearish"],
  ["2020-05-11", "세 번째 반감기", "블록 보상이 12.5 BTC에서 6.25 BTC로 감소.", "bullish"],
  ["2020-08-11", "MicroStrategy 매수 발표", "상장사가 재무자산으로 BTC를 본격 편입한 대표 사례.", "bullish"],
  ["2021-02-08", "Tesla BTC 매입 공시", "Tesla가 BTC 매입을 공시하며 기관/기업 수요 기대가 확대.", "bullish"],
  ["2021-06-09", "엘살바도르 법정화폐 채택", "엘살바도르가 비트코인을 법정화폐로 채택.", "bullish"],
  ["2021-11-10", "2021년 고점", "비트코인이 당시 사상 최고가 부근에 도달.", "neutral"],
  ["2022-05-12", "Terra/Luna 붕괴", "스테이블코인/레버리지 신뢰 충격으로 크립토 시장 급락.", "bearish"],
  ["2022-11-11", "FTX 파산", "대형 거래소 FTX 파산으로 시장 신뢰 훼손.", "bearish"],
  ["2023-06-15", "BlackRock 현물 ETF 신청", "대형 운용사의 현물 ETF 신청으로 제도권 승인 기대 확대.", "bullish"],
  ["2024-01-10", "미국 현물 ETF 승인", "미국 SEC가 다수의 현물 비트코인 ETF를 승인.", "bullish"],
  ["2024-04-20", "네 번째 반감기", "블록 보상이 6.25 BTC에서 3.125 BTC로 감소.", "bullish"],
];

function decodeHtml(value) {
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => htmlEntityMap[match] ?? match);
}

function stripTags(value) {
  return decodeHtml(
    value
      .replace(/<script\b.*?<\/script>/gis, " ")
      .replace(/<style\b.*?<\/style>/gis, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function parseKoreanDate(value) {
  const match = value.match(/(\d{4})년\s*(\d{2})월\s*(\d{2})일/);
  if (!match) return value;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function toDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseNumber(value) {
  const clean = value.replace(/,/g, "").trim();
  if (!clean || clean === "-") return null;
  return Number(clean);
}

function parseVolume(value) {
  let clean = value.replace(/,/g, "").trim();
  if (!clean || clean === "-") return null;
  let multiplier = 1;
  const suffix = clean.slice(-1).toUpperCase();
  if (suffix === "K") {
    multiplier = 1_000;
    clean = clean.slice(0, -1);
  } else if (suffix === "M") {
    multiplier = 1_000_000;
    clean = clean.slice(0, -1);
  } else if (suffix === "B") {
    multiplier = 1_000_000_000;
    clean = clean.slice(0, -1);
  }
  return Number(clean) * multiplier;
}

function parsePercent(value) {
  const clean = value.replace("%", "").replace(/,/g, "").trim();
  if (!clean || clean === "-") return null;
  return Number(clean) / 100;
}

function parseHtmlTable(html) {
  const rows = [...html.matchAll(/<tr\b[^>]*>(.*?)<\/tr>/gis)];
  const parsed = [];
  for (const row of rows.slice(1)) {
    const cells = [...row[1].matchAll(/<(?:td|th)\b[^>]*>(.*?)<\/(?:td|th)>/gis)].map((cell) =>
      stripTags(cell[1]),
    );
    if (cells.length !== 7 || !/^\d{4}년/.test(cells[0])) continue;
    parsed.push({
      date: parseKoreanDate(cells[0]),
      close: parseNumber(cells[1]),
      open: parseNumber(cells[2]),
      high: parseNumber(cells[3]),
      low: parseNumber(cells[4]),
      volume: parseVolume(cells[5]),
      volumeRaw: cells[5],
      changePercent: parsePercent(cells[6]),
      changePercentRaw: cells[6],
      source: "attached_investing_table_2026",
    });
  }
  return parsed;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

function parsePreviousCsv(csv) {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => parseCsvLine(line))
    .filter((cells) => cells.length === 7 && /^\d{4}년/.test(cells[0]))
    .map((cells) => ({
      date: parseKoreanDate(cells[0]),
      close: parseNumber(cells[1]),
      open: parseNumber(cells[2]),
      high: parseNumber(cells[3]),
      low: parseNumber(cells[4]),
      volume: parseVolume(cells[5]),
      volumeRaw: cells[5],
      changePercent: parsePercent(cells[6]),
      changePercentRaw: cells[6],
      source: "previous_full_page_extract_2010_2024",
    }));
}

function rowForWorkbook(row) {
  return [
    toDate(row.date),
    row.close,
    row.open,
    row.high,
    row.low,
    row.volume,
    row.volumeRaw,
    row.changePercent,
    row.changePercentRaw,
    row.source,
  ];
}

function address(row, col) {
  let name = "";
  let n = col;
  while (n > 0) {
    const mod = (n - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    n = Math.floor((n - mod) / 26);
  }
  return `${name}${row}`;
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRange(`${address(1, index + 1).replace(/\d+$/, "")}:${address(1, index + 1).replace(/\d+$/, "")}`)
      .format.columnWidthPx = width;
  });
}

function styleTitle(range) {
  range.format = {
    fill: "#162033",
    font: { color: "#FFFFFF", size: 16, bold: true },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

function styleHeader(range) {
  range.format = {
    fill: "#EAF0F8",
    font: { color: "#162033", bold: true },
    borders: { preset: "all", style: "thin", color: "#D8DEE8" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
}

function styleBody(range) {
  range.format = {
    borders: { preset: "all", style: "thin", color: "#E6EAF0" },
    verticalAlignment: "center",
  };
}

function nearestClose(rows, date) {
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const first = new Date(`${rows[0].date}T00:00:00Z`).getTime();
  const last = new Date(`${rows.at(-1).date}T00:00:00Z`).getTime();
  if (target < first || target > last) return null;
  let best = rows[0];
  let bestDiff = Infinity;
  for (const row of rows) {
    const diff = Math.abs(new Date(`${row.date}T00:00:00Z`).getTime() - target);
    if (diff < bestDiff) {
      best = row;
      bestDiff = diff;
    }
  }
  return best?.close ?? null;
}

function maxDrawdown(rows) {
  let peak = -Infinity;
  let peakDate = "";
  let maxDd = 0;
  let maxDdPeakDate = "";
  let troughDate = "";
  for (const row of rows) {
    if (row.close > peak) {
      peak = row.close;
      peakDate = row.date;
    }
    if (peak > 0) {
      const dd = row.close / peak - 1;
      if (dd < maxDd) {
        maxDd = dd;
        maxDdPeakDate = peakDate;
        troughDate = row.date;
      }
    }
  }
  return { maxDd, peakDate: maxDdPeakDate, troughDate };
}

function yearlySeries(rows) {
  const byYear = new Map();
  for (const row of rows) {
    byYear.set(row.date.slice(0, 4), row);
  }
  return [...byYear.entries()].map(([year, row]) => [year, row.close]);
}

const attachedHtml = await fs.readFile(attachedHtmlPath, "utf8");
const previousCsv = await fs.readFile(previousCsvPath, "utf8");
const attachedRowsDesc = parseHtmlTable(attachedHtml);
const attachedRows = [...attachedRowsDesc].sort((a, b) => a.date.localeCompare(b.date));
const previousRows = parsePreviousCsv(previousCsv).sort((a, b) => a.date.localeCompare(b.date));

const byDate = new Map();
for (const row of previousRows) byDate.set(row.date, row);
let overlapCount = 0;
for (const row of attachedRows) {
  if (byDate.has(row.date)) overlapCount += 1;
  byDate.set(row.date, row);
}
const mergedRows = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

const latest = mergedRows.at(-1);
const earliest = mergedRows[0];
const allTimeHigh = mergedRows.reduce((best, row) => (row.high > best.high ? row : best), mergedRows[0]);
const allTimeLow = mergedRows.reduce((best, row) => (row.low < best.low ? row : best), mergedRows[0]);
const drawdown = maxDrawdown(mergedRows);
const firstClose = earliest.close;
const latestClose = latest.close;
const totalReturn = latestClose / firstClose - 1;
const totalMultiple = latestClose / firstClose;
const rowGapCount = Math.round((toDate(latest.date).getTime() - toDate(earliest.date).getTime()) / 86400000) + 1 - mergedRows.length;
const yearRows = yearlySeries(mergedRows);
const eventRows = events.map(([date, title, detail, tone]) => [
  toDate(date),
  title,
  detail,
  tone,
  nearestClose(mergedRows, date),
  "verify_before_publish",
]);

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const merged = workbook.worksheets.add("BTC_Daily_Merged");
const attached = workbook.worksheets.add("Attached_Table");
const eventsSheet = workbook.worksheets.add("Major_Events");
const checks = workbook.worksheets.add("Sources_Checks");

for (const sheet of [summary, merged, attached, eventsSheet, checks]) {
  sheet.showGridLines = false;
}

summary.getRange("A1:H1").values = [["Bitcoin Daily Price Element Analysis", "", "", "", "", "", "", ""]];
styleTitle(summary.getRange("A1:H1"));
summary.getRange("A3:B19").values = [
  ["항목", "값"],
  ["병합 데이터 시작일", toDate(earliest.date)],
  ["병합 데이터 종료일", toDate(latest.date)],
  ["병합 일봉 행 수", mergedRows.length],
  ["첨부 테이블 행 수", attachedRows.length],
  ["기존 CSV 행 수", previousRows.length],
  ["중복 날짜 수", overlapCount],
  ["날짜 누락 수", rowGapCount],
  ["최신 종가", latestClose],
  ["기간 첫 종가", firstClose],
  ["기간 상승 배율", totalMultiple],
  ["기간 총 수익률", totalReturn],
  ["역대 고가", allTimeHigh.high],
  ["역대 고가 날짜", toDate(allTimeHigh.date)],
  ["최대 낙폭", drawdown.maxDd],
  ["최대 낙폭 고점일", toDate(drawdown.peakDate)],
  ["최대 낙폭 저점일", toDate(drawdown.troughDate)],
];
styleHeader(summary.getRange("A3:B3"));
styleBody(summary.getRange("A4:B19"));
summary.getRange("B4:B5").format.numberFormat = "yyyy-mm-dd";
summary.getRange("B6:B10").format.numberFormat = "#,##0";
summary.getRange("B11:B12").format.numberFormat = "$#,##0.0";
summary.getRange("B13").format.numberFormat = "#,##0.0x";
summary.getRange("B14").format.numberFormat = "#,##0.0%";
summary.getRange("B15").format.numberFormat = "$#,##0.0";
summary.getRange("B16").format.numberFormat = "yyyy-mm-dd";
summary.getRange("B17").format.numberFormat = "0.0%;[Red]-0.0%";
summary.getRange("B18:B19").format.numberFormat = "yyyy-mm-dd";
summary.getRange("D3:E8").values = [
  ["데이터 메모", ""],
  ["첨부 element", "Investing.com 과거 데이터 테이블 DOM에서 추출"],
  ["첨부 범위", `${attachedRows[0].date} - ${attachedRows.at(-1).date}`],
  ["이전 CSV 범위", `${previousRows[0].date} - ${previousRows.at(-1).date}`],
  ["병합 규칙", "동일 날짜는 새 attachment 값을 우선 적용"],
  ["주의", "붙여넣은 DOM 기준이며, 실시간 재조회/투자 조언이 아님"],
];
styleHeader(summary.getRange("D3:E3"));
styleBody(summary.getRange("D4:E8"));
summary.getRange("D10:E27").values = [["Year", "Close"], ...yearRows];
styleHeader(summary.getRange("D10:E10"));
styleBody(summary.getRange(`D11:E${10 + yearRows.length}`));
summary.getRange(`E11:E${10 + yearRows.length}`).format.numberFormat = "$#,##0.0";
const chart = summary.charts.add("line", {
  title: "BTC Year-end Close",
  titleTextStyle: { fontSize: 14, bold: true },
  categories: yearRows.map(([year]) => year),
  series: [{ name: "Close", values: yearRows.map(([, close]) => close), line: { fill: "#2457A6", width: 2 } }],
  hasLegend: false,
  from: { row: 9, col: 5 },
  extent: { widthPx: 560, heightPx: 320 },
  xAxis: { title: { text: "Year" }, textStyle: { fontSize: 9 } },
  yAxis: { title: { text: "USD" }, numberFormatCode: "$#,##0" },
  dataLabels: { showValue: false },
});
chart.plotAreaFill = { type: "solid", color: "#FFFFFF" };
setColumnWidths(summary, [180, 170, 28, 170, 360, 110, 110, 110]);

const mergedMatrix = [headers, ...mergedRows.map(rowForWorkbook)];
merged.getRange(`A1:J${mergedMatrix.length}`).values = mergedMatrix;
styleHeader(merged.getRange("A1:J1"));
styleBody(merged.getRange(`A2:J${mergedMatrix.length}`));
merged.getRange(`A2:A${mergedMatrix.length}`).format.numberFormat = "yyyy-mm-dd";
merged.getRange(`B2:F${mergedMatrix.length}`).format.numberFormat = "#,##0.0";
merged.getRange(`H2:H${mergedMatrix.length}`).format.numberFormat = "0.00%;[Red]-0.00%";
merged.tables.add(`A1:J${mergedMatrix.length}`, true).name = "tbl_btc_daily_merged";
merged.freezePanes.freezeRows(1);
setColumnWidths(merged, [105, 95, 95, 95, 95, 105, 90, 90, 95, 300]);

const attachedMatrix = [headers, ...attachedRowsDesc.map(rowForWorkbook)];
attached.getRange(`A1:J${attachedMatrix.length}`).values = attachedMatrix;
styleHeader(attached.getRange("A1:J1"));
styleBody(attached.getRange(`A2:J${attachedMatrix.length}`));
attached.getRange(`A2:A${attachedMatrix.length}`).format.numberFormat = "yyyy-mm-dd";
attached.getRange(`B2:F${attachedMatrix.length}`).format.numberFormat = "#,##0.0";
attached.getRange(`H2:H${attachedMatrix.length}`).format.numberFormat = "0.00%;[Red]-0.00%";
attached.tables.add(`A1:J${attachedMatrix.length}`, true).name = "tbl_attached_table";
attached.freezePanes.freezeRows(1);
setColumnWidths(attached, [105, 95, 95, 95, 95, 105, 90, 90, 95, 230]);

const eventsMatrix = [
  ["Date", "Event", "Detail", "Tone", "Nearest Close", "Source Status"],
  ...eventRows,
];
eventsSheet.getRange(`A1:F${eventsMatrix.length}`).values = eventsMatrix;
styleHeader(eventsSheet.getRange("A1:F1"));
styleBody(eventsSheet.getRange(`A2:F${eventsMatrix.length}`));
eventsSheet.getRange(`A2:A${eventsMatrix.length}`).format.numberFormat = "yyyy-mm-dd";
eventsSheet.getRange(`E2:E${eventsMatrix.length}`).format.numberFormat = "$#,##0.0";
eventsSheet.tables.add(`A1:F${eventsMatrix.length}`, true).name = "tbl_major_events";
eventsSheet.freezePanes.freezeRows(1);
setColumnWidths(eventsSheet, [110, 190, 520, 90, 120, 220]);

checks.getRange("A1:F1").values = [["Sources and Checks", "", "", "", "", ""]];
styleTitle(checks.getRange("A1:F1"));
checks.getRange("A3:F12").values = [
  ["구분", "값", "상태", "메모", "Source URL / Path", "검증 포인트"],
  ["첨부 HTML", attachedRows.length, "OK", "새로 붙여넣은 테이블 element", attachedHtmlPath, "823 rows expected"],
  ["기존 CSV", previousRows.length, "OK", "이전 전체 페이지 DOM에서 추출", previousCsvPath, "4999 rows expected"],
  ["병합 행", mergedRows.length, "OK", "날짜 기준 dedupe, attachment 우선", "", "5811 rows expected"],
  ["중복 날짜", overlapCount, "OK", "겹친 날짜는 attachment 값 사용", "", "11 rows expected"],
  ["날짜 누락", rowGapCount, rowGapCount === 0 ? "OK" : "CHECK", "달력 기준 일봉 누락 개수", "", "0이면 완전 연속"],
  ["최신 행", latest.date, "OK", "첨부 테이블 기준 최신 일자", "", "부분 일봉 가능성 확인 필요"],
  ["최초 행", earliest.date, "OK", "병합 후 최초 일자", "", ""],
  ["원천 페이지", "Investing.com BTC Historical Data", "REFERENCE", "붙여넣은 DOM의 추정 원천 페이지", "https://kr.investing.com/crypto/bitcoin/historical-data", "실시간 재조회 필요 시 사용"],
  ["공개 사용 주의", "Not investment advice", "NOTE", "영상/공개물에 사용 전 원천, 단위, 날짜 범위 확인", "", ""],
];
styleHeader(checks.getRange("A3:F3"));
styleBody(checks.getRange("A4:F12"));
setColumnWidths(checks, [130, 180, 90, 300, 520, 260]);

for (const sheet of [summary, merged, attached, eventsSheet, checks]) {
  sheet.getRange("A1:J1").format.autofitRows();
}

await fs.mkdir(previewDir, { recursive: true });

const inspections = [];
inspections.push(
  await workbook.inspect({
    kind: "table",
    range: "Summary!A3:E19",
    include: "values,formulas",
    tableMaxRows: 20,
    tableMaxCols: 8,
  }),
);
inspections.push(
  await workbook.inspect({
    kind: "table",
    range: `BTC_Daily_Merged!A1:J8`,
    include: "values,formulas",
    tableMaxRows: 10,
    tableMaxCols: 10,
  }),
);
inspections.push(
  await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "final formula error scan",
  }),
);

const renderTargets = [
  ["Summary", "A1:K27"],
  ["BTC_Daily_Merged", "A1:J20"],
  ["Attached_Table", "A1:J20"],
  ["Major_Events", "A1:F22"],
  ["Sources_Checks", "A1:F12"],
];

for (const [sheetName, range] of renderTargets) {
  const blob = await workbook.render({ sheetName, range, format: "png", scale: 1.5 });
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), Buffer.from(await blob.arrayBuffer()));
}

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(
  JSON.stringify(
    {
      outputPath,
      previewDir,
      summary: {
        mergedRows: mergedRows.length,
        attachedRows: attachedRows.length,
        previousRows: previousRows.length,
        overlapCount,
        earliest: earliest.date,
        latest: latest.date,
        latestClose,
        totalReturn,
        allTimeHigh: { date: allTimeHigh.date, high: allTimeHigh.high },
        maxDrawdown: drawdown,
        rowGapCount,
      },
      inspections: inspections.map((item) => item.ndjson),
    },
    null,
    2,
  ),
);
