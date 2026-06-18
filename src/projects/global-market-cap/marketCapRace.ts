export type MarketCapEntity = {
  id: string;
  name: string;
  code: string;
  country: string;
  source: string;
};

export type MarketCapRaceData = {
  entities: MarketCapEntity[];
  snapshots: MarketCapSnapshot[];
  minYear: number;
  maxYear: number;
};

export type MarketCapSnapshot = {
  year: number;
  values: Map<string, number>;
  ranks: Map<string, number>;
  countries: Map<string, string>;
  sources: Map<string, string>;
  maxValue: number;
};

export type MarketCapFrameRow = MarketCapEntity & {
  value: number;
  previousValue: number;
  targetValue: number;
  liveRank: number;
  displayRank: number;
  previousRank: number;
  targetRank: number;
  topNPresence: number;
  opacity: number;
};

export type MarketCapFrameState = {
  year: number;
  yearProgress: number;
  segmentProgress: number;
  maxValue: number;
  rows: MarketCapFrameRow[];
};

type CsvRow = {
  year: number;
  name: string;
  code: string;
  country: string;
  value: number;
  rank: number;
  source: string;
};

const REQUIRED_HEADERS = ['year', 'name', 'code', 'region', 'value', 'rank'] as const;

export const buildMarketCapRaceData = (csv: string): MarketCapRaceData => {
  const rows = parseCsv(csv);
  const entityById = new Map<string, MarketCapEntity>();
  const rowsByYear = new Map<number, CsvRow[]>();

  for (const row of rows) {
    const id = idForRow(row);
    const existing = entityById.get(id);

    entityById.set(id, {
      id,
      name: existing?.name || row.name,
      code: existing?.code || row.code,
      country: existing?.country || row.country,
      source: existing?.source || row.source,
    });

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

export const getMarketCapFrameState = ({
  data,
  durationInFrames,
  frame,
  topN,
}: {
  data: MarketCapRaceData;
  durationInFrames: number;
  frame: number;
  topN: number;
}): MarketCapFrameState => {
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const prevSnapshot = data.snapshots[segmentIndex] ?? data.snapshots[0];
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? prevSnapshot;
  const segmentProgress = progress === 1 ? 1 : scaled - segmentIndex;
  const valueProgress = segmentProgress;
  const year = progress === 1 ? nextSnapshot.year : prevSnapshot.year;
  const rawRows = data.entities.map((entity) => {
    const previousValue = prevSnapshot.values.get(entity.id) ?? 0;
    const targetValue = nextSnapshot.values.get(entity.id) ?? 0;
    const value = previousValue + (targetValue - previousValue) * valueProgress;
    const previousRank = prevSnapshot.ranks.get(entity.id) ?? data.entities.length + 1;
    const targetRank = nextSnapshot.ranks.get(entity.id) ?? data.entities.length + 1;
    const topNPresence = clamp(
      (previousRank <= topN ? 1 - valueProgress : 0) +
        (targetRank <= topN ? valueProgress : 0),
      0,
      1,
    );

    return {
      ...entity,
      country:
        nextSnapshot.countries.get(entity.id) ||
        prevSnapshot.countries.get(entity.id) ||
        entity.country,
      source:
        nextSnapshot.sources.get(entity.id) ||
        prevSnapshot.sources.get(entity.id) ||
        entity.source,
      value,
      previousValue,
      targetValue,
      liveRank: 0,
      displayRank: 0,
      previousRank,
      targetRank,
      topNPresence,
      opacity: 1,
    };
  });
  const rankedRows = [...rawRows]
    .filter((row) => row.value > 0.001)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  for (let index = 0; index < rankedRows.length; index += 1) {
    rankedRows[index].liveRank = index + 1;
    rankedRows[index].displayRank = index + 1;
  }

  const maxValue = Math.max(1, ...rankedRows.map((row) => row.value));
  const rows = rankedRows
    .filter((row) =>
      row.liveRank <= topN ||
      row.previousRank <= topN ||
      row.targetRank <= topN
    )
    .map((row) => ({
      ...row,
      opacity:
        clamp(row.value / Math.max(1, maxValue * 0.018), 0.18, 1) *
        clamp(row.topNPresence || (row.liveRank <= topN ? 1 : 0), 0, 1),
    }));

  return {
    year,
    yearProgress: progress,
    segmentProgress: valueProgress,
    maxValue,
    rows,
  };
};

const buildSnapshot = (
  year: number,
  rows: CsvRow[],
  entities: MarketCapEntity[],
): MarketCapSnapshot => {
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();
  const countries = new Map<string, string>();
  const sources = new Map<string, string>();

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
  }

  for (const row of rows) {
    const id = idForRow(row);
    values.set(id, row.value);
    ranks.set(id, row.rank);
    countries.set(id, row.country);
    sources.set(id, row.source);
  }

  return {
    year,
    values,
    ranks,
    countries,
    sources,
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
    const valueFor = (header: string) => columns[headerIndex.get(header) ?? -1] ?? '';

    return {
      year: Number(valueFor('year')),
      name: valueFor('name'),
      code: valueFor('code'),
      country: valueFor('region'),
      value: Number(valueFor('value')),
      rank: Number(valueFor('rank') || 0),
      source: valueFor('source'),
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

const idForRow = (row: Pick<CsvRow, 'code' | 'name'>) =>
  `${row.code || row.name}:${row.name}`.toLowerCase();

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
