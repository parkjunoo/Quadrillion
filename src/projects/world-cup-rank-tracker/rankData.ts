export type WorldCupRankCountry = {
  code: string;
  color: string;
  id: string;
  name: string;
  rank: number | null;
  stage: string;
};

export type WorldCupRankSnapshot = {
  countries: WorldCupRankCountry[];
  host: string;
  isVirtualStart?: boolean;
  label: string;
  year: number;
};

export type WorldCupRankFrameCountry = Omit<WorldCupRankCountry, 'rank'> & {
  displayRank: number | null;
  previousRank: number | null;
  rank: number | null;
  rankValue: number;
  targetRank: number | null;
};

export type WorldCupRankFrameState = {
  currentLabel: string;
  leader: WorldCupRankFrameCountry | undefined;
  nextSnapshot: WorldCupRankSnapshot;
  progress: number;
  rows: WorldCupRankFrameCountry[];
  segmentProgress: number;
  snapshot: WorldCupRankSnapshot;
};

export type WorldCupRankData = {
  countries: WorldCupRankCountry[];
  maxYear: number;
  minYear: number;
  snapshots: WorldCupRankSnapshot[];
};

const rankCutoff = 8;
const outsideRank = rankCutoff + 1;

export const buildWorldCupRankData = (
  snapshots: WorldCupRankSnapshot[],
): WorldCupRankData => {
  const sortedRealSnapshots = [...snapshots].sort((snapshotA, snapshotB) => snapshotA.year - snapshotB.year);
  const countries = sortedRealSnapshots[sortedRealSnapshots.length - 1]?.countries ?? [];
  const firstSnapshot = sortedRealSnapshots[0];
  const virtualStartSnapshot: WorldCupRankSnapshot | undefined = firstSnapshot
    ? {
        ...firstSnapshot,
        countries: firstSnapshot.countries.map((country) => ({
          ...country,
          rank: null,
          stage: 'pre_tournament',
        })),
        isVirtualStart: true,
        year: firstSnapshot.year - 4,
      }
    : undefined;
  const sortedSnapshots = virtualStartSnapshot
    ? [virtualStartSnapshot, ...sortedRealSnapshots]
    : sortedRealSnapshots;

  return {
    countries,
    maxYear: sortedRealSnapshots[sortedRealSnapshots.length - 1]?.year ?? 0,
    minYear: firstSnapshot?.year ?? 0,
    snapshots: sortedSnapshots,
  };
};

export const getWorldCupRankFrameState = ({
  data,
  durationInFrames,
  frame,
}: {
  data: WorldCupRankData;
  durationInFrames: number;
  frame: number;
}): WorldCupRankFrameState => {
  const firstSnapshot = data.snapshots[0];
  const lastSnapshot = data.snapshots[data.snapshots.length - 1] ?? firstSnapshot;
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const rawProgress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = rawProgress * segmentCount;
  const segmentIndex = Math.min(Math.max(0, data.snapshots.length - 2), Math.floor(scaled));
  const previousSnapshot = data.snapshots[segmentIndex] ?? firstSnapshot;
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? previousSnapshot ?? lastSnapshot;
  const rawSegmentProgress = rawProgress === 1 ? 1 : scaled - segmentIndex;
  const segmentProgress = easeInOutCubic(rawSegmentProgress);
  const previousById = countryMapFor(previousSnapshot);
  const nextById = countryMapFor(nextSnapshot);

  const interpolatedRows = data.countries.map((identity) => {
    const previousCountry = previousById.get(identity.id);
    const nextCountry = nextById.get(identity.id);
    const previousRank = previousCountry?.rank ?? null;
    const targetRank = nextCountry?.rank ?? null;
    const previousRankValue = previousRank ?? outsideRank;
    const targetRankValue = targetRank ?? outsideRank;
    const rankValue = previousRankValue + (targetRankValue - previousRankValue) * segmentProgress;

    return {
      ...identity,
      displayRank: null,
      previousRank,
      rank: null,
      rankValue,
      stage: nextCountry?.stage ?? previousCountry?.stage ?? 'outside_top_16',
      targetRank,
    };
  });
  const currentLabel = rawProgress === 1 ? lastSnapshot?.label : previousSnapshot?.label;
  const rankedRows = [...interpolatedRows].sort((rowA, rowB) =>
    rowA.rankValue - rowB.rankValue || rowA.name.localeCompare(rowB.name)
  );
  const visibleRankById = new Map(
    rankedRows
      .filter((row) => row.rankValue < outsideRank)
      .slice(0, rankCutoff)
      .map((row, index) => [row.id, index + 1]),
  );
  const rows = rankedRows.map((row) => {
    const displayRank = visibleRankById.get(row.id) ?? null;

    return {
      ...row,
      displayRank,
      rank: displayRank,
    };
  });

  return {
    currentLabel: currentLabel ?? '',
    leader: rows.find((row) => row.displayRank === 1),
    nextSnapshot: nextSnapshot ?? previousSnapshot ?? lastSnapshot,
    progress: rawProgress,
    rows,
    segmentProgress: rawSegmentProgress,
    snapshot: previousSnapshot ?? nextSnapshot ?? lastSnapshot,
  };
};

export const rankValueForDisplay = (rank: number | null) => rank ?? outsideRank;

export const formatRank = (rank: number | null) => (rank ? `#${rank}` : 'OUT');

const countryMapFor = (snapshot: WorldCupRankSnapshot | undefined) =>
  new Map((snapshot?.countries ?? []).map((country) => [country.id, country]));

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
