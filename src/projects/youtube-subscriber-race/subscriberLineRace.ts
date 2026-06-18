export type SubscriberEntity = {
  id: string;
  name: string;
  code: string;
  region: string;
  color: string;
};

export type SubscriberRaceData = {
  entities: SubscriberEntity[];
  snapshots: SubscriberSnapshot[];
  minYear: number;
  maxYear: number;
  minMonthIndex: number;
  maxMonthIndex: number;
  globalMaxValue: number;
};

export type SubscriberSnapshot = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  values: Map<string, number>;
  ranks: Map<string, number>;
  maxValue: number;
};

export type SubscriberLinePoint = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  value: number;
};

export type SubscriberLineRaceRow = SubscriberEntity & {
  value: number;
  previousValue: number;
  targetValue: number;
  valueDelta: number;
  animatedRank: number;
  liveRank: number;
  displayRank: number;
  opacity: number;
  linePoints: SubscriberLinePoint[];
};

export type SubscriberFrameState = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  segmentProgress: number;
  progress: number;
  maxValue: number;
  globalMaxValue: number;
  rows: SubscriberLineRaceRow[];
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
};

type SegmentSnapshots = {
  prevSnapshot: SubscriberSnapshot;
  nextSnapshot: SubscriberSnapshot;
};

const REQUIRED_HEADERS = ['date', 'year', 'month', 'name', 'code', 'region', 'value', 'rank', 'color'] as const;

export const buildSubscriberRaceData = (csv: string): SubscriberRaceData => {
  const rows = parseCsv(csv);
  const entityById = new Map<string, SubscriberEntity>();
  const rowsByDate = new Map<string, CsvRow[]>();

  for (const row of rows) {
    if (!entityById.has(row.code)) {
      entityById.set(row.code, {
        id: row.code,
        name: row.name,
        code: row.code,
        region: row.region,
        color: row.color,
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
  const globalMaxValue = Math.max(...snapshots.map((snapshot) => snapshot.maxValue), 0);

  return {
    entities,
    snapshots,
    minYear: firstSnapshot?.year ?? 0,
    maxYear: lastSnapshot?.year ?? 0,
    minMonthIndex: firstSnapshot?.monthIndex ?? 0,
    maxMonthIndex: lastSnapshot?.monthIndex ?? 0,
    globalMaxValue,
  };
};

export const getSubscriberFrameState = ({
  data,
  frame,
  durationInFrames,
  topN,
}: {
  data: SubscriberRaceData;
  frame: number;
  durationInFrames: number;
  topN: number;
}): SubscriberFrameState => {
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const monthIndex = lerp(data.minMonthIndex, data.maxMonthIndex, progress);
  const { prevSnapshot, nextSnapshot } = getSegmentSnapshots(data.snapshots, monthIndex);
  const segmentProgress = prevSnapshot === nextSnapshot
    ? 1
    : clamp(
      (monthIndex - prevSnapshot.monthIndex) /
        Math.max(1, nextSnapshot.monthIndex - prevSnapshot.monthIndex),
      0,
      1,
    );
  const year = yearFromMonthIndex(monthIndex);
  const month = monthFromIndex(monthIndex);
  const rows = data.entities.map((entity) => {
    const previousValue = prevSnapshot.values.get(entity.id) ?? 0;
    const targetValue = nextSnapshot.values.get(entity.id) ?? previousValue;
    const value = lerp(previousValue, targetValue, segmentProgress);
    const previousRank = prevSnapshot.ranks.get(entity.id) ?? data.entities.length + 1;
    const targetRank = nextSnapshot.ranks.get(entity.id) ?? previousRank;
    const animatedRank = lerp(previousRank, targetRank, segmentProgress);
    const linePoints = buildLinePointsForEntity({
      currentMonthIndex: monthIndex,
      currentValue: value,
      data,
      entityId: entity.id,
    });

    return {
      ...entity,
      value,
      previousValue,
      targetValue,
      valueDelta: targetValue - previousValue,
      animatedRank,
      liveRank: 0,
      displayRank: 0,
      opacity: value > 0 ? 1 : 0.2,
      linePoints,
    };
  });
  const byValue = [...rows].sort(compareRowsByValue);

  byValue.forEach((row, index) => {
    row.liveRank = index + 1;
    row.displayRank = index + 1;
  });

  return {
    date: dateFromMonthIndex(monthIndex),
    year,
    month,
    monthIndex,
    segmentProgress,
    progress,
    maxValue: lerp(prevSnapshot.maxValue, nextSnapshot.maxValue, segmentProgress),
    globalMaxValue: data.globalMaxValue,
    rows: rows
      .filter((row) => row.liveRank <= topN)
      .sort((a, b) => a.liveRank - b.liveRank),
  };
};

const buildLinePointsForEntity = ({
  currentMonthIndex,
  currentValue,
  data,
  entityId,
}: {
  currentMonthIndex: number;
  currentValue: number;
  data: SubscriberRaceData;
  entityId: string;
}) => {
  const points = data.snapshots
    .filter((snapshot) => snapshot.monthIndex <= currentMonthIndex)
    .map((snapshot) => ({
      date: snapshot.date,
      year: snapshot.year,
      month: snapshot.month,
      monthIndex: snapshot.monthIndex,
      value: snapshot.values.get(entityId) ?? 0,
    }));
  const latestPoint = points.at(-1);

  if (!latestPoint || Math.abs(latestPoint.monthIndex - currentMonthIndex) > 0.001) {
    points.push({
      date: dateFromMonthIndex(currentMonthIndex),
      year: yearFromMonthIndex(currentMonthIndex),
      month: monthFromIndex(currentMonthIndex),
      monthIndex: currentMonthIndex,
      value: currentValue,
    });
  }

  return points;
};

const getSegmentSnapshots = (
  snapshots: SubscriberSnapshot[],
  monthIndex: number,
): SegmentSnapshots => {
  const nextIndex = snapshots.findIndex((snapshot) => snapshot.monthIndex >= monthIndex);

  if (nextIndex <= 0) {
    const snapshot = snapshots[0];
    return { prevSnapshot: snapshot, nextSnapshot: snapshot };
  }

  if (nextIndex === -1) {
    const snapshot = snapshots.at(-1) ?? snapshots[0];
    return { prevSnapshot: snapshot, nextSnapshot: snapshot };
  }

  return {
    prevSnapshot: snapshots[nextIndex - 1],
    nextSnapshot: snapshots[nextIndex],
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
      date: valueFor('date'),
      year: Number(valueFor('year')),
      month: Number(valueFor('month')),
      name: valueFor('name'),
      code: valueFor('code'),
      region: valueFor('region'),
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
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

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

const buildSnapshot = (
  date: string,
  rows: CsvRow[],
  entities: SubscriberEntity[],
): SubscriberSnapshot => {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
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

  return {
    date,
    year,
    month,
    monthIndex: getMonthIndex(year, month),
    values,
    ranks,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
  };
};

const compareRowsByValue = (a: SubscriberLineRaceRow, b: SubscriberLineRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const dateFromMonthIndex = (monthIndex: number) =>
  `${yearFromMonthIndex(monthIndex)}-${String(monthFromIndex(monthIndex)).padStart(2, '0')}-01`;

const getMonthIndex = (year: number, month: number) => year * 12 + month - 1;

const yearFromMonthIndex = (monthIndex: number) => Math.floor(Math.round(monthIndex) / 12);

const monthFromIndex = (monthIndex: number) => (Math.round(monthIndex) % 12) + 1;

const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
