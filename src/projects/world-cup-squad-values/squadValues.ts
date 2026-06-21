export type WorldCupSquadPlayer = {
  club: string;
  code: string;
  color: string;
  id: string;
  imageUrl: string;
  name: string;
  playerUrl: string;
  position: string;
  rank: number;
  valuationDate: string;
  valuationSource: string;
  value: number;
  valueEur: number;
};

export type WorldCupSquadCountry = {
  code: string;
  color: string;
  id: string;
  name: string;
  playerCount: number;
  players: WorldCupSquadPlayer[];
  rank: number;
  totalValue: number;
};

export type WorldCupSquadSnapshot = {
  champion: string;
  countries: WorldCupSquadCountry[];
  date: string;
  host: string;
  label: string;
  year: number;
};

export type WorldCupSquadValueData = {
  countries: WorldCupSquadCountryIdentity[];
  maxYear: number;
  minYear: number;
  snapshots: WorldCupSquadSnapshot[];
};

export type WorldCupSquadCountryIdentity = {
  code: string;
  color: string;
  id: string;
  name: string;
};

export type WorldCupSquadFramePlayer = Omit<WorldCupSquadPlayer, 'rank' | 'value'> & {
  opacity: number;
  previousValue: number;
  rank: number;
  targetValue: number;
  value: number;
};

export type WorldCupSquadFrameCountry = WorldCupSquadCountryIdentity & {
  displayRank: number;
  liveRank: number;
  opacity: number;
  playerCount: number;
  players: WorldCupSquadFramePlayer[];
  previousRank: number;
  previousValue: number;
  targetRank: number;
  targetValue: number;
  topNPresence: number;
  value: number;
};

export type WorldCupSquadFrameState = {
  champion: string;
  host: string;
  maxValue: number;
  nextSnapshot: WorldCupSquadSnapshot;
  periodLabel: string;
  rows: WorldCupSquadFrameCountry[];
  segmentProgress: number;
  snapshot: WorldCupSquadSnapshot;
  year: number;
  yearProgress: number;
};

export const buildWorldCupSquadValueData = (
  snapshots: WorldCupSquadSnapshot[],
): WorldCupSquadValueData => {
  const countryById = new Map<string, WorldCupSquadCountryIdentity>();

  for (const snapshot of snapshots) {
    for (const country of snapshot.countries) {
      const existing = countryById.get(country.id);

      countryById.set(country.id, {
        code: existing?.code ?? country.code,
        color: existing?.color ?? country.color,
        id: country.id,
        name: existing?.name ?? country.name,
      });
    }
  }

  const sortedSnapshots = [...snapshots].sort((snapshotA, snapshotB) => snapshotA.year - snapshotB.year);
  const firstSnapshot = sortedSnapshots[0];
  const lastSnapshot = sortedSnapshots[sortedSnapshots.length - 1];

  return {
    countries: [...countryById.values()].sort((countryA, countryB) => countryA.name.localeCompare(countryB.name)),
    maxYear: lastSnapshot?.year ?? 0,
    minYear: firstSnapshot?.year ?? 0,
    snapshots: sortedSnapshots,
  };
};

