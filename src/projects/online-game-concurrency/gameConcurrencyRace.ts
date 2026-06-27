export type GameConcurrencyEntity = {
  id: string;
  name: string;
  code: string;
  region: string;
  color: string;
  imageUrl: string;
  platformScope: string;
  metricContext: string;
  confidence: string;
};

export type GameConcurrencyRaceData = {
  entities: GameConcurrencyEntity[];
  snapshots: GameConcurrencySnapshot[];
  minYear: number;
  maxYear: number;
  minMonthIndex: number;
  maxMonthIndex: number;
};

export type GameConcurrencySnapshot = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  values: Map<string, number>;
  ranks: Map<string, number>;
  imageUrls: Map<string, string>;
  regions: Map<string, string>;
  platformScopes: Map<string, string>;
  metricContexts: Map<string, string>;
  maxValue: number;
};

export type GameConcurrencyRaceRow = GameConcurrencyEntity & {
  value: number;
  previousValue: number;
  targetValue: number;
  valueDelta: number;
  valueTrend: -1 | 0 | 1;
  previousValueTrend: -1 | 0 | 1;
  valueTrendBlend: number;
  animatedRank: number;
  liveRank: number;
  displayRank: number;
  opacity: number;
  imageUrl: string;
  region: string;
  platformScope: string;
  metricContext: string;
};

export type GameConcurrencyFrameState = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  segmentProgress: number;
  transitionPulse: number;
  maxValue: number;
  rows: GameConcurrencyRaceRow[];
};

type CsvRow = {
  date: string;
  year: number;
  month: number;
  name: string;
  code: string;
  region: string;
  value: number;
  rank: number;
  color: string;
  imageUrl: string;
  platformScope: string;
  metricContext: string;
  confidence: string;
};

type BuildGameConcurrencyRaceDataOptions = {
  dataCadence?: 'monthly' | 'yearly';
  startDate?: string;
};

type SegmentSnapshots = {
  leadingSnapshot: GameConcurrencySnapshot;
  prevSnapshot: GameConcurrencySnapshot;
  nextSnapshot: GameConcurrencySnapshot;
  trailingSnapshot: GameConcurrencySnapshot;
};

const REQUIRED_HEADERS = ['date', 'year', 'month', 'rank', 'name', 'code', 'value'] as const;

export const buildGameConcurrencyRaceData = (
  csv: string,
  options: BuildGameConcurrencyRaceDataOptions = {},
): GameConcurrencyRaceData => {
  const filteredRows = parseCsv(csv).filter((row) =>
    !options.startDate || row.date >= options.startDate
  );
  const rows = selectRowsByDataCadence(
    filteredRows,
    options.dataCadence ?? 'monthly',
  );
  const entityById = new Map<string, GameConcurrencyEntity>();
  const rowsByDate = new Map<string, CsvRow[]>();

  for (const row of filteredRows) {
    const existing = entityById.get(row.code);

    if (!existing) {
      entityById.set(row.code, {
        id: row.code,
        name: row.name,
        code: row.code,
        region: row.region,
        color: row.color,
        imageUrl: row.imageUrl,
        platformScope: row.platformScope,
        metricContext: row.metricContext,
        confidence: row.confidence,
      });
      continue;
    }

    entityById.set(row.code, {
      ...existing,
      color: existing.color || row.color,
      confidence: existing.confidence || row.confidence,
      imageUrl: existing.imageUrl || row.imageUrl,
      metricContext: existing.metricContext || row.metricContext,
      platformScope: existing.platformScope || row.platformScope,
      region: existing.region || row.region,
    });
  }

  for (const row of rows) {
    const snapshotRows = rowsByDate.get(row.date) ?? [];
    snapshotRows.push(row);
    rowsByDate.set(row.date, snapshotRows);
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
  };
};

