import { worldCupHostingCostEntries, type WorldCupHostingCostEntry } from './config';

export type HostingCostRaceData = {
  entries: WorldCupHostingCostEntry[];
  maxMonthIndex: number;
  maxValue: number;
  minMonthIndex: number;
  snapshots: HostingCostSnapshot[];
};

export type HostingCostSnapshot = {
  date: string;
  month: number;
  monthIndex: number;
  values: Map<string, number>;
  year: number;
};

export type HostingCostRaceRow = WorldCupHostingCostEntry & {
  animatedRank: number;
  displayRank: number;
  entryProgress: number;
  liveRank: number;
  opacity: number;
  previousValue: number;
  targetValue: number;
  value: number;
};

export type HostingCostFrameState = {
  currentYear: number;
  maxValue: number;
  monthIndex: number;
  rows: HostingCostRaceRow[];
  transitionPulse: number;
};

type SegmentSnapshots = {
  leadingSnapshot: HostingCostSnapshot;
  prevSnapshot: HostingCostSnapshot;
  nextSnapshot: HostingCostSnapshot;
  trailingSnapshot: HostingCostSnapshot;
};

const topN = Math.min(worldCupHostingCostEntries.length, 10);

export const buildHostingCostRaceData = (): HostingCostRaceData => {
  const firstEntryYear = worldCupHostingCostEntries[0]?.year ?? 1994;
  const raceStartYear = firstEntryYear - ENTRY_BUILD_UP_YEARS;
  const minMonthIndex = getMonthIndex(raceStartYear, 1);
  const lastEntryYear = worldCupHostingCostEntries.at(-1)?.year ?? 2026;
  const snapshots = [
    buildSnapshot(raceStartYear, 1),
    ...worldCupHostingCostEntries.map((entry) => buildSnapshot(entry.year, 1)),
    buildSnapshot(lastEntryYear + 1, 1),
  ];
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots.at(-1);

  return {
    entries: worldCupHostingCostEntries,
    maxMonthIndex: lastSnapshot?.monthIndex ?? minMonthIndex,
    maxValue: Math.max(1, ...worldCupHostingCostEntries.map((entry) => entry.adjustedUsd2026)),
    minMonthIndex: firstSnapshot?.monthIndex ?? minMonthIndex,
    snapshots,
  };
};

