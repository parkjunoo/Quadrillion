import {
  countryStockMarketCapRaceEntries,
  countryStockMarketCapVideoConfig,
  type CountryStockMarketCapEntry,
} from './config';

export type HostingCostRaceData = {
  entries: CountryStockMarketCapEntry[];
  maxMonthIndex: number;
  maxValue: number;
  minMonthIndex: number;
  snapshots: HostingCostSnapshot[];
};

export type HostingCostSnapshot = {
  date: string;
  month: number;
  monthIndex: number;
  ranks: Map<string, number>;
  values: Map<string, number>;
  year: number;
};

export type HostingCostRaceRow = CountryStockMarketCapEntry & {
  animatedRank: number;
  displayRank: number;
  entryProgress: number;
  liveRank: number;
  opacity: number;
  previousRank: number;
  previousValue: number;
  targetRank: number;
  targetValue: number;
  topNPresence: number;
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

const topN = Math.min(
  countryStockMarketCapRaceEntries.length,
  countryStockMarketCapVideoConfig.topN,
);

export const buildHostingCostRaceData = (): HostingCostRaceData => {
  const lastEntryYear = Math.max(
    ...countryStockMarketCapRaceEntries.map((entry) => entry.lastYear),
  );
  const firstAvailableYear = Math.min(
    ...countryStockMarketCapRaceEntries.flatMap((entry) =>
      entry.observations.map((observation) => observation.year)
    ),
  );
  const raceStartYear = Math.max(
    firstAvailableYear,
    countryStockMarketCapVideoConfig.startYear,
  );
  const raceEntries = filterEntriesForYearRange(
    countryStockMarketCapRaceEntries,
    raceStartYear,
    lastEntryYear,
  );
  const minMonthIndex = getMonthIndex(raceStartYear, 1);
  const snapshots = Array.from(
    { length: lastEntryYear - raceStartYear + 1 },
    (_, index) => buildSnapshot(raceStartYear + index, 1, raceEntries),
  );
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots.at(-1);

  return {
    entries: raceEntries,
    maxMonthIndex: lastSnapshot?.monthIndex ?? minMonthIndex,
    maxValue: Math.max(
      1,
      ...raceEntries.flatMap((entry) =>
        entry.observations.map((observation) => observation.valueUsd)
      ),
    ),
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
  const segmentSnapshots = getSegmentSnapshotsForMonthIndex(data.snapshots, monthIndex);
  const segmentProgress = segmentProgressForMonthIndex(
    monthIndex,
    segmentSnapshots.prevSnapshot,
    segmentSnapshots.nextSnapshot,
  );
  const rows = data.entries.map((entry) => {
    const entryProgress = revealProgressFor(entry, monthIndex);
    const hasStarted = entryHasStartedAtMonthIndex(entry, monthIndex);
    const previousRank = segmentSnapshots.prevSnapshot.ranks.get(entry.code) ??
      data.entries.length + 1;
    const targetRank = segmentSnapshots.nextSnapshot.ranks.get(entry.code) ??
      data.entries.length + 1;
    const topNPresence = clamp(
      (previousRank <= topN ? 1 - segmentProgress : 0) +
        (targetRank <= topN ? segmentProgress : 0),
      0,
      1,
    );
    const value = valueForEntryAtMonthIndex(entry, monthIndex);

    return {
      ...entry,
      animatedRank: topN,
      displayRank: topN,
      entryProgress,
      liveRank: topN,
      opacity: hasStarted ? entryPresenceProgressFor(entry, monthIndex) : 0,
      previousRank,
      previousValue: value,
      targetRank,
      targetValue: value,
      topNPresence,
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

  const candidateRows = activeRows
    .filter((row) =>
      row.liveRank <= topN ||
      row.previousRank <= topN ||
      row.targetRank <= topN ||
      row.topNPresence > TOP_N_PRESENCE_VISIBLE_THRESHOLD
    )
    .sort((a, b) =>
      Math.min(a.animatedRank, a.liveRank) - Math.min(b.animatedRank, b.liveRank) ||
      a.liveRank - b.liveRank ||
      a.host.localeCompare(b.host)
    );
  const visibleRows = candidateRows;

  resolveAnimatedRankCollisions(visibleRows);

  const currentLeaderValue = Math.max(0, ...activeRows.map((row) => row.value));
  const frameMaxValue = Math.max(
    AXIS_MIN_VISIBLE_VALUE,
    currentLeaderValue * AXIS_LEADER_HEADROOM,
  );

  const displayRows = visibleRows
    .sort((a, b) =>
      a.animatedRank - b.animatedRank ||
      a.liveRank - b.liveRank ||
      a.host.localeCompare(b.host)
    )
    .map((row) => ({
      ...row,
      displayRank: row.liveRank,
      opacity:
        row.opacity *
        clamp(row.value / Math.max(1, frameMaxValue * VALUE_OPACITY_FULL_RATIO), 0.18, 1) *
        row.topNPresence,
    }));
  const lastYear = getYearFromMonthIndex(data.maxMonthIndex);

  return {
    currentYear: clamp(
      getYearFromMonthIndex(monthIndex),
      getYearFromMonthIndex(data.minMonthIndex),
      lastYear,
    ),
    maxValue: frameMaxValue,
    monthIndex,
    rows: displayRows,
    transitionPulse: Math.sin(progress * Math.PI * data.entries.length),
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
  const maxVisibleRank = topN + TOP_N_TRANSITION_LANE;
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

const buildSnapshot = (
  year: number,
  month: number,
  entries: CountryStockMarketCapEntry[],
): HostingCostSnapshot => {
  const monthIndex = getMonthIndex(year, month);
  const ranks = new Map<string, number>();
  const values = new Map<string, number>();

  for (const entry of entries) {
    values.set(entry.code, valueForEntryAtMonthIndex(entry, monthIndex));
    ranks.set(entry.code, entries.length + 1);
  }

  const rankedEntries = entries
    .map((entry) => ({
      entry,
      value: values.get(entry.code) ?? 0,
    }))
    .filter((row) => row.value > 0)
    .sort((rowA, rowB) =>
      compareByValue(
        rowA.value,
        rowA.entry.adjustedUsd2026,
        rowA.entry.host,
        rowB.value,
        rowB.entry.adjustedUsd2026,
        rowB.entry.host,
      )
    );

  for (let index = 0; index < rankedEntries.length; index += 1) {
    ranks.set(rankedEntries[index].entry.code, index + 1);
  }

  return {
    date: `${year}-${String(month).padStart(2, '0')}-01`,
    month,
    monthIndex,
    ranks,
    values,
    year,
  };
};

const filterEntriesForYearRange = (
  entries: CountryStockMarketCapEntry[],
  startYear: number,
  endYear: number,
) =>
  entries.flatMap((entry) => {
    const observations = entry.observations.filter((observation) =>
      observation.year >= startYear && observation.year <= endYear
    );
    const firstObservation = observations[0];
    const lastObservation = observations.at(-1);

    if (!firstObservation || !lastObservation) {
      return [];
    }

    return [{
      ...entry,
      firstYear: firstObservation.year,
      lastYear: lastObservation.year,
      latestValueUsd: lastObservation.valueUsd,
      observations,
      year: lastObservation.year,
    }];
  });

const revealProgressFor = (
  entry: CountryStockMarketCapEntry,
  monthIndex: number,
) => {
  const targetMonthIndex = getMonthIndex(entry.firstYear, 1);
  const revealStartMonthIndex = targetMonthIndex - ENTRY_BUILD_UP_MONTHS;

  return clamp(
    (monthIndex - revealStartMonthIndex) / ENTRY_BUILD_UP_MONTHS,
    0,
    1,
  );
};

const valueForEntryAtMonthIndex = (entry: CountryStockMarketCapEntry, monthIndex: number) =>
  interpolatedObservationValueFor(entry, monthIndex) * revealProgressFor(entry, monthIndex);

const entryHasStartedAtMonthIndex = (entry: CountryStockMarketCapEntry, monthIndex: number) =>
  monthIndex >= getEntryStageStartMonthIndex(entry);

const entryPresenceProgressFor = (
  entry: CountryStockMarketCapEntry,
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
  entry: CountryStockMarketCapEntry,
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
  rowA: CountryStockMarketCapEntry,
  rowB: CountryStockMarketCapEntry,
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

const getBuildUpStartMonthIndex = (entry: CountryStockMarketCapEntry) =>
  getMonthIndex(entry.firstYear, 1) - ENTRY_BUILD_UP_MONTHS;

const getEntryStageStartMonthIndex = (entry: CountryStockMarketCapEntry) =>
  getBuildUpStartMonthIndex(entry) - ENTRY_ZERO_HOLD_MONTHS;

const interpolatedObservationValueFor = (
  entry: CountryStockMarketCapEntry,
  monthIndex: number,
) => {
  const observations = entry.observations;
  const firstObservation = observations[0];
  const lastObservation = observations.at(-1);

  if (!firstObservation || !lastObservation) {
    return 0;
  }

  const firstMonthIndex = getMonthIndex(firstObservation.year, 1);
  const lastMonthIndex = getMonthIndex(lastObservation.year, 1);

  if (monthIndex <= firstMonthIndex) {
    return firstObservation.valueUsd;
  }

  if (monthIndex >= lastMonthIndex) {
    return lastObservation.valueUsd;
  }

  const nextIndex = observations.findIndex(
    (observation) => getMonthIndex(observation.year, 1) >= monthIndex,
  );
  const nextObservation = observations[nextIndex] ?? lastObservation;
  const prevObservation = observations[Math.max(0, nextIndex - 1)] ?? firstObservation;
  const prevMonthIndex = getMonthIndex(prevObservation.year, 1);
  const nextMonthIndex = getMonthIndex(nextObservation.year, 1);
  const progress = clamp(
    (monthIndex - prevMonthIndex) /
      Math.max(1, nextMonthIndex - prevMonthIndex),
    0,
    1,
  );

  return prevObservation.valueUsd +
    (nextObservation.valueUsd - prevObservation.valueUsd) * progress;
};

const TOP_N_TRANSITION_LANE = 1.15;
const MIN_ANIMATED_RANK_GAP = 0.86;
const ENTRY_BUILD_UP_YEARS = 1;
const ENTRY_BUILD_UP_MONTHS = ENTRY_BUILD_UP_YEARS * 12;
const ENTRY_ZERO_HOLD_MONTHS = 6;
const ENTRY_FADE_IN_MONTHS = 6;
const AXIS_LEADER_HEADROOM = 1.18;
const AXIS_MIN_VISIBLE_VALUE = 100_000_000_000;
const VALUE_OPACITY_FULL_RATIO = 0.018;
const TOP_N_PRESENCE_VISIBLE_THRESHOLD = 0.001;
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