export const getWorldCupSquadFrameState = ({
  data,
  durationInFrames,
  frame,
  playerTopN,
  topN,
}: {
  data: WorldCupSquadValueData;
  durationInFrames: number;
  frame: number;
  playerTopN: number;
  topN: number;
}): WorldCupSquadFrameState => {
  const firstSnapshot = data.snapshots[0];
  const lastSnapshot = data.snapshots[data.snapshots.length - 1] ?? firstSnapshot;
  const lastSegmentIndex = Math.max(0, data.snapshots.length - 2);
  const segmentCount = Math.max(1, data.snapshots.length - 1);
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const scaled = progress * segmentCount;
  const segmentIndex = Math.min(lastSegmentIndex, Math.floor(scaled));
  const previousSnapshot = data.snapshots[segmentIndex] ?? firstSnapshot;
  const nextSnapshot = data.snapshots[segmentIndex + 1] ?? previousSnapshot ?? lastSnapshot;
  const rawSegmentProgress = progress === 1 ? 1 : scaled - segmentIndex;
  const segmentProgress = easeInOutCubic(rawSegmentProgress);
  const previousCountryById = countryMapFor(previousSnapshot);
  const nextCountryById = countryMapFor(nextSnapshot);
  const countryUniverse = new Map<string, WorldCupSquadCountryIdentity>();

  for (const country of data.countries) {
    countryUniverse.set(country.id, country);
  }

  for (const country of previousSnapshot?.countries ?? []) {
    countryUniverse.set(country.id, country);
  }

  for (const country of nextSnapshot?.countries ?? []) {
    countryUniverse.set(country.id, country);
  }

  const rawRows = [...countryUniverse.values()].map((identity) => {
    const previousCountry = previousCountryById.get(identity.id);
    const nextCountry = nextCountryById.get(identity.id);
    const previousValue = previousCountry?.totalValue ?? 0;
    const targetValue = nextCountry?.totalValue ?? 0;
    const value = previousValue + (targetValue - previousValue) * segmentProgress;
    const previousRank = previousCountry?.rank ?? data.countries.length + 1;
    const targetRank = nextCountry?.rank ?? data.countries.length + 1;
    const topNPresence = clamp(
      (previousRank <= topN ? 1 - rawSegmentProgress : 0) +
        (targetRank <= topN ? rawSegmentProgress : 0),
      0,
      1,
    );
    const playerCount = Math.round(
      (previousCountry?.playerCount ?? 0) +
        ((nextCountry?.playerCount ?? 0) - (previousCountry?.playerCount ?? 0)) * segmentProgress,
    );

    return {
      ...identity,
      displayRank: 0,
      liveRank: 0,
      opacity: 1,
      playerCount,
      players: buildFramePlayers(previousCountry, nextCountry, segmentProgress, rawSegmentProgress, playerTopN),
      previousRank,
      previousValue,
      targetRank,
      targetValue,
      topNPresence,
      value,
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
        clamp(row.value / Math.max(1, maxValue * 0.05), 0.18, 1) *
        clamp(row.topNPresence || (row.liveRank <= topN ? 1 : 0), 0, 1),
    }));
  const displaySnapshot = progress === 1 ? lastSnapshot : previousSnapshot;

  return {
    champion: displaySnapshot?.champion ?? '',
    host: displaySnapshot?.host ?? '',
    maxValue,
    nextSnapshot: nextSnapshot ?? previousSnapshot ?? lastSnapshot,
    periodLabel: displaySnapshot?.label ?? '',
    rows,
    segmentProgress: rawSegmentProgress,
    snapshot: previousSnapshot ?? nextSnapshot ?? lastSnapshot,
    year: displaySnapshot?.year ?? 0,
    yearProgress: progress,
  };
};

const buildFramePlayers = (
  previousCountry: WorldCupSquadCountry | undefined,
  nextCountry: WorldCupSquadCountry | undefined,
  valueProgress: number,
  presenceProgress: number,
  playerTopN: number,
): WorldCupSquadFramePlayer[] => {
  const previousPlayers = new Map((previousCountry?.players ?? []).map((player) => [player.id, player]));
  const nextPlayers = new Map((nextCountry?.players ?? []).map((player) => [player.id, player]));
  const playerIds = new Set([...previousPlayers.keys(), ...nextPlayers.keys()]);
  const players = [...playerIds].map((playerId) => {
    const previousPlayer = previousPlayers.get(playerId);
    const nextPlayer = nextPlayers.get(playerId);
    const basePlayer = nextPlayer ?? previousPlayer;
    const previousValue = previousPlayer?.value ?? 0;
    const targetValue = nextPlayer?.value ?? 0;
    const value = previousValue + (targetValue - previousValue) * valueProgress;
    const presence = clamp(
      (previousPlayer ? 1 - presenceProgress : 0) + (nextPlayer ? presenceProgress : 0),
      0,
      1,
    );

    return {
      club: basePlayer?.club ?? '',
      code: basePlayer?.code ?? playerId,
      color: basePlayer?.color ?? '#FFFFFF',
      id: playerId,
      imageUrl: basePlayer?.imageUrl ?? '',
      name: basePlayer?.name ?? playerId,
      opacity: presence,
      playerUrl: basePlayer?.playerUrl ?? '',
      position: basePlayer?.position ?? '',
      previousValue,
      rank: 0,
      targetValue,
      valuationDate: basePlayer?.valuationDate ?? '',
      valuationSource: basePlayer?.valuationSource ?? '',
      value,
      valueEur: basePlayer?.valueEur ?? 0,
    };
  })
    .filter((player) => player.value > 0.001)
    .sort((playerA, playerB) => playerB.value - playerA.value || playerA.name.localeCompare(playerB.name))
    .slice(0, playerTopN);

  return players.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

const countryMapFor = (snapshot: WorldCupSquadSnapshot | undefined) =>
  new Map((snapshot?.countries ?? []).map((country) => [country.id, country]));

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