const selectRowsByDataCadence = (
  rows: CsvRow[],
  dataCadence: NonNullable<BuildGameConcurrencyRaceDataOptions['dataCadence']>,
) => {
  if (dataCadence === 'monthly') {
    return rows;
  }

  const latestDateByYear = new Map<number, string>();

  for (const row of rows) {
    const latestDate = latestDateByYear.get(row.year);

    if (!latestDate || row.date > latestDate) {
      latestDateByYear.set(row.year, row.date);
    }
  }

  const selectedDates = new Set(latestDateByYear.values());

  return rows.filter((row) => selectedDates.has(row.date));
};

export const getGameConcurrencyFrameState = ({
  data,
  frame,
  durationInFrames,
  topN,
}: {
  data: GameConcurrencyRaceData;
  frame: number;
  durationInFrames: number;
  topN: number;
}): GameConcurrencyFrameState => {
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const prevSnapshot = data.snapshots[segmentIndex] ?? data.snapshots[0];
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? prevSnapshot;
  const leadingSnapshot = data.snapshots[Math.max(0, segmentIndex - 1)] ?? prevSnapshot;
  const trailingSnapshot =
    data.snapshots[Math.min(data.snapshots.length - 1, segmentIndex + 2)] ?? nextSnapshot;
  const nearestSnapshot =
    data.snapshots[Math.min(data.snapshots.length - 1, Math.round(scaled))] ?? prevSnapshot;
  const segmentProgress = progress === 1 ? 1 : scaled - segmentIndex;
  const splineProgress = segmentProgress;
  const displaySnapshot = progress >= 1 ? nextSnapshot : prevSnapshot;
  const monthIndex = interpolateSnapshotSpline(
    leadingSnapshot,
    prevSnapshot,
    nextSnapshot,
    trailingSnapshot,
    (snapshot) => snapshot.monthIndex,
    splineProgress,
  );
  const rows = data.entities.map((entity) => {
    const leadingValue = leadingSnapshot.values.get(entity.id) ?? 0;
    const previousValue = prevSnapshot.values.get(entity.id) ?? 0;
    const targetValue = nextSnapshot.values.get(entity.id) ?? previousValue;
    const rawValue = interpolateSnapshotSpline(
      leadingSnapshot,
      prevSnapshot,
      nextSnapshot,
      trailingSnapshot,
      (snapshot) => snapshot.values.get(entity.id) ?? 0,
      splineProgress,
    );
    const value = clamp(
      rawValue,
      Math.max(0, Math.min(previousValue, targetValue)),
      Math.max(previousValue, targetValue),
    );
    const valueDelta = targetValue - previousValue;
    const valueTrend = trendForDelta(valueDelta);
    const previousValueTrend = trendForDelta(previousValue - leadingValue);
    const valueTrendBlend = smootherStep(
      clamp(splineProgress / VALUE_TREND_BLEND_DURATION, 0, 1),
    );

    return {
      ...entity,
      value,
      previousValue,
      targetValue,
      valueDelta,
      valueTrend,
      previousValueTrend,
      valueTrendBlend,
      animatedRank: topN + 1.35,
      liveRank: 0,
      displayRank: 0,
      opacity: 1,
      imageUrl: displaySnapshot.imageUrls.get(entity.id) ||
        nearestSnapshot.imageUrls.get(entity.id) ||
        entity.imageUrl,
      metricContext: displaySnapshot.metricContexts.get(entity.id) ||
        nearestSnapshot.metricContexts.get(entity.id) ||
        entity.metricContext,
      platformScope: displaySnapshot.platformScopes.get(entity.id) ||
        nearestSnapshot.platformScopes.get(entity.id) ||
        entity.platformScope,
      region: displaySnapshot.regions.get(entity.id) ||
        nearestSnapshot.regions.get(entity.id) ||
        entity.region,
    };
  });
  const byValue = [...rows].sort(compareRowsByValue);
  const segmentSnapshots = {
    leadingSnapshot,
    prevSnapshot,
    nextSnapshot,
    trailingSnapshot,
  };

  for (let index = 0; index < byValue.length; index += 1) {
    byValue[index].liveRank = index + 1;
  }

  for (const row of rows) {
    row.animatedRank = crossingAnimatedRank(row, rows, segmentSnapshots, splineProgress, topN);
  }

  const visibleRows = rows
    .filter((row) =>
      row.value > 0.001 &&
      (row.animatedRank <= topN + 0.95 || row.liveRank <= topN)
    )
    .map((row) => ({
      ...row,
      opacity: row.liveRank <= topN
        ? 1
        : Math.max(0, 1 - (row.animatedRank - topN) / 0.95),
    }))
    .sort((a, b) =>
      a.animatedRank - b.animatedRank ||
      a.liveRank - b.liveRank ||
      a.name.localeCompare(b.name)
    )
    .slice(0, topN + 2)
    .map((row) => ({
      ...row,
      displayRank: row.liveRank,
    }));
  const visibleMaxValue = Math.max(
    1,
    ...visibleRows.map((row) => row.value),
  );

  return {
    date: displaySnapshot.date,
    year: displaySnapshot.year,
    month: displaySnapshot.month,
    monthIndex,
    segmentProgress: splineProgress,
    transitionPulse: Math.sin(splineProgress * Math.PI),
    maxValue: visibleMaxValue,
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
    const valueFor = (header: string) => columns[headerIndex.get(header) ?? -1] ?? '';

    return {
      code: valueFor('code'),
      color: valueFor('color') || '#45E3AE',
      confidence: valueFor('confidence'),
      date: valueFor('date'),
      imageUrl: valueFor('imageUrl') || valueFor('image_url'),
      metricContext: valueFor('metricContext') || valueFor('metric_context'),
      month: Number(valueFor('month') || 1),
      name: valueFor('name'),
      platformScope: valueFor('platformScope') || valueFor('platform_scope'),
      rank: Number(valueFor('rank') || 0),
      region: valueFor('region'),
      value: Number(valueFor('value') || 0),
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

const buildSnapshot = (
  date: string,
  rows: CsvRow[],
  entities: GameConcurrencyEntity[],
): GameConcurrencySnapshot => {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();
  const imageUrls = new Map<string, string>();
  const regions = new Map<string, string>();
  const platformScopes = new Map<string, string>();
  const metricContexts = new Map<string, string>();

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
  }

  for (const row of rows) {
    values.set(row.code, row.value);
    ranks.set(row.code, row.rank || entities.length + 1);
    imageUrls.set(row.code, row.imageUrl);
    regions.set(row.code, row.region);
    platformScopes.set(row.code, row.platformScope);
    metricContexts.set(row.code, row.metricContext);
  }

  return {
    date,
    year,
    month,
    monthIndex: getMonthIndex(year, month),
    values,
    ranks,
    imageUrls,
    regions,
    platformScopes,
    metricContexts,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
  };
};

const compareRowsByValue = (a: GameConcurrencyRaceRow, b: GameConcurrencyRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const crossingAnimatedRank = (
  row: GameConcurrencyRaceRow,
  rows: GameConcurrencyRaceRow[],
  segmentSnapshots: SegmentSnapshots,
  progress: number,
  topN: number,
) => {
  if (row.previousValue <= 0.001 && row.targetValue <= 0.001) {
    return topN + 1.35;
  }

  if (progress <= 0) {
    return staticRankFor(row, rows, 'previousValue', topN);
  }

  if (progress >= 1) {
    return staticRankFor(row, rows, 'targetValue', topN);
  }

  let rank = 1;

  for (const other of rows) {
    if (
      other.id === row.id ||
      (other.previousValue <= 0.001 && other.targetValue <= 0.001)
    ) {
      continue;
    }

    const startLead = compareByValue(
      other.previousValue,
      other.name,
      row.previousValue,
      row.name,
    ) < 0;
    const targetLead = compareByValue(
      other.targetValue,
      other.name,
      row.targetValue,
      row.name,
    ) < 0;

    if (startLead === targetLead) {
      rank += startLead ? 1 : 0;
      continue;
    }

    const crossingProgress = crossingProgressFor(row, other, segmentSnapshots);
    const localProgress = clamp(
      (progress - (crossingProgress - RANK_TRANSITION_DURATION / 2)) / RANK_TRANSITION_DURATION,
      0,
      1,
    );
    const easedProgress = smootherStep(localProgress);
    rank += startLead
      ? 1 - easedProgress
      : easedProgress;
  }

  return clamp(rank, 1, topN + 1.35);
};

const staticRankFor = (
  row: GameConcurrencyRaceRow,
  rows: GameConcurrencyRaceRow[],
  valueKey: 'previousValue' | 'targetValue',
  topN: number,
) => {
  let rank = 1;

  for (const other of rows) {
    if (
      other.id === row.id ||
      (other.previousValue <= 0.001 && other.targetValue <= 0.001)
    ) {
      continue;
    }

    if (compareByValue(other[valueKey], other.name, row[valueKey], row.name) < 0) {
      rank += 1;
    }
  }

  return clamp(rank, 1, topN + 1.35);
};

const RANK_TRANSITION_DURATION = 0.08;
const VALUE_TREND_BLEND_DURATION = 0.16;

const trendForDelta = (delta: number): -1 | 0 | 1 => {
  if (delta > 0.001) {
    return 1;
  }

  if (delta < -0.001) {
    return -1;
  }

  return 0;
};

const compareByValue = (
  valueA: number,
  nameA: string,
  valueB: number,
  nameB: string,
) => valueB - valueA || nameA.localeCompare(nameB);

const crossingProgressFor = (
  row: GameConcurrencyRaceRow,
  other: GameConcurrencyRaceRow,
  segmentSnapshots: SegmentSnapshots,
) => {
  const startLead = isOtherAheadAtProgress(row, other, segmentSnapshots, 0);
  let lower = 0;
  let upper = 1;

  for (let index = 0; index < 12; index += 1) {
    const middle = (lower + upper) / 2;

    if (isOtherAheadAtProgress(row, other, segmentSnapshots, middle) === startLead) {
      lower = middle;
    } else {
      upper = middle;
    }
  }

  return (lower + upper) / 2;
};

const isOtherAheadAtProgress = (
  row: GameConcurrencyRaceRow,
  other: GameConcurrencyRaceRow,
  segmentSnapshots: SegmentSnapshots,
  progress: number,
) => compareByValue(
  interpolatedValueAtProgress(other.id, segmentSnapshots, progress),
  other.name,
  interpolatedValueAtProgress(row.id, segmentSnapshots, progress),
  row.name,
) < 0;

const interpolatedValueAtProgress = (
  entityId: string,
  {
    leadingSnapshot,
    prevSnapshot,
    nextSnapshot,
    trailingSnapshot,
  }: SegmentSnapshots,
  progress: number,
) => {
  const previousValue = prevSnapshot.values.get(entityId) ?? 0;
  const targetValue = nextSnapshot.values.get(entityId) ?? previousValue;
  const rawValue = interpolateSnapshotSpline(
    leadingSnapshot,
    prevSnapshot,
    nextSnapshot,
    trailingSnapshot,
    (snapshot) => snapshot.values.get(entityId) ?? 0,
    progress,
  );

  return clamp(
    rawValue,
    Math.max(0, Math.min(previousValue, targetValue)),
    Math.max(previousValue, targetValue),
  );
};

const interpolateSnapshotSpline = (
  p0: GameConcurrencySnapshot,
  p1: GameConcurrencySnapshot,
  p2: GameConcurrencySnapshot,
  p3: GameConcurrencySnapshot,
  valueFor: (snapshot: GameConcurrencySnapshot) => number,
  progress: number,
) => catmullRom(
  valueFor(p0),
  valueFor(p1),
  valueFor(p2),
  valueFor(p3),
  clamp(progress, 0, 1),
);

const getMonthIndex = (year: number, month: number) => year * 12 + month - 1;

const catmullRom = (
  point0: number,
  point1: number,
  point2: number,
  point3: number,
  progress: number,
) => {
  const t = clamp(progress, 0, 1);
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    (2 * point1) +
    ((-point0 + point2) * t) +
    ((2 * point0 - 5 * point1 + 4 * point2 - point3) * t2) +
    ((-point0 + 3 * point1 - 3 * point2 + point3) * t3)
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};
