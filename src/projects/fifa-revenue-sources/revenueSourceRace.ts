import { fifaRevenueSourcesVideoConfig } from './config';

export type RevenueSourceEntry = {
  code: string;
  color: string;
  name: string;
  region: string;
};

export type RevenueSnapshot = {
  forecast: boolean;
  totalValue: number;
  values: Map<string, number>;
  year: number;
};

export type RevenueSourceRaceData = {
  entries: RevenueSourceEntry[];
  maxValue: number;
  maxYear: number;
  minYear: number;
  snapshots: RevenueSnapshot[];
};

export type RevenueSourceRaceRow = RevenueSourceEntry & {
  animatedRank: number;
  displayRank: number;
  liveRank: number;
  opacity: number;
  previousValue: number;
  targetValue: number;
  value: number;
};

export type RevenueSourceFrameState = {
  currentYear: number;
  displayYear: string;
  forecast: boolean;
  maxValue: number;
  rows: RevenueSourceRaceRow[];
  totalValue: number;
  transitionPulse: number;
  yearProgress: number;
};

type CsvRevenueRow = RevenueSourceEntry & {
  forecast: boolean;
  totalValue: number;
  value: number;
  year: number;
};

type SnapshotBuilder = {
  forecast: boolean;
  totalValue: number;
  values: Map<string, number>;
  year: number;
};

export const buildRevenueSourceRaceData = (
  csv = fifaRevenueSourcesVideoConfig.csv,
): RevenueSourceRaceData => {
  const rows = parseRevenueCsv(csv);
  const entriesByCode = new Map<string, RevenueSourceEntry>();
  const snapshotsByYear = new Map<number, SnapshotBuilder>();

  for (const row of rows) {
    if (!entriesByCode.has(row.code)) {
      entriesByCode.set(row.code, {
        code: row.code,
        color: row.color,
        name: row.name,
        region: row.region,
      });
    }

    const snapshot = snapshotsByYear.get(row.year) ?? {
      forecast: row.forecast,
      totalValue: row.totalValue,
      values: new Map<string, number>(),
      year: row.year,
    };

    snapshot.forecast = snapshot.forecast || row.forecast;
    snapshot.totalValue = row.totalValue;
    snapshot.values.set(row.code, row.value);
    snapshotsByYear.set(row.year, snapshot);
  }

  const entries = [...entriesByCode.values()];
  const snapshots = [...snapshotsByYear.values()]
    .sort((a, b) => a.year - b.year)
    .map((snapshot) => ({
      ...snapshot,
      values: completeSnapshotValues(snapshot.values, entries),
    }));
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots.at(-1);

  return {
    entries,
    maxValue: Math.max(1, ...snapshots.flatMap((snapshot) => [...snapshot.values.values()])),
    maxYear: lastSnapshot?.year ?? 2026,
    minYear: firstSnapshot?.year ?? 2007,
    snapshots,
  };
};

