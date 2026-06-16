export type ChartEntity = {
  id: string;
  name: string;
  code: string;
  region: string;
  color: string;
  flag: string;
  worldCupWins: number;
};

export type ChartRaceData = {
  entities: ChartEntity[];
  snapshots: ChartSnapshot[];
  minYear: number;
  maxYear: number;
  minMonthIndex: number;
  maxMonthIndex: number;
  minQuarterIndex: number;
  maxQuarterIndex: number;
};

export type ChartSnapshot = {
  date: string;
  year: number;
  quarter: number;
  quarterIndex: number;
  month: number;
  monthIndex: number;
  values: Map<string, number>;
  ranks: Map<string, number>;
  maxValue: number;
};

export type ChartRaceRow = ChartEntity & {
  value: number;
  animatedRank: number;
  liveRank: number;
  opacity: number;
};

export type ChartFrameState = {
  date: string;
  year: number;
  quarter: number;
  quarterIndex: number;
  month: number;
  monthIndex: number;
  maxValue: number;
  rows: ChartRaceRow[];
};

type CsvRow = {
  date: string;
  year: number;
  quarter: number;
  month: number;
  name: string;
  code: string;
  region: string;
  value: number;
  rank: number;
  color: string;
  flag: string;
  worldCupWins: number;
};

const REQUIRED_HEADERS = ['year', 'name', 'code', 'region', 'value', 'color'] as const;

export const buildChartRaceData = (csv: string): ChartRaceData => {
  const rows = parseCsv(csv);
  const entityById = new Map<string, ChartEntity>();
  const rowsByDate = new Map<string, CsvRow[]>();

  for (const row of rows) {
    const snapshotRows = rowsByDate.get(row.date) ?? [];
    snapshotRows.push(row);
    rowsByDate.set(row.date, snapshotRows);

    if (!entityById.has(row.code)) {
      entityById.set(row.code, {
        id: row.code,
        name: row.name,
        code: row.code,
        region: row.region,
        color: row.color,
        flag: row.flag,
        worldCupWins: row.worldCupWins,
      });
    }
  }

  const entities = [...entityById.values()].sort((a, b) => a.name.localeCompare(b.name));
  const snapshots = [...rowsByDate.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, snapshotRows]) => buildSnapshot(date, snapshotRows, entities));
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    entities,
    snapshots,
    minYear: firstSnapshot?.year ?? 0,
    maxYear: lastSnapshot?.year ?? 0,
    minMonthIndex: firstSnapshot?.monthIndex ?? 0,
    maxMonthIndex: lastSnapshot?.monthIndex ?? 0,
    minQuarterIndex: firstSnapshot?.quarterIndex ?? 0,
    maxQuarterIndex: lastSnapshot?.quarterIndex ?? 0,
  };
};

export const getChartFrameState = ({
  data,
  frame,
  durationInFrames,
  topN,
}: {
  data: ChartRaceData;
  frame: number;
  durationInFrames: number;
  topN: number;
}): ChartFrameState => {
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * lastSegmentIndex;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const p0 = data.snapshots[Math.max(0, segmentIndex - 1)] ?? data.snapshots[0];
  const prevSnapshot = data.snapshots[segmentIndex] ?? data.snapshots[0];
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? prevSnapshot;
  const p3 = data.snapshots[Math.min(data.snapshots.length - 1, segmentIndex + 2)] ?? nextSnapshot;
  const nearestSnapshot = data.snapshots[Math.min(data.snapshots.length - 1, Math.round(scaled))] ?? prevSnapshot;
  const segmentProgress = segmentIndex === lastSegmentIndex ? progress === 1 ? 1 : scaled % 1 : scaled % 1;
  const monthIndex = interpolateSnapshotNumber(
    p0,
    prevSnapshot,
    nextSnapshot,
    p3,
    (snapshot) => snapshot.monthIndex,
    segmentProgress,
  );
  const quarterIndex = interpolateSnapshotNumber(
    p0,
    prevSnapshot,
    nextSnapshot,
    p3,
    (snapshot) => snapshot.quarterIndex,
    segmentProgress,
  );
  const rows = data.entities.map((entity) => {
    const value = Math.max(0, interpolateSnapshotNumber(
      p0,
      prevSnapshot,
      nextSnapshot,
      p3,
      (snapshot) => snapshot.values.get(entity.id) ?? 0,
      segmentProgress,
    ));
    const animatedRank = clamp(interpolateSnapshotNumber(
      p0,
      prevSnapshot,
      nextSnapshot,
      p3,
      (snapshot) => snapshot.ranks.get(entity.id) ?? data.entities.length + 1,
      segmentProgress,
    ), 1, data.entities.length + 1);

    return {
      ...entity,
      value,
      animatedRank,
      liveRank: 0,
      opacity: 1,
    };
  });
  const byValue = [...rows].sort(compareRowsByValue);

  for (let index = 0; index < byValue.length; index += 1) {
    byValue[index].liveRank = index + 1;
  }

  const visibilityBand = 0.65;
  const visibleRows = rows
    .filter((row) => row.animatedRank <= topN + visibilityBand || row.liveRank <= topN)
    .map((row) => ({
      ...row,
      opacity: row.animatedRank <= topN ? 1 : Math.max(0, 1 - (row.animatedRank - topN) / visibilityBand),
    }))
    .sort((a, b) => a.animatedRank - b.animatedRank);

  return {
    date: nearestSnapshot.date,
    year: yearFromQuarterIndex(quarterIndex),
    quarter: quarterFromIndex(quarterIndex),
    quarterIndex,
    month: monthFromIndex(monthIndex),
    monthIndex,
    maxValue: Math.max(1, interpolateSnapshotNumber(
      p0,
      prevSnapshot,
      nextSnapshot,
      p3,
      (snapshot) => snapshot.maxValue,
      segmentProgress,
    )),
    rows: visibleRows,
  };
};