export const getHostingCostFrameState = ({
  data,
  durationInFrames,
  frame,
}: {
  data: HostingCostRaceData;
  durationInFrames: number;
  frame: number;
}): HostingCostFrameState => {
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const monthIndex = data.minMonthIndex + progress * (data.maxMonthIndex - data.minMonthIndex);
  const rows = data.entries.map((entry) => {
    const entryProgress = revealProgressFor(entry, monthIndex);
    const hasStarted = entryHasStartedAtMonthIndex(entry, monthIndex);
    const value = valueForEntryAtMonthIndex(entry, monthIndex);

    return {
      ...entry,
      animatedRank: topN,
      displayRank: topN,
      entryProgress,
      liveRank: topN,
      opacity: hasStarted ? entryPresenceProgressFor(entry, monthIndex) : 0,
      previousValue: value,
      targetValue: value,
      value,
    };
  });
  const activeRows = rows.filter((row) => entryHasStartedAtMonthIndex(row, monthIndex));
  const byValue = [...activeRows].sort(compareRowsByValue);

  for (let index = 0; index < byValue.length; index += 1) {
    byValue[index].liveRank = index + 1;
  }

  for (const row of activeRows) {
    row.animatedRank = smoothAnimatedRank(row, activeRows, monthIndex);
  }

  const forcedEntryRow = activeRows
    .filter((row) => row.liveRank > topN && row.entryProgress < 1)
    .sort((a, b) =>
      getBuildUpStartMonthIndex(b) - getBuildUpStartMonthIndex(a) ||
      a.liveRank - b.liveRank ||
      b.value - a.value
    )[0];
  const candidateRows = activeRows
    .filter((row) => row.liveRank <= topN || row.animatedRank <= topN + RANK_ENTRY_BUFFER)
    .sort((a, b) =>
      Math.min(a.animatedRank, a.liveRank) - Math.min(b.animatedRank, b.liveRank) ||
      a.liveRank - b.liveRank ||
      a.host.localeCompare(b.host)
    );
  const primaryRows = candidateRows
    .filter((row) => row.code !== forcedEntryRow?.code)
    .slice(0, forcedEntryRow ? topN - 1 : topN);
  const visibleRows = forcedEntryRow
    ? [
        ...primaryRows,
        {
          ...forcedEntryRow,
          animatedRank: clamp(
            forcedEntryRow.animatedRank,
            topN,
            topN + ENTRY_LANE_VISIBLE_OFFSET,
          ),
        },
      ]
    : primaryRows;

  resolveAnimatedRankCollisions(visibleRows);

  const displayRows = visibleRows
    .sort((a, b) =>
      a.animatedRank - b.animatedRank ||
      a.liveRank - b.liveRank ||
      a.host.localeCompare(b.host)
    )
    .map((row, index) => ({
      ...row,
      displayRank: index + 1,
    }));
  const lastYear = worldCupHostingCostEntries.at(-1)?.year ?? 2026;
  const currentLeaderValue = Math.max(0, ...activeRows.map((row) => row.value));
  const frameMaxValue = Math.max(
    AXIS_MIN_VISIBLE_VALUE,
    currentLeaderValue * AXIS_LEADER_HEADROOM,
  );

  return {
    currentYear: clamp(
      getYearFromMonthIndex(monthIndex),
      getYearFromMonthIndex(data.minMonthIndex),
      lastYear,
    ),
    maxValue: frameMaxValue,
    monthIndex,
    rows: displayRows,
    transitionPulse: Math.sin(progress * Math.PI * worldCupHostingCostEntries.length),
  };
};

const resolveAnimatedRankCollisions = (rows: HostingCostRaceRow[]) => {
  if (rows.length === 0) {
    return;
  }

  const sortedRows = [...rows].sort((a, b) =>
    a.animatedRank - b.animatedRank ||
    a.liveRank - b.liveRank ||
    a.host.localeCompare(b.host)
  );
  const maxVisibleRank = topN + RANK_ENTRY_BUFFER;
  const adjustedRanks = sortedRows.map((row) => clamp(row.animatedRank, 1, maxVisibleRank));

  for (let index = 1; index < adjustedRanks.length; index += 1) {
    adjustedRanks[index] = Math.max(
      adjustedRanks[index],
      adjustedRanks[index - 1] + MIN_ANIMATED_RANK_GAP,
    );
  }

  adjustedRanks[adjustedRanks.length - 1] = Math.min(
    adjustedRanks[adjustedRanks.length - 1] ?? maxVisibleRank,
    maxVisibleRank,
  );

  for (let index = adjustedRanks.length - 2; index >= 0; index -= 1) {
    adjustedRanks[index] = Math.min(
      adjustedRanks[index],
      adjustedRanks[index + 1] - MIN_ANIMATED_RANK_GAP,
    );
  }

  if ((adjustedRanks[0] ?? 1) < 1) {
    const offset = 1 - adjustedRanks[0];

    for (let index = 0; index < adjustedRanks.length; index += 1) {
      adjustedRanks[index] += offset;
    }
  }

  for (let index = 0; index < sortedRows.length; index += 1) {
    sortedRows[index].animatedRank = clamp(adjustedRanks[index], 1, maxVisibleRank);
  }
};

const buildSnapshot = (year: number, month: number): HostingCostSnapshot => {
  const monthIndex = getMonthIndex(year, month);
  const values = new Map<string, number>();

  for (const entry of worldCupHostingCostEntries) {
    values.set(entry.code, valueForEntryAtMonthIndex(entry, monthIndex));
  }

  return {
    date: `${year}-${String(month).padStart(2, '0')}-01`,
    month,
    monthIndex,
    values,
    year,
  };
};