export const getRevenueSourceFrameState = ({
  data,
  durationInFrames,
  frame,
}: {
  data: RevenueSourceRaceData;
  durationInFrames: number;
  frame: number;
}): RevenueSourceFrameState => {
  const firstSnapshot = data.snapshots[0] ?? buildEmptySnapshot(data.minYear);
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const prevSnapshot = data.snapshots[segmentIndex] ?? firstSnapshot;
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? prevSnapshot;
  const segmentProgress = progress === 1 ? 1 : scaled - segmentIndex;
  const easedProgress = smootherStep(segmentProgress);
  const previousRanks = ranksForSnapshot(prevSnapshot, data.entries);
  const targetRanks = ranksForSnapshot(nextSnapshot, data.entries);
  const rows = data.entries.map((entry) => {
    const previousValue = prevSnapshot.values.get(entry.code) ?? 0;
    const targetValue = nextSnapshot.values.get(entry.code) ?? previousValue;
    const value = lerp(previousValue, targetValue, easedProgress);
    const previousRank = previousRanks.get(entry.code) ?? data.entries.length;
    const targetRank = targetRanks.get(entry.code) ?? previousRank;

    return {
      ...entry,
      animatedRank: lerp(previousRank, targetRank, easedProgress),
      displayRank: previousRank,
      liveRank: previousRank,
      opacity: value <= 0 ? 0.68 : 1,
      previousValue,
      targetValue,
      value,
    };
  });
  const liveRows = [...rows].sort(compareRowsByValue);

  for (let index = 0; index < liveRows.length; index += 1) {
    liveRows[index].liveRank = index + 1;
  }

  const sortedRows = [...rows]
    .sort((a, b) =>
      a.animatedRank - b.animatedRank ||
      a.liveRank - b.liveRank ||
      a.name.localeCompare(b.name)
    )
    .map((row, index) => ({
      ...row,
      displayRank: index + 1,
    }));
  const yearValue = lerp(prevSnapshot.year, nextSnapshot.year, easedProgress);
  const roundedYear = Math.round(yearValue);
  const forecast = nextSnapshot.forecast && (segmentProgress > 0.52 || progress === 1);

  return {
    currentYear: clamp(roundedYear, data.minYear, data.maxYear),
    displayYear: forecast ? `${clamp(roundedYear, data.minYear, data.maxYear)}F` : String(clamp(roundedYear, data.minYear, data.maxYear)),
    forecast,
    maxValue: data.maxValue,
    rows: sortedRows,
    totalValue: lerp(prevSnapshot.totalValue, nextSnapshot.totalValue, easedProgress),
    transitionPulse: Math.sin(segmentProgress * Math.PI),
    yearProgress: clamp((yearValue - data.minYear) / Math.max(1, data.maxYear - data.minYear), 0, 1),
  };
};

const parseRevenueCsv = (csv: string): CsvRevenueRow[] => {
  const [headerLine, ...rowLines] = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine ?? '');

  return rowLines.map((line) => {
    const columns = parseCsvLine(line);
    const record: Record<string, string> = {};

    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];

      if (header) {
        record[header] = columns[index] ?? '';
      }
    }

    return {
      code: record.code ?? '',
      color: record.color ?? '#FFFFFF',
      forecast: record.forecast === 'true',
      name: record.name ?? '',
      region: record.region ?? '',
      totalValue: numberFromCsv(record.totalValue),
      value: numberFromCsv(record.value),
      year: numberFromCsv(record.year),
    };
  }).filter((row) => row.year > 0 && row.code.length > 0);
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(value);
      value = '';
      continue;
    }

    value += character;
  }

  values.push(value);

  return values;
};

const completeSnapshotValues = (
  values: Map<string, number>,
  entries: RevenueSourceEntry[],
) => {
  const completedValues = new Map(values);

  for (const entry of entries) {
    if (!completedValues.has(entry.code)) {
      completedValues.set(entry.code, 0);
    }
  }

  return completedValues;
};

const ranksForSnapshot = (
  snapshot: RevenueSnapshot,
  entries: RevenueSourceEntry[],
) => {
  const sortedEntries = [...entries].sort((a, b) =>
    (snapshot.values.get(b.code) ?? 0) - (snapshot.values.get(a.code) ?? 0) ||
    a.name.localeCompare(b.name)
  );
  const ranks = new Map<string, number>();

  for (let index = 0; index < sortedEntries.length; index += 1) {
    ranks.set(sortedEntries[index].code, index + 1);
  }

  return ranks;
};

const compareRowsByValue = (a: RevenueSourceRaceRow, b: RevenueSourceRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const buildEmptySnapshot = (year: number): RevenueSnapshot => ({
  forecast: false,
  totalValue: 0,
  values: new Map<string, number>(),
  year,
});

const numberFromCsv = (value: string | undefined) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * clamp(progress, 0, 1);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};
