export type SquadMarketCountry = {
  code: string;
  color: string;
  id: string;
  name: string;
  region: string;
  source: string;
};

export type SquadMarketSnapshot = {
  colors: Map<string, string>;
  coveragePercents: Map<string, number>;
  maxValue: number;
  missingPlayerCounts: Map<string, number>;
  playerCounts: Map<string, number>;
  ranks: Map<string, number>;
  regions: Map<string, string>;
  sources: Map<string, string>;
  values: Map<string, number>;
  valuedPlayerCounts: Map<string, number>;
  year: number;
};

export type SquadMarketRaceData = {
  countries: SquadMarketCountry[];
  maxYear: number;
  minYear: number;
  snapshots: SquadMarketSnapshot[];
};

export type SquadMarketFrameRow = SquadMarketCountry & {
  coveragePercent: number;
  displayRank: number;
  liveRank: number;
  missingPlayerCount: number;
  opacity: number;
  playerCount: number;
  previousRank: number;
  previousValue: number;
  targetRank: number;
  targetValue: number;
  topNPresence: number;
  value: number;
  valuedPlayerCount: number;
};

export type SquadMarketFrameState = {
  maxValue: number;
  previousYear: number;
  rows: SquadMarketFrameRow[];
  segmentProgress: number;
  targetYear: number;
  year: number;
  yearProgress: number;
};

type CsvRow = {
  code: string;
  color: string;
  coveragePercent: number;
  missingPlayerCount: number;
  name: string;
  playerCount: number;
  rank: number;
  region: string;
  source: string;
  value: number;
  valuedPlayerCount: number;
  year: number;
};

const REQUIRED_HEADERS = ['year', 'name', 'code', 'region', 'value', 'color', 'rank'] as const;

export const buildSquadMarketRaceData = (csv: string): SquadMarketRaceData => {
  const rows = parseCsv(csv);
  const countryById = new Map<string, SquadMarketCountry>();
  const rowsByYear = new Map<number, CsvRow[]>();

  for (const row of rows) {
    const id = idForRow(row);
    const existing = countryById.get(id);

    countryById.set(id, {
      code: existing?.code || row.code,
      color: existing?.color || row.color,
      id,
      name: existing?.name || row.name,
      region: existing?.region || row.region,
      source: existing?.source || row.source,
    });

    const yearRows = rowsByYear.get(row.year) ?? [];
    yearRows.push(row);
    rowsByYear.set(row.year, yearRows);
  }

  const countries = [...countryById.values()].sort((countryA, countryB) =>
    countryA.name.localeCompare(countryB.name),
  );
  const snapshots = [...rowsByYear.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, yearRows]) => buildSnapshot(year, yearRows, countries));
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    countries,
    maxYear: lastSnapshot?.year ?? 0,
    minYear: firstSnapshot?.year ?? 0,
    snapshots,
  };
};