const revealProgressFor = (
  entry: WorldCupHostingCostEntry,
  monthIndex: number,
) => {
  const targetMonthIndex = getMonthIndex(entry.year, 1);
  const revealStartMonthIndex = targetMonthIndex - ENTRY_BUILD_UP_MONTHS;

  return clamp(
    (monthIndex - revealStartMonthIndex) / ENTRY_BUILD_UP_MONTHS,
    0,
    1,
  );
};

const valueForEntryAtMonthIndex = (entry: WorldCupHostingCostEntry, monthIndex: number) =>
  entry.adjustedUsd2026 * revealProgressFor(entry, monthIndex);

const entryHasStartedAtMonthIndex = (entry: WorldCupHostingCostEntry, monthIndex: number) =>
  monthIndex >= getEntryStageStartMonthIndex(entry);

const entryPresenceProgressFor = (
  entry: WorldCupHostingCostEntry,
  monthIndex: number,
) =>
  smootherStep(
    clamp(
      (monthIndex - getEntryStageStartMonthIndex(entry)) / ENTRY_FADE_IN_MONTHS,
      0,
      1,
    ),
  );

const smoothAnimatedRank = (
  row: HostingCostRaceRow,
  rows: HostingCostRaceRow[],
  monthIndex: number,
) => {
  let rank = 1;
  const rowValue = valueForEntryAtMonthIndex(row, monthIndex);

  for (const other of rows) {
    if (other.code === row.code) {
      continue;
    }

    const otherValue = valueForEntryAtMonthIndex(other, monthIndex);
    const difference = otherValue - rowValue;

    if (Math.abs(difference) < VALUE_TIE_EPSILON) {
      rank += compareRowsAtValues(other, row, otherValue, rowValue) < 0 ? 1 : 0;
      continue;
    }

    const smoothingRange = Math.max(
      VALUE_RANK_SMOOTHING_FLOOR,
      Math.max(row.adjustedUsd2026, other.adjustedUsd2026) * VALUE_RANK_SMOOTHING_RATIO,
    );
    rank += smootherStep(clamp(0.5 + difference / smoothingRange, 0, 1));
  }

  return clamp(rank, 1, rows.length);
};

const staticRankFor = (
  row: HostingCostRaceRow,
  rows: HostingCostRaceRow[],
  valueKey: 'previousValue' | 'targetValue',
) => {
  let rank = 1;

  for (const other of rows) {
    if (other.code === row.code) {
      continue;
    }

    if (
      compareByValue(
        other[valueKey],
        other.adjustedUsd2026,
        other.host,
        row[valueKey],
        row.adjustedUsd2026,
        row.host,
      ) < 0
    ) {
      rank += 1;
    }
  }

  return clamp(rank, 1, topN);
};

const crossingProgressFor = (
  row: HostingCostRaceRow,
  other: HostingCostRaceRow,
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
  row: HostingCostRaceRow,
  other: HostingCostRaceRow,
  segmentSnapshots: SegmentSnapshots,
  progress: number,
) => compareByValue(
  valueAtProgress(other, segmentSnapshots, progress),
  other.adjustedUsd2026,
  other.host,
  valueAtProgress(row, segmentSnapshots, progress),
  row.adjustedUsd2026,
  row.host,
) < 0;

const valueAtProgress = (
  entry: WorldCupHostingCostEntry,
  segmentSnapshots: SegmentSnapshots,
  progress: number,
) => valueForEntryAtMonthIndex(
  entry,
  interpolateMonthIndex(segmentSnapshots.prevSnapshot, segmentSnapshots.nextSnapshot, progress),
  );

