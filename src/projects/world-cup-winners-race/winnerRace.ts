export type WorldCupWinnerEntity = {
  code: string;
  color: string;
  flag: string;
  id: string;
  name: string;
  region: string;
};

export type WorldCupWinnerRaceData = {
  entities: WorldCupWinnerEntity[];
  maxMonthIndex: number;
  maxYear: number;
  minMonthIndex: number;
  minYear: number;
  snapshots: WorldCupWinnerSnapshot[];
};

export type WorldCupWinnerSnapshot = {
  date: string;
  flags: Map<string, string>;
  host: string;
  lastTitleYears: Map<string, number>;
  maxValue: number;
  month: number;
  monthIndex: number;
  ranks: Map<string, number>;
  tournamentWinnerCode: string;
  values: Map<string, number>;
  year: number;
};

export type WorldCupWinnerRaceRow = WorldCupWinnerEntity & {
  animatedRank: number;
  displayRank: number;
  flag: string;
  lastTitleYear: number;
  liveRank: number;
  opacity: number;
  previousValue: number;
  previousValueTrend: -1 | 0 | 1;
  targetValue: number;
  value: number;
  valueDelta: number;
  valueTrend: -1 | 0 | 1;
  valueTrendBlend: number;
};

export type WorldCupWinnerFrameState = {
  date: string;
  host: string;
  incomingWinnerCode: string;
  incomingWinnerFlag: string;
  incomingWinnerName: string;
  maxValue: number;
  month: number;
  monthIndex: number;
  rows: WorldCupWinnerRaceRow[];
  segmentProgress: number;
  transitionPulse: number;
  winnerCode: string;
  winnerFlag: string;
  winnerName: string;
  year: number;
};

type CsvRow = {
  code: string;
  color: string;
  date: string;
  flag: string;
  host: string;
  isTournamentWinner: boolean;
  lastTitleYear: number;
  month: number;
  name: string;
  rank: number;
  region: string;
  value: number;
  year: number;
};

type SegmentSnapshots = {
  leadingSnapshot: WorldCupWinnerSnapshot;
  nextSnapshot: WorldCupWinnerSnapshot;
  prevSnapshot: WorldCupWinnerSnapshot;
  trailingSnapshot: WorldCupWinnerSnapshot;
};

const REQUIRED_HEADERS = ['date', 'year', 'month', 'rank', 'name', 'code', 'value'] as const;

export const buildWorldCupWinnerRaceData = (csv: string): WorldCupWinnerRaceData => {
  const rows = parseCsv(csv);
  const entityById = new Map<string, WorldCupWinnerEntity>();
  const rowsByDate = new Map<string, CsvRow[]>();

  for (const row of rows) {
    const existing = entityById.get(row.code);

    entityById.set(row.code, {
      code: row.code,
      color: existing?.color || row.color,
      flag: existing?.flag || row.flag,
      id: row.code,
      name: row.name,
      region: existing?.region || row.region,
    });

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
    maxMonthIndex: lastSnapshot?.monthIndex ?? 0,
    maxYear: lastSnapshot?.year ?? 0,
    minMonthIndex: firstSnapshot?.monthIndex ?? 0,
    minYear: firstSnapshot?.year ?? 0,
    snapshots,
  };
};