export const getSquadMarketFrameState = ({
  data,
  durationInFrames,
  frame,
  topN,
}: {
  data: SquadMarketRaceData;
  durationInFrames: number;
  frame: number;
  topN: number;
}): SquadMarketFrameState => {
  const firstSnapshot = data.snapshots[0];
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const previousSnapshot = data.snapshots[segmentIndex] ?? firstSnapshot;
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? previousSnapshot;
  const rawSegmentProgress = progress === 1 ? 1 : scaled - segmentIndex;
  const valueProgress = easeInOutCubic(rawSegmentProgress);

  const rawRows = data.countries.map((country) => {
    const previousValue = previousSnapshot?.values.get(country.id) ?? 0;
    const targetValue = nextSnapshot?.values.get(country.id) ?? 0;
    const value = previousValue + (targetValue - previousValue) * valueProgress;
    const previousRank = previousSnapshot?.ranks.get(country.id) ?? data.countries.length + 1;
    const targetRank = nextSnapshot?.ranks.get(country.id) ?? data.countries.length + 1;
    const topNPresence = clamp(
      (previousRank <= topN ? 1 - rawSegmentProgress : 0) +
        (targetRank <= topN ? rawSegmentProgress : 0),
      0,
      1,
    );

    return {
      ...country,
      color:
        nextSnapshot?.colors.get(country.id) ||
        previousSnapshot?.colors.get(country.id) ||
        country.color,
      coveragePercent: lerpSnapshotMetric(
        previousSnapshot?.coveragePercents,
        nextSnapshot?.coveragePercents,
        country.id,
        valueProgress,
      ),
      displayRank: 0,
      liveRank: 0,
      missingPlayerCount: Math.round(
        lerpSnapshotMetric(
          previousSnapshot?.missingPlayerCounts,
          nextSnapshot?.missingPlayerCounts,
          country.id,
          valueProgress,
        ),
      ),
      opacity: 1,
      playerCount: Math.round(
        lerpSnapshotMetric(
          previousSnapshot?.playerCounts,
          nextSnapshot?.playerCounts,
          country.id,
          valueProgress,
        ),
      ),
      previousRank,
      previousValue,
      region:
        nextSnapshot?.regions.get(country.id) ||
        previousSnapshot?.regions.get(country.id) ||
        country.region,
      source:
        nextSnapshot?.sources.get(country.id) ||
        previousSnapshot?.sources.get(country.id) ||
        country.source,
      targetRank,
      targetValue,
      topNPresence,
      value,
      valuedPlayerCount: Math.round(
        lerpSnapshotMetric(
          previousSnapshot?.valuedPlayerCounts,
          nextSnapshot?.valuedPlayerCounts,
          country.id,
          valueProgress,
        ),
      ),
    };
  });
  const rankedRows = rawRows
    .filter((row) => row.value > 0.001)
    .sort((rowA, rowB) => rowB.value - rowA.value || rowA.name.localeCompare(rowB.name));

  for (let index = 0; index < rankedRows.length; index += 1) {
    rankedRows[index].displayRank = index + 1;
    rankedRows[index].liveRank = index + 1;
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
        easeInOutCubic(clamp(row.topNPresence || (row.liveRank <= topN ? 1 : 0), 0, 1)),
    }));
  const displaySnapshot = progress === 1 || rawSegmentProgress >= 0.5 ? nextSnapshot : previousSnapshot;

  return {
    maxValue,
    previousYear: previousSnapshot?.year ?? 0,
    rows,
    segmentProgress: rawSegmentProgress,
    targetYear: nextSnapshot?.year ?? previousSnapshot?.year ?? 0,
    year: displaySnapshot?.year ?? 0,
    yearProgress: progress,
  };
};

const buildSnapshot = (
  year: number,
  rows: CsvRow[],
  countries: SquadMarketCountry[],
): SquadMarketSnapshot => {
  const colors = new Map<string, string>();
  const coveragePercents = new Map<string, number>();
  const missingPlayerCounts = new Map<string, number>();
  const playerCounts = new Map<string, number>();
  const ranks = new Map<string, number>();
  const regions = new Map<string, string>();
  const sources = new Map<string, string>();
  const values = new Map<string, number>();
  const valuedPlayerCounts = new Map<string, number>();

  for (const country of countries) {
    colors.set(country.id, country.color);
    coveragePercents.set(country.id, 0);
    missingPlayerCounts.set(country.id, 0);
    playerCounts.set(country.id, 0);
    ranks.set(country.id, countries.length + 1);
    regions.set(country.id, country.region);
    sources.set(country.id, country.source);
    values.set(country.id, 0);
    valuedPlayerCounts.set(country.id, 0);
  }

  for (const row of rows) {
    const id = idForRow(row);

    colors.set(id, row.color);
    coveragePercents.set(id, row.coveragePercent);
    missingPlayerCounts.set(id, row.missingPlayerCount);
    playerCounts.set(id, row.playerCount);
    ranks.set(id, row.rank);
    regions.set(id, row.region);
    sources.set(id, row.source);
    values.set(id, row.value);
    valuedPlayerCounts.set(id, row.valuedPlayerCount);
  }

  return {
    colors,
    coveragePercents,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
    missingPlayerCounts,
    playerCounts,
    ranks,
    regions,
    sources,
    values,
    valuedPlayerCounts,
    year,
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
      code: valueFor('code'),
      color: valueFor('color') || '#38BDF8',
      coveragePercent: Number(valueFor('coveragePercent') || 0),
      missingPlayerCount: Number(valueFor('missingPlayerCount') || 0),
      name: valueFor('name'),
      playerCount: Number(valueFor('playerCount') || 0),
      rank: Number(valueFor('rank') || 0),
      region: valueFor('region'),
      source: valueFor('source'),
      value: Number(valueFor('value')),
      valuedPlayerCount: Number(valueFor('valuedPlayerCount') || 0),
      year: Number(valueFor('year')),
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

const lerpSnapshotMetric = (
  previousMap: Map<string, number> | undefined,
  nextMap: Map<string, number> | undefined,
  id: string,
  progress: number,
) => {
  const previous = previousMap?.get(id) ?? 0;
  const next = nextMap?.get(id) ?? 0;

  return previous + (next - previous) * progress;
};

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
