export type MobileGameEntity = {
  id: string;
  name: string;
  code: string;
  publisher: string;
  region: string;
  color: string;
  sourceGroup: string;
};

export type MobileGameSnapshot = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  values: Map<string, number>;
  ranks: Map<string, number>;
  publishers: Map<string, string>;
  regions: Map<string, string>;
  sourceGroups: Map<string, string>;
  maxValue: number;
};

export type MobileGameRaceData = {
  entities: MobileGameEntity[];
  snapshots: MobileGameSnapshot[];
  minYear: number;
  maxYear: number;
  minMonthIndex: number;
  maxMonthIndex: number;
};

export type MobileGameRaceRow = MobileGameEntity & {
  value: number;
  previousValue: number;
  targetValue: number;
  animatedRank: number;
  liveRank: number;
  displayRank: number;
  opacity: number;
  publisher: string;
  region: string;
  sourceGroup: string;
};

export type MobileGameFrameState = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  segmentProgress: number;
  transitionPulse: number;
  maxValue: number;
  rows: MobileGameRaceRow[];
};

type SegmentSnapshots = {
  nextSnapshot: MobileGameSnapshot;
  prevSnapshot: MobileGameSnapshot;
};

type CsvRow = {
  date: string;
  year: number;
  month: number;
  rank: number;
  name: string;
  code: string;
  publisher: string;
  region: string;
  value: number;
  color: string;
  sourceGroup: string;
};

const REQUIRED_HEADERS = ['date', 'year', 'month', 'rank', 'name', 'code', 'value'] as const;

export const buildMobileGameRaceData = (csv: string): MobileGameRaceData => {
  const rows = parseCsv(csv);
  const entityById = new Map<string, MobileGameEntity>();
  const rowsByDate = new Map<string, CsvRow[]>();

  for (const row of rows) {
    if (!entityById.has(row.code)) {
      entityById.set(row.code, {
        id: row.code,
        name: row.name,
        code: row.code,
        publisher: row.publisher,
        region: row.region,
        color: row.color,
        sourceGroup: row.sourceGroup,
      });
    }

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

export const getMobileGameFrameState = ({
  data,
  durationInFrames,
  frame,
  topN,
}: {
  data: MobileGameRaceData;
  durationInFrames: number;
  frame: number;
  topN: number;
}): MobileGameFrameState => {
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const prevSnapshot = data.snapshots[segmentIndex] ?? data.snapshots[0];
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? prevSnapshot;
  const nearestSnapshot =
    data.snapshots[Math.min(data.snapshots.length - 1, Math.round(scaled))] ?? prevSnapshot;
  const segmentProgress = progress === 1 ? 1 : scaled - segmentIndex;
  const easedProgress = smootherStep(segmentProgress);
  const displaySnapshot = easedProgress >= 0.5 ? nextSnapshot : prevSnapshot;
  const monthIndex = lerp(prevSnapshot.monthIndex, nextSnapshot.monthIndex, easedProgress);
  const offscreenRank = topN + 1.35;
  const rows = data.entities.map((entity) => {
    const previousValue = prevSnapshot.values.get(entity.id) ?? 0;
    const targetValue = nextSnapshot.values.get(entity.id) ?? previousValue;
    const value = lerp(previousValue, targetValue, easedProgress);
    const previousRank = previousValue > 0
      ? prevSnapshot.ranks.get(entity.id) ?? offscreenRank
      : offscreenRank;
    const targetRank = targetValue > 0
      ? nextSnapshot.ranks.get(entity.id) ?? offscreenRank
      : offscreenRank;

    return {
      ...entity,
      value,
      previousValue,
      targetValue,
      animatedRank: lerp(previousRank, targetRank, easedProgress),
      liveRank: 0,
      displayRank: 0,
      opacity: 1,
      publisher: displaySnapshot.publishers.get(entity.id) ||
        nearestSnapshot.publishers.get(entity.id) ||
        entity.publisher,
      region: displaySnapshot.regions.get(entity.id) ||
        nearestSnapshot.regions.get(entity.id) ||
        entity.region,
      sourceGroup: displaySnapshot.sourceGroups.get(entity.id) ||
        nearestSnapshot.sourceGroups.get(entity.id) ||
        entity.sourceGroup,
    };
  });
  const byValue = [...rows].sort(compareRowsByValue);
  const segmentSnapshots = {
    nextSnapshot,
    prevSnapshot,
  };

  for (let index = 0; index < byValue.length; index += 1) {
    byValue[index].liveRank = index + 1;
  }

  for (const row of rows) {
    row.animatedRank = crossingAnimatedRank(row, rows, segmentSnapshots, segmentProgress, topN);
  }

  const visibleRows = rows
    .filter((row) =>
      row.value > 0.001 &&
      (row.animatedRank <= topN + 0.95 || row.liveRank <= topN)
    )
    .map((row) => ({
      ...row,
      displayRank: row.liveRank,
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
    .map((row, index) => ({
      ...row,
      animatedRank: index + 1,
    }));

  return {
    date: nearestSnapshot.date,
    year: nearestSnapshot.year,
    month: nearestSnapshot.month,
    monthIndex,
    segmentProgress: easedProgress,
    transitionPulse: Math.sin(easedProgress * Math.PI),
    maxValue: 10,
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
      date: valueFor('date'),
      month: Number(valueFor('month') || 12),
      name: valueFor('name'),
      publisher: valueFor('publisher'),
      rank: Number(valueFor('rank') || 0),
      region: valueFor('region'),
      sourceGroup: valueFor('sourceGroup') || valueFor('source_group'),
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
  entities: MobileGameEntity[],
): MobileGameSnapshot => {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();
  const publishers = new Map<string, string>();
  const regions = new Map<string, string>();
  const sourceGroups = new Map<string, string>();

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
  }

  for (const row of rows) {
    values.set(row.code, row.value);
    ranks.set(row.code, row.rank);
    publishers.set(row.code, row.publisher);
    regions.set(row.code, row.region);
    sourceGroups.set(row.code, row.sourceGroup);
  }

  return {
    date,
    year,
    month,
    monthIndex: getMonthIndex(year, month),
    values,
    ranks,
    publishers,
    regions,
    sourceGroups,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
  };
};

const compareRowsByValue = (a: MobileGameRaceRow, b: MobileGameRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const crossingAnimatedRank = (
  row: MobileGameRaceRow,
  rows: MobileGameRaceRow[],
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
  row: MobileGameRaceRow,
  rows: MobileGameRaceRow[],
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

const crossingProgressFor = (
  row: MobileGameRaceRow,
  other: MobileGameRaceRow,
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
  row: MobileGameRaceRow,
  other: MobileGameRaceRow,
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
  { nextSnapshot, prevSnapshot }: SegmentSnapshots,
  progress: number,
) => {
  const previousValue = prevSnapshot.values.get(entityId) ?? 0;
  const targetValue = nextSnapshot.values.get(entityId) ?? previousValue;

  return lerp(previousValue, targetValue, smootherStep(progress));
};

const compareByValue = (
  valueA: number,
  nameA: string,
  valueB: number,
  nameB: string,
) => valueB - valueA || nameA.localeCompare(nameB);

const RANK_TRANSITION_DURATION = 0.08;

const getMonthIndex = (year: number, month: number) => year * 12 + month - 1;

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const smootherStep = (value: number) => {
  const x = clamp(value, 0, 1);

  return x * x * x * (x * (x * 6 - 15) + 10);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