export const getWorldCupWinnerFrameState = ({
  data,
  durationInFrames,
  frame,
  topN,
}: {
  data: WorldCupWinnerRaceData;
  durationInFrames: number;
  frame: number;
  topN: number;
}): WorldCupWinnerFrameState => {
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
  const displaySnapshot =
    progress >= 1 || segmentProgress >= DISPLAY_SNAPSHOT_SWITCH_PROGRESS
      ? nextSnapshot
      : prevSnapshot;
  const monthIndex = interpolateSnapshotSpline(
    leadingSnapshot,
    prevSnapshot,
    nextSnapshot,
    trailingSnapshot,
    (snapshot) => snapshot.monthIndex,
    segmentProgress,
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
      segmentProgress,
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
      clamp(segmentProgress / VALUE_TREND_BLEND_DURATION, 0, 1),
    );

    return {
      ...entity,
      animatedRank: topN + 1.35,
      displayRank: 0,
      flag: displaySnapshot.flags.get(entity.id) || nearestSnapshot.flags.get(entity.id) || entity.flag,
      lastTitleYear:
        displaySnapshot.lastTitleYears.get(entity.id) ||
        nearestSnapshot.lastTitleYears.get(entity.id) ||
        0,
      liveRank: 0,
      opacity: 1,
      previousValue,
      previousValueTrend,
      targetValue,
      value,
      valueDelta,
      valueTrend,
      valueTrendBlend,
    };
  });
  const byValue = [...rows].sort(compareRowsByValue);
  const segmentSnapshots = {
    leadingSnapshot,
    nextSnapshot,
    prevSnapshot,
    trailingSnapshot,
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
  const winner = data.entities.find((entity) => entity.id === displaySnapshot.tournamentWinnerCode);
  const incomingWinner = data.entities.find((entity) => entity.id === nextSnapshot.tournamentWinnerCode);

  return {
    date: displaySnapshot.date,
    host: displaySnapshot.host,
    incomingWinnerCode: nextSnapshot.tournamentWinnerCode,
    incomingWinnerFlag: incomingWinner?.flag ?? '',
    incomingWinnerName: incomingWinner?.name ?? '',
    maxValue: Math.max(1, ...visibleRows.map((row) => row.value)),
    month: displaySnapshot.month,
    monthIndex,
    rows: visibleRows,
    segmentProgress,
    transitionPulse: Math.sin(segmentProgress * Math.PI),
    winnerCode: displaySnapshot.tournamentWinnerCode,
    winnerFlag: winner?.flag ?? '',
    winnerName: winner?.name ?? '',
    year: displaySnapshot.year,
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
      flag: valueFor('flag'),
      host: valueFor('host'),
      isTournamentWinner: valueFor('isTournamentWinner') === 'true',
      lastTitleYear: Number(valueFor('lastTitleYear') || 0),
      month: Number(valueFor('month') || 7),
      name: valueFor('name'),
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
  entities: WorldCupWinnerEntity[],
): WorldCupWinnerSnapshot => {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();
  const flags = new Map<string, string>();
  const lastTitleYears = new Map<string, number>();
  const tournamentWinner = rows.find((row) => row.isTournamentWinner);

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
    flags.set(entity.id, entity.flag);
    lastTitleYears.set(entity.id, 0);
  }

  for (const row of rows) {
    values.set(row.code, row.value);
    ranks.set(row.code, row.rank || entities.length + 1);
    flags.set(row.code, row.flag);
    lastTitleYears.set(row.code, row.lastTitleYear);
  }

  return {
    date,
    flags,
    host: rows[0]?.host ?? '',
    lastTitleYears,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
    month,
    monthIndex: getMonthIndex(year, month),
    ranks,
    tournamentWinnerCode: tournamentWinner?.code ?? '',
    values,
    year,
  };
};

const compareRowsByValue = (a: WorldCupWinnerRaceRow, b: WorldCupWinnerRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const crossingAnimatedRank = (
  row: WorldCupWinnerRaceRow,
  rows: WorldCupWinnerRaceRow[],
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
  row: WorldCupWinnerRaceRow,
  rows: WorldCupWinnerRaceRow[],
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
const DISPLAY_SNAPSHOT_SWITCH_PROGRESS = 0.18;

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
  row: WorldCupWinnerRaceRow,
  other: WorldCupWinnerRaceRow,
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
  row: WorldCupWinnerRaceRow,
  other: WorldCupWinnerRaceRow,
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
    nextSnapshot,
    prevSnapshot,
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
  p0: WorldCupWinnerSnapshot,
  p1: WorldCupWinnerSnapshot,
  p2: WorldCupWinnerSnapshot,
  p3: WorldCupWinnerSnapshot,
  valueFor: (snapshot: WorldCupWinnerSnapshot) => number,
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