const getSegmentSnapshotsForMonthIndex = (
  snapshots: HostingCostSnapshot[],
  monthIndex: number,
): SegmentSnapshots => {
  const nextGreaterIndex = snapshots.findIndex((snapshot) => snapshot.monthIndex > monthIndex);
  const nextIndex = nextGreaterIndex === -1
    ? snapshots.length - 1
    : Math.max(1, nextGreaterIndex);
  const prevIndex = Math.max(0, nextIndex - 1);
  const prevSnapshot = snapshots[prevIndex] ?? snapshots[0];
  const nextSnapshot = snapshots[nextIndex] ?? prevSnapshot;

  return {
    leadingSnapshot: snapshots[Math.max(0, prevIndex - 1)] ?? prevSnapshot,
    nextSnapshot,
    prevSnapshot,
    trailingSnapshot: snapshots[Math.min(snapshots.length - 1, nextIndex + 1)] ?? nextSnapshot,
  };
};

const compareRowsByValue = (a: HostingCostRaceRow, b: HostingCostRaceRow) =>
  compareRowsAtValues(a, b, a.value, b.value);

const compareRowsAtValues = (
  rowA: WorldCupHostingCostEntry,
  rowB: WorldCupHostingCostEntry,
  valueA: number,
  valueB: number,
) =>
  valueB - valueA ||
  getBuildUpStartMonthIndex(rowA) - getBuildUpStartMonthIndex(rowB) ||
  rowA.year - rowB.year ||
  rowA.host.localeCompare(rowB.host);

const compareByValue = (
  valueA: number,
  finalValueA: number,
  nameA: string,
  valueB: number,
  finalValueB: number,
  nameB: string,
) => valueB - valueA || finalValueB - finalValueA || nameA.localeCompare(nameB);

const interpolateMonthIndex = (
  prevSnapshot: HostingCostSnapshot,
  nextSnapshot: HostingCostSnapshot,
  progress: number,
) =>
  prevSnapshot.monthIndex +
  (nextSnapshot.monthIndex - prevSnapshot.monthIndex) * clamp(progress, 0, 1);

const segmentProgressForMonthIndex = (
  monthIndex: number,
  prevSnapshot: HostingCostSnapshot,
  nextSnapshot: HostingCostSnapshot,
) =>
  clamp(
    (monthIndex - prevSnapshot.monthIndex) /
      Math.max(1, nextSnapshot.monthIndex - prevSnapshot.monthIndex),
    0,
    1,
  );

const getMonthIndex = (year: number, month: number) => year * 12 + month - 1;

const getYearFromMonthIndex = (monthIndex: number) => Math.floor(monthIndex / 12);

const getBuildUpStartMonthIndex = (entry: WorldCupHostingCostEntry) =>
  getMonthIndex(entry.year, 1) - ENTRY_BUILD_UP_MONTHS;

const getEntryStageStartMonthIndex = (entry: WorldCupHostingCostEntry) =>
  getBuildUpStartMonthIndex(entry) - ENTRY_ZERO_HOLD_MONTHS;

const RANK_TRANSITION_DURATION = 0.08;
const RANK_ENTRY_BUFFER = 0.85;
const MIN_ANIMATED_RANK_GAP = 0.86;
const ENTRY_LANE_VISIBLE_OFFSET = 0;
const ENTRY_BUILD_UP_YEARS = 10;
const ENTRY_BUILD_UP_MONTHS = ENTRY_BUILD_UP_YEARS * 12;
const ENTRY_ZERO_HOLD_MONTHS = 24;
const ENTRY_FADE_IN_MONTHS = 6;
const AXIS_LEADER_HEADROOM = 1.18;
const AXIS_MIN_VISIBLE_VALUE = 950_000_000;
const ENTRY_OPACITY_COMPLETE_PROGRESS = 0.32;
const ENTRY_VISIBILITY_THRESHOLD = 0.015;
const VALUE_RANK_SMOOTHING_FLOOR = 18_000_000;
const VALUE_RANK_SMOOTHING_RATIO = 0.025;
const VALUE_TIE_EPSILON = 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};
