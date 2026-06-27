export type ExchangeRateEntity = {
  id: string;
  name: string;
  code: string;
  flag: string;
  region: string;
  currency: string;
  color: string;
};

export type ExchangeRateRaceData = {
  entities: ExchangeRateEntity[];
  snapshots: ExchangeRateSnapshot[];
  minYear: number;
  maxYear: number;
};

export type ExchangeRateSnapshot = {
  year: number;
  currencies: Map<string, string>;
  values: Map<string, number>;
  ranks: Map<string, number>;
  maxValue: number;
};

export type ExchangeRateFrameRow = ExchangeRateEntity & {
  value: number;
  previousValue: number;
  targetValue: number;
  liveRank: number;
  displayRank: number;
  previousRank: number;
  targetRank: number;
  opacity: number;
};

export type ExchangeRateFrameState = {
  year: number;
  yearProgress: number;
  segmentProgress: number;
  maxValue: number;
  rows: ExchangeRateFrameRow[];
};

type CsvRow = {
  year: number;
  name: string;
  code: string;
  flag: string;
  region: string;
  currency: string;
  value: number;
  rank: number;
  color: string;
};

const REQUIRED_HEADERS = ['year', 'name', 'code', 'flag', 'region', 'currency', 'value', 'rank', 'color'] as const;

export const buildExchangeRateRaceData = (csv: string): ExchangeRateRaceData => {
  const rows = parseCsv(csv);
  const entityById = new Map<string, ExchangeRateEntity>();
  const rowsByYear = new Map<number, CsvRow[]>();

  for (const row of rows) {
    if (!entityById.has(row.code)) {
      entityById.set(row.code, {
        id: row.code,
        name: row.name,
        code: row.code,
        flag: row.flag,
        region: row.region,
        currency: row.currency,
        color: row.color,
      });
    }

    const yearRows = rowsByYear.get(row.year) ?? [];
    yearRows.push(row);
    rowsByYear.set(row.year, yearRows);
  }

  const entities = [...entityById.values()].sort((a, b) => a.name.localeCompare(b.name));
  const snapshots = [...rowsByYear.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, yearRows]) => buildSnapshot(year, yearRows, entities));
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    entities,
    snapshots,
    minYear: firstSnapshot?.year ?? 0,
    maxYear: lastSnapshot?.year ?? 0,
  };
};

export const getExchangeRateFrameState = ({
  data,
  durationInFrames,
  frame,
  topN,
}: {
  data: ExchangeRateRaceData;
  durationInFrames: number;
  frame: number;
  topN: number;
}): ExchangeRateFrameState => {
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const prevSnapshot = data.snapshots[segmentIndex] ?? data.snapshots[0];
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? prevSnapshot;
  const segmentProgress = progress === 1 ? 1 : scaled - segmentIndex;

  const rawRows = data.entities.map((entity) => {
    const previousValue = prevSnapshot.values.get(entity.id) ?? 0;
    const targetValue = nextSnapshot.values.get(entity.id) ?? previousValue;
    const value = previousValue + (targetValue - previousValue) * segmentProgress;
    const previousRank = prevSnapshot.ranks.get(entity.id) ?? data.entities.length + 1;
    const targetRank = nextSnapshot.ranks.get(entity.id) ?? previousRank;

    return {
      ...entity,
      currency:
        nextSnapshot.currencies.get(entity.id) ||
        prevSnapshot.currencies.get(entity.id) ||
        entity.currency,
      value,
      previousValue,
      targetValue,
      liveRank: 0,
      displayRank: 0,
      previousRank,
      targetRank,
      opacity: 1,
    };
  });
  const rankedRows = [...rawRows]
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  rankedRows.forEach((row, index) => {
    row.liveRank = index + 1;
    row.displayRank = index + 1;
  });

  const maxValue = Math.max(1, ...rankedRows.map((row) => row.value));
  const rows = rankedRows
    .filter((row) =>
      row.liveRank <= topN ||
      row.previousRank <= topN ||
      row.targetRank <= topN
    )
    .map((row) => ({
      ...row,
      opacity: 1,
    }))
    .sort((a, b) => a.liveRank - b.liveRank);

  return {
    year: progress === 1 ? nextSnapshot.year : prevSnapshot.year,
    yearProgress: progress,
    segmentProgress,
    maxValue,
    rows,
  };
};

const buildSnapshot = (
  year: number,
  rows: CsvRow[],
  entities: ExchangeRateEntity[],
): ExchangeRateSnapshot => {
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();
  const currencies = new Map<string, string>();

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
  }

  for (const row of rows) {
    values.set(row.code, row.value);
    ranks.set(row.code, row.rank);
    currencies.set(row.code, row.currency);
  }

  return {
    year,
    currencies,
    values,
    ranks,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
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

    return {
      year: Number(valueFor('year')),
      name: valueFor('name'),
      code: valueFor('code'),
      flag: valueFor('flag'),
      region: valueFor('region'),
      currency: valueFor('currency'),
      value: Number(valueFor('value')),
      rank: Number(valueFor('rank')),
      color: valueFor('color'),
    };
  });
};

const splitCsvLine = (line: string) => {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
