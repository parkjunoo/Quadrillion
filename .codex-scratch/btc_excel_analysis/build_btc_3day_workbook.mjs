import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspaceRoot = "/Users/junsoo/00_project/Quadrillion";
const sourceWorkbookPath = path.join(
  workspaceRoot,
  "outputs",
  "btc_element_analysis",
  "btc_price_element_analysis.xlsx",
);
const outputDir = path.join(workspaceRoot, "outputs", "btc_element_analysis");
const outputPath = path.join(outputDir, "btc_price_element_analysis_3day.xlsx");
const previewDir = path.join(outputDir, "previews_3day");
const periodDays = 3;

const headers3Day = [
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
  "Period Start",
  "Period Days",
];

function excelSerialToDate(serial) {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
}

function formatIso(date) {
  return date.toISOString().slice(0, 10);
}

function formatVolume(value) {
  if (value >= 1_000_000_000) return `${trimNumber(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `${trimNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimNumber(value / 1_000)}K`;
  return `${Math.round(value)}`;
}

function formatPercent(value) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function trimNumber(value) {
  return value.toFixed(value >= 10 ? 2 : 3).replace(/0+$/, "").replace(/\.$/, "");
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

function colName(index) {
  return address(1, index).replace(/\d+$/, "");
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRange(`${colName(index + 1)}:${colName(index + 1)}`).format.columnWidthPx = width;
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

function build3DayRows(dailyRows) {
  const grouped = [];
  let previousClose = null;

  for (let index = 0; index < dailyRows.length; index += periodDays) {
    const chunk = dailyRows.slice(index, index + periodDays);
    if (chunk.length === 0) continue;

    const first = chunk[0];
    const last = chunk.at(-1);
    const open = first.open;
    const close = last.close;
    const high = Math.max(...chunk.map((row) => row.high));
    const low = Math.min(...chunk.map((row) => row.low));
    const volume = chunk.reduce((sum, row) => sum + row.volume, 0);
    const changePercent = previousClose && previousClose !== 0 ? close / previousClose - 1 : 0;

    grouped.push({
      date: last.date,
      close,
      open,
      high,
      low,
      volume,
      volumeRaw: formatVolume(volume),
      changePercent,
      changePercentRaw: formatPercent(changePercent),
      source: "3day_from_btc_daily_merged",
      periodStart: first.date,
      periodDays: chunk.length,
    });

    previousClose = close;
  }

  return grouped;
}

function rowForWorkbook(row) {
  return [
    row.date,
    row.close,
    row.open,
    row.high,
    row.low,
    row.volume,
    row.volumeRaw,
    row.changePercent,
    row.changePercentRaw,
    row.source,
    row.periodStart,
    row.periodDays,
  ];
}

function yearlySeries(rows) {
  const byYear = new Map();
  for (const row of rows) {
    byYear.set(formatIso(row.date).slice(0, 4), row);
  }
  return [...byYear.entries()].map(([year, row]) => [year, row.close]);
}

const sourceFile = await FileBlob.load(sourceWorkbookPath);
const sourceWorkbook = await SpreadsheetFile.importXlsx(sourceFile);
const sourceSheet = sourceWorkbook.worksheets.getItem("BTC_Daily_Merged");
const sourceEvents = sourceWorkbook.worksheets.getItem("Major_Events");
const dailyValues = sourceSheet.getRange("A1:J7000").values.slice(1);
const eventValues = sourceEvents.getRange("A1:F100").values;

const dailyRows = dailyValues
  .filter((row) => typeof row[0] === "number")
  .map((row) => ({
    date: excelSerialToDate(Number(row[0])),
    close: Number(row[1]),
    open: Number(row[2]),
    high: Number(row[3]),
    low: Number(row[4]),
    volume: Number(row[5]),
  }))
  .sort((a, b) => a.date.getTime() - b.date.getTime());

const rows3Day = build3DayRows(dailyRows);
const latest = rows3Day.at(-1);
const earliest = rows3Day[0];
const yearRows = yearlySeries(rows3Day);

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const sheet3Day = workbook.worksheets.add("BTC_3D_Merged");
const dailySource = workbook.worksheets.add("BTC_Daily_Source");
const eventsSheet = workbook.worksheets.add("Major_Events");
const checks = workbook.worksheets.add("Sources_Checks");

for (const sheet of [summary, sheet3Day, dailySource, eventsSheet, checks]) {
  sheet.showGridLines = false;
}

summary.getRange("A1:H1").values = [["Bitcoin 3-Day Price Analysis", "", "", "", "", "", "", ""]];
styleTitle(summary.getRange("A1:H1"));
summary.getRange("A3:B12").values = [
  ["항목", "값"],
  ["3일봉 시작일", earliest.date],
  ["3일봉 종료일", latest.date],
  ["3일봉 행 수", rows3Day.length],
  ["원본 일봉 행 수", dailyRows.length],
  ["집계 기준", `${periodDays} calendar days per candle`],
  ["최신 3일봉 종가", latest.close],
  ["최신 3일봉 시작일", latest.periodStart],
  ["최신 3일봉 구성 일수", latest.periodDays],
  ["영상 체감", "동일 50초 기준 한 봉 이동 시간이 약 3배 증가"],
];
styleHeader(summary.getRange("A3:B3"));
styleBody(summary.getRange("A4:B12"));
summary.getRange("B4:B5").format.numberFormat = "yyyy-mm-dd";
summary.getRange("B6:B7").format.numberFormat = "#,##0";
summary.getRange("B9").format.numberFormat = "$#,##0.0";
summary.getRange("B10").format.numberFormat = "yyyy-mm-dd";
summary.getRange("D3:E8").values = [
  ["데이터 메모", ""],
  ["집계 규칙", "시가=첫날, 고가=기간 최고, 저가=기간 최저, 종가=마지막 날, 거래량=합산"],
  ["기간 끝 날짜", "Date 컬럼은 3일봉 종료일"],
  ["마지막 봉", "잔여 1~2일이 있으면 부분 3일봉으로 유지"],
  ["원본", sourceWorkbookPath],
  ["주의", "붙여넣은 DOM/엑셀 기준이며, 실시간 재조회/투자 조언이 아님"],
];
styleHeader(summary.getRange("D3:E3"));
styleBody(summary.getRange("D4:E8"));
summary.getRange("D10:E27").values = [["Year", "3D Close"], ...yearRows];
styleHeader(summary.getRange("D10:E10"));
styleBody(summary.getRange(`D11:E${10 + yearRows.length}`));
summary.getRange(`E11:E${10 + yearRows.length}`).format.numberFormat = "$#,##0.0";
summary.charts.add("line", {
  title: "BTC 3-Day Year-end Close",
  categories: yearRows.map(([year]) => year),
  series: [{ name: "3D Close", values: yearRows.map(([, close]) => close), line: { fill: "#2457A6", width: 2 } }],
  hasLegend: false,
  from: { row: 9, col: 5 },
  extent: { widthPx: 560, heightPx: 320 },
  yAxis: { title: { text: "USD" }, numberFormatCode: "$#,##0" },
});
setColumnWidths(summary, [185, 240, 28, 170, 540, 110, 110, 110]);

const matrix3Day = [headers3Day, ...rows3Day.map(rowForWorkbook)];
sheet3Day.getRange(`A1:L${matrix3Day.length}`).values = matrix3Day;
styleHeader(sheet3Day.getRange("A1:L1"));
styleBody(sheet3Day.getRange(`A2:L${matrix3Day.length}`));
sheet3Day.getRange(`A2:A${matrix3Day.length}`).format.numberFormat = "yyyy-mm-dd";
sheet3Day.getRange(`B2:F${matrix3Day.length}`).format.numberFormat = "#,##0.0";
sheet3Day.getRange(`H2:H${matrix3Day.length}`).format.numberFormat = "0.00%;[Red]-0.00%";
sheet3Day.getRange(`K2:K${matrix3Day.length}`).format.numberFormat = "yyyy-mm-dd";
sheet3Day.tables.add(`A1:L${matrix3Day.length}`, true).name = "tbl_btc_3day_merged";
sheet3Day.freezePanes.freezeRows(1);
setColumnWidths(sheet3Day, [105, 95, 95, 95, 95, 110, 90, 90, 95, 220, 110, 90]);

const dailySourceMatrix = [
  ["Date", "Close", "Open", "High", "Low", "Volume"],
  ...dailyRows.map((row) => [row.date, row.close, row.open, row.high, row.low, row.volume]),
];
dailySource.getRange(`A1:F${dailySourceMatrix.length}`).values = dailySourceMatrix;
styleHeader(dailySource.getRange("A1:F1"));
styleBody(dailySource.getRange(`A2:F${dailySourceMatrix.length}`));
dailySource.getRange(`A2:A${dailySourceMatrix.length}`).format.numberFormat = "yyyy-mm-dd";
dailySource.getRange(`B2:F${dailySourceMatrix.length}`).format.numberFormat = "#,##0.0";
dailySource.tables.add(`A1:F${dailySourceMatrix.length}`, true).name = "tbl_btc_daily_source";
dailySource.freezePanes.freezeRows(1);
setColumnWidths(dailySource, [105, 95, 95, 95, 95, 110]);

eventsSheet.getRange(`A1:F${eventValues.length}`).values = eventValues;
styleHeader(eventsSheet.getRange("A1:F1"));
styleBody(eventsSheet.getRange(`A2:F${eventValues.length}`));
eventsSheet.getRange(`A2:A${eventValues.length}`).format.numberFormat = "yyyy-mm-dd";
eventsSheet.getRange(`E2:E${eventValues.length}`).format.numberFormat = "$#,##0.0";
eventsSheet.tables.add(`A1:F${eventValues.length}`, true).name = "tbl_major_events";
eventsSheet.freezePanes.freezeRows(1);
setColumnWidths(eventsSheet, [110, 190, 520, 90, 120, 220]);

checks.getRange("A1:F1").values = [["Sources and Checks", "", "", "", "", ""]];
styleTitle(checks.getRange("A1:F1"));
checks.getRange("A3:F10").values = [
  ["구분", "값", "상태", "메모", "Source URL / Path", "검증 포인트"],
  ["원본 일봉", dailyRows.length, "OK", "BTC_Daily_Merged에서 읽음", sourceWorkbookPath, "5811 rows expected"],
  ["3일봉", rows3Day.length, "OK", "3일씩 순차 집계", outputPath, "daily rows / 3"],
  ["첫 3일봉", formatIso(earliest.date), "OK", "Date는 기간 종료일", "", ""],
  ["마지막 3일봉", formatIso(latest.date), "OK", "최신 일자 보존", "", ""],
  ["집계 규칙", "OHLCV", "OK", "open first, high max, low min, close last, volume sum", "", ""],
  ["영상 속도", "3D candles", "OK", "동일 50초면 봉 수가 1/3로 줄어 한 봉 체감 시간이 증가", "", ""],
  ["공개 사용 주의", "Not investment advice", "NOTE", "영상/공개물에 사용 전 원천, 단위, 날짜 범위 확인", "", ""],
];
styleHeader(checks.getRange("A3:F3"));
styleBody(checks.getRange("A4:F10"));
setColumnWidths(checks, [140, 180, 90, 360, 520, 260]);

const inspections = [];
inspections.push(
  await workbook.inspect({
    kind: "table",
    range: "Summary!A3:E12",
    include: "values,formulas",
    tableMaxRows: 20,
    tableMaxCols: 8,
  }),
);
inspections.push(
  await workbook.inspect({
    kind: "table",
    range: "BTC_3D_Merged!A1:L8",
    include: "values,formulas",
    tableMaxRows: 10,
    tableMaxCols: 12,
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

await fs.mkdir(previewDir, { recursive: true });
for (const [sheetName, range] of [
  ["Summary", "A1:K27"],
  ["BTC_3D_Merged", "A1:L20"],
  ["Sources_Checks", "A1:F10"],
]) {
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
        periodDays,
        dailyRows: dailyRows.length,
        rows3Day: rows3Day.length,
        earliest: formatIso(earliest.date),
        latest: formatIso(latest.date),
        latestClose: latest.close,
      },
      inspections: inspections.map((item) => item.ndjson),
    },
    null,
    2,
  ),
);