const parseCsv = (csv: string): CsvRow[] => {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [headerLine, ...bodyLines] = lines;

  if (!headerLine) {
    return [];
  }

  const headers = splitCsvLine(headerLine);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));

  for (const header of REQUIRED_HEADERS) {
    if (!headerIndex.has(header)) {
      throw new Error(`Missing required CSV header: ${header}`);
    }
  }

  return bodyLines.map((line) => {
    const columns = splitCsvLine(line);
    const valueFor = (header: (typeof REQUIRED_HEADERS)[number]) => columns[headerIndex.get(header) ?? -1] ?? '';
    const optionalValueFor = (header: string) => columns[headerIndex.get(header) ?? -1] ?? '';
    const month = Number(optionalValueFor('month') || 1);
    const quarter = Number(optionalValueFor('quarter') || quarterFromMonth(month));

    return {
      date: optionalValueFor('date') || `${valueFor('year')}-${String(month).padStart(2, '0')}-01`,
      year: Number(valueFor('year')),
      quarter,
      month,
      name: valueFor('name'),
      code: valueFor('code'),
      region: valueFor('region'),
      value: Number(valueFor('value')),
      rank: Number(optionalValueFor('rank') || 0),
      color: valueFor('color'),
      flag: optionalValueFor('flag'),
      worldCupWins: Number(optionalValueFor('worldCupWins') || 0),
    };
  });
};

const splitCsvLine = (line: string) => {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  columns.push(current.trim());
  return columns;
};

const buildSnapshot = (date: string, rows: CsvRow[], entities: ChartEntity[]): ChartSnapshot => {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const quarter = rows[0]?.quarter || quarterFromMonth(month);
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
  }

  for (const row of rows) {
    values.set(row.code, row.value);
    ranks.set(row.code, row.rank || entities.length + 1);
  }

  const maxValue = Math.max(...rows.map((row) => row.value), 0);

  return {
    date,
    year,
    quarter,
    quarterIndex: getQuarterIndex(year, quarter),
    month,
    monthIndex: getMonthIndex(year, month),
    values,
    ranks,
    maxValue,
  };
};

const compareRowsByValue = (a: ChartRaceRow, b: ChartRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const interpolateSnapshotNumber = (
  p0: ChartSnapshot,
  p1: ChartSnapshot,
  p2: ChartSnapshot,
  p3: ChartSnapshot,
  valueFor: (snapshot: ChartSnapshot) => number,
  progress: number,
) => catmullRom(valueFor(p0), valueFor(p1), valueFor(p2), valueFor(p3), progress);

const catmullRom = (p0: number, p1: number, p2: number, p3: number, progress: number) => {
  const t2 = progress * progress;
  const t3 = t2 * progress;

  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * progress +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
};

const getMonthIndex = (year: number, month: number) => year * 12 + month - 1;

const getQuarterIndex = (year: number, quarter: number) => year * 4 + quarter - 1;

const quarterFromMonth = (month: number) => Math.floor((month - 1) / 3) + 1;

const yearFromQuarterIndex = (quarterIndex: number) => Math.floor(Math.round(quarterIndex) / 4);

const quarterFromIndex = (quarterIndex: number) => (Math.round(quarterIndex) % 4) + 1;

const monthFromIndex = (monthIndex: number) => (Math.round(monthIndex) % 12) + 1;
