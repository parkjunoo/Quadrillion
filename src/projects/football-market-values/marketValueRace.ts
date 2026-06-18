export type MarketValueEntity = {
  id: string;
  name: string;
  code: string;
  country: string;
  color: string;
  imageUrl: string;
  playerUrl: string;
  position: string;
  club: string;
};

export type MarketValueRaceData = {
  entities: MarketValueEntity[];
  snapshots: MarketValueSnapshot[];
  monthlyMetadataById: Map<string, MarketValueMonthlyMetadata[]>;
  clubChangesById: Map<string, MarketValueClubChange[]>;
  minYear: number;
  maxYear: number;
  minMonthIndex: number;
  maxMonthIndex: number;
};

export type MarketValueSnapshot = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  values: Map<string, number>;
  ranks: Map<string, number>;
  clubs: Map<string, string>;
  countries: Map<string, string>;
  imageUrls: Map<string, string>;
  maxValue: number;
};

export type MarketValueRaceRow = MarketValueEntity & {
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
  club: string;
  previousClub: string;
  clubChangePulse: number;
  clubChangeProgress: number;
  clubChangedFrom: string;
  clubChangedTo: string;
  country: string;
  imageUrl: string;
};

export type MarketValueFrameState = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  segmentProgress: number;
  transitionPulse: number;
  maxValue: number;
  rows: MarketValueRaceRow[];
};

type CsvRow = {
  date: string;
  year: number;
  month: number;
  name: string;
  code: string;
  country: string;
  value: number;
  rank: number;
  color: string;
  imageUrl: string;
  playerUrl: string;
  position: string;
  club: string;
};

export type MarketValueMonthlyMetadata = {
  date: string;
  year: number;
  month: number;
  monthIndex: number;
  club: string;
  country: string;
  imageUrl: string;
};

export type MarketValueClubChange = {
  date: string;
  monthIndex: number;
  previousClub: string;
  club: string;
};

type BuildMarketValueRaceDataOptions = {
  dataCadence?: 'monthly' | 'yearly';
  startDate?: string;
};

type SegmentSnapshots = {
  leadingSnapshot: MarketValueSnapshot;
  prevSnapshot: MarketValueSnapshot;
  nextSnapshot: MarketValueSnapshot;
  trailingSnapshot: MarketValueSnapshot;
};

const REQUIRED_HEADERS = ['date', 'year', 'month', 'rank', 'name'] as const;

export const buildMarketValueRaceData = (
  csv: string,
  options: BuildMarketValueRaceDataOptions = {},
): MarketValueRaceData => {
  const filteredRows = parseCsv(csv).filter((row) =>
    !options.startDate || row.date >= options.startDate
  );
  const rows = selectRowsByDataCadence(
    filteredRows,
    options.dataCadence ?? 'monthly',
  );
  const entityById = new Map<string, MarketValueEntity>();
  const rowsByDate = new Map<string, CsvRow[]>();

  for (const row of filteredRows) {
    const existing = entityById.get(row.code);

    if (!existing) {
      entityById.set(row.code, {
        id: row.code,
        name: row.name,
        code: row.code,
        country: row.country,
        color: row.color,
        imageUrl: row.imageUrl,
        playerUrl: row.playerUrl,
        position: row.position,
        club: row.club,
      });
      continue;
    }

    entityById.set(row.code, {
      ...existing,
      country: existing.country || row.country,
      color: existing.color || row.color,
      imageUrl: existing.imageUrl || row.imageUrl,
      playerUrl: existing.playerUrl || row.playerUrl,
      position: existing.position || row.position,
      club: row.club || existing.club,
    });
  }

  for (const row of rows) {
    const snapshotRows = rowsByDate.get(row.date) ?? [];
    snapshotRows.push(row);
    rowsByDate.set(row.date, snapshotRows);
  }

  const entities = [...entityById.values()].sort((a, b) => a.name.localeCompare(b.name));
  const monthlyMetadataById = buildMonthlyMetadataById(filteredRows);
  const clubChangesById = buildClubChangesById(monthlyMetadataById);
  const snapshots = [...rowsByDate.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, snapshotRows]) => buildSnapshot(date, snapshotRows, entities));
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    entities,
    snapshots,
    monthlyMetadataById,
    clubChangesById,
    minYear: firstSnapshot?.year ?? 0,
    maxYear: lastSnapshot?.year ?? 0,
    minMonthIndex: firstSnapshot?.monthIndex ?? 0,
    maxMonthIndex: lastSnapshot?.monthIndex ?? 0,
  };
};

const selectRowsByDataCadence = (
  rows: CsvRow[],
  dataCadence: NonNullable<BuildMarketValueRaceDataOptions['dataCadence']>,
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

  return addYearEndSettleRows(rows.filter((row) => selectedDates.has(row.date)));
};

const addYearEndSettleRows = (rows: CsvRow[]) => {
  const latestRow = [...rows].sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!latestRow || latestRow.month >= 12) {
    return rows;
  }

  const latestDateRows = rows.filter((row) => row.date === latestRow.date);
  const settleDate = `${latestRow.year}-12-01`;
  const settleRows = latestDateRows.map((row) => ({
    ...row,
    date: settleDate,
    month: 12,
  }));

  return [...rows, ...settleRows];
};

const buildMonthlyMetadataById = (rows: CsvRow[]) => {
  const byId = new Map<string, MarketValueMonthlyMetadata[]>();

  for (const row of rows) {
    const metadataRows = byId.get(row.code) ?? [];
    metadataRows.push({
      date: row.date,
      year: row.year,
      month: row.month,
      monthIndex: getMonthIndex(row.year, row.month),
      club: row.club || 'Unknown',
      country: row.country,
      imageUrl: row.imageUrl,
    });
    byId.set(row.code, metadataRows);
  }

  for (const metadataRows of byId.values()) {
    metadataRows.sort((a, b) => a.monthIndex - b.monthIndex);
  }

  return byId;
};

const buildClubChangesById = (
  metadataById: Map<string, MarketValueMonthlyMetadata[]>,
) => {
  const byId = new Map<string, MarketValueClubChange[]>();

  for (const [id, metadataRows] of metadataById) {
    const changes: MarketValueClubChange[] = [];
    let previous = metadataRows[0];

    for (const metadata of metadataRows.slice(1)) {
      const previousClubKey = canonicalClubNameForChange(previous?.club ?? '');
      const currentClubKey = canonicalClubNameForChange(metadata.club);

      if (
        previous &&
        metadata.club &&
        previous.club &&
        previousClubKey &&
        currentClubKey &&
        currentClubKey !== previousClubKey
      ) {
        changes.push({
          date: metadata.date,
          monthIndex: metadata.monthIndex,
          previousClub: previous.club,
          club: metadata.club,
        });
      }

      previous = metadata;
    }

    byId.set(id, changes);
  }

  return byId;
};

const displayNameForPlayer = (code: string, name: string) =>
  toEnglishDisplayName(
    playerDisplayNameAliasesByCode[code] ?? playerDisplayNameAliasesByName[name] ?? name,
  );

const playerDisplayNameAliasesByCode: Record<string, string> = {
  P371998: 'Vinicius Junior',
  P4276: 'Carlos Tevez',
  P6893: 'Gabriel Tamas',
};

const playerDisplayNameAliasesByName: Record<string, string> = {
  'Vinícius Júnior': 'Vinicius Junior',
  'Carlos Tévez': 'Carlos Tevez',
  'Gabriel Tamaș': 'Gabriel Tamas',
};

const toEnglishDisplayName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[Łł]/g, 'l')
    .replace(/[Đđ]/g, 'd')
    .replace(/[Øø]/g, 'o')
    .replace(/[Ææ]/g, 'ae')
    .replace(/[Œœ]/g, 'oe')
    .replace(/ß/g, 'ss');

const canonicalClubNameForChange = (club: string) => {
  const normalized = club
    .trim()
    .replace(/\s+/g, ' ')
    .replace('Paris Saint-Germain Football Club', 'Paris Saint-Germain')
    .replace('Real Madrid Club de Fútbol', 'Real Madrid')
    .replace('Manchester City Football Club', 'Manchester City')
    .replace('Manchester United Football Club', 'Manchester United')
    .replace('Arsenal Football Club', 'Arsenal FC')
    .replace('Liverpool Football Club', 'Liverpool FC')
    .replace('Chelsea Football Club', 'Chelsea FC')
    .replace('Juventus Football Club', 'Juventus FC')
    .replace('Futbol Club Barcelona', 'FC Barcelona')
    .replace('Football Club Internazionale Milano S.p.A.', 'Inter Milan')
    .replace('Club Atlético de Madrid S.A.D.', 'Atletico Madrid')
    .replace('Club Internacional de Fútbol Miami', 'Inter Miami')
    .replace('Società Sportiva Calcio Napoli', 'SSC Napoli')
    .replace('Associazione Calcio Milan', 'AC Milan')
    .replace('Associazione Sportiva Roma', 'AS Roma')
    .replace('Football Club', 'FC')
    .replace('Club de Fútbol', 'CF')
    .replace('Fútbol Club', 'FC')
    .replace('Sporting Club de Portugal', 'Sporting CP');

  if (!normalized || normalized === 'Unknown') {
    return '';
  }

  return clubChangeAliases[normalized] ?? normalized;
};

const clubChangeAliases: Record<string, string> = {
  'AC Milan': 'Milan',
  'Al-Nassr FC': 'Al-Nassr',
  'Arsenal FC': 'Arsenal',
  'Aston Villa FC': 'Aston Villa',
  'Aston Villa Football Club': 'Aston Villa',
  'Atletico Madrid': 'Atletico Madrid',
  'Atlético de Madrid': 'Atletico Madrid',
  'Bayern Munich': 'Bayern Munich',
  'CA Boca Juniors': 'Boca Juniors',
  'CA Rosario Central': 'Rosario Central',
  'Chelsea FC': 'Chelsea',
  'Club Atlético Boca Juniors': 'Boca Juniors',
  'Club Atlético Rosario Central': 'Rosario Central',
  'Eintracht Frankfurt Fußball AG': 'Eintracht Frankfurt',
  'FC Barcelona': 'Barcelona',
  'FC Bayern München': 'Bayern Munich',
  'Galatasaray Spor Kulübü': 'Galatasaray',
  'Inter Miami CF': 'Inter Miami',
  'Juventus FC': 'Juventus',
  'Liverpool FC': 'Liverpool',
  'Manchester City': 'Manchester City',
  'Manchester United': 'Manchester United',
  'Paris Saint-Germain': 'Paris Saint-Germain',
  'Paris Saint-Germain FC': 'Paris Saint-Germain',
  'Real Madrid': 'Real Madrid',
  'Real Madrid CF': 'Real Madrid',
  'Sevilla FC': 'Sevilla',
  'Sevilla FC S.A.D.': 'Sevilla',
  'Sevilla Fútbol Club S.A.D.': 'Sevilla',
  'SSC Napoli': 'Napoli',
};

const metadataAtMonth = (
  metadataRows: MarketValueMonthlyMetadata[] | undefined,
  monthIndex: number,
) => {
  if (!metadataRows?.length) {
    return undefined;
  }

  const displayMonthIndex = Math.floor(monthIndex + 0.0001);
  let selected = metadataRows[0];

  for (const metadata of metadataRows) {
    if (metadata.monthIndex > displayMonthIndex) {
      break;
    }

    selected = metadata;
  }

  return selected;
};

const activeClubChange = (
  changes: MarketValueClubChange[] | undefined,
  monthIndex: number,
) => {
  if (!changes?.length) {
    return undefined;
  }

  let activeChange: MarketValueClubChange | undefined;

  for (const change of changes) {
    if (change.monthIndex > monthIndex) {
      break;
    }

    activeChange = change;
  }

  if (!activeChange) {
    return undefined;
  }

  const elapsedMonths = monthIndex - activeChange.monthIndex;

  if (elapsedMonths < 0 || elapsedMonths > CLUB_CHANGE_EFFECT_MONTHS) {
    return undefined;
  }

  const progress = clamp(elapsedMonths / CLUB_CHANGE_EFFECT_MONTHS, 0, 1);

  return {
    ...activeChange,
    progress,
    pulse: Math.sin(progress * Math.PI),
  };
};

export const getMarketValueFrameState = ({
  data,
  frame,
  durationInFrames,
  topN,
}: {
  data: MarketValueRaceData;
  frame: number;
  durationInFrames: number;
  topN: number;
}): MarketValueFrameState => {
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
    const monthlyMetadata = metadataAtMonth(
      data.monthlyMetadataById.get(entity.id),
      monthIndex,
    );
    const clubChange = activeClubChange(
      data.clubChangesById.get(entity.id),
      monthIndex,
    );
    const club = monthlyMetadata?.club ||
      displaySnapshot.clubs.get(entity.id) ||
      nearestSnapshot.clubs.get(entity.id) ||
      entity.club;
    const country = monthlyMetadata?.country ||
      displaySnapshot.countries.get(entity.id) ||
      nearestSnapshot.countries.get(entity.id) ||
      entity.country;
    const imageUrl = monthlyMetadata?.imageUrl ||
      displaySnapshot.imageUrls.get(entity.id) ||
      nearestSnapshot.imageUrls.get(entity.id) ||
      entity.imageUrl;

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
      club,
      previousClub: clubChange?.previousClub ?? '',
      clubChangePulse: clubChange?.pulse ?? 0,
      clubChangeProgress: clubChange?.progress ?? 0,
      clubChangedFrom: clubChange?.previousClub ?? '',
      clubChangedTo: clubChange?.club ?? '',
      country,
      imageUrl,
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
    .sort((a, b) => a.animatedRank - b.animatedRank)
    .slice(0, topN + 2)
    .map((row) => ({
      ...row,
      displayRank: row.liveRank,
    }));

  return {
    date: displaySnapshot.date,
    year: displaySnapshot.year,
    month: displaySnapshot.month,
    monthIndex,
    segmentProgress: splineProgress,
    transitionPulse: Math.sin(splineProgress * Math.PI),
    maxValue: Math.max(1, interpolateSnapshotSpline(
      leadingSnapshot,
      prevSnapshot,
      nextSnapshot,
      trailingSnapshot,
      (snapshot) => snapshot.maxValue,
      splineProgress,
    )),
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
    const optionalValueFor = (header: string) => columns[headerIndex.get(header) ?? -1] ?? '';
    const playerId = optionalValueFor('playerId') || optionalValueFor('player_id');
    const code = optionalValueFor('code') || `P${playerId}`;
    const month = Number(optionalValueFor('month') || 1);
    const value = Number(optionalValueFor('value') || optionalValueFor('value_million_eur') || 0);

    return {
      date: optionalValueFor('date'),
      year: Number(optionalValueFor('year')),
      month,
      name: displayNameForPlayer(code, optionalValueFor('name')),
      code,
      country: optionalValueFor('region') || optionalValueFor('country'),
      value,
      rank: Number(optionalValueFor('rank') || optionalValueFor('globalRank') || 0),
      color: optionalValueFor('color') || '#45E3AE',
      imageUrl: optionalValueFor('imageUrl') || optionalValueFor('image_url'),
      playerUrl: optionalValueFor('playerUrl') || optionalValueFor('player_url'),
      position: optionalValueFor('position'),
      club: optionalValueFor('club'),
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
  entities: MarketValueEntity[],
): MarketValueSnapshot => {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const values = new Map<string, number>();
  const ranks = new Map<string, number>();
  const clubs = new Map<string, string>();
  const countries = new Map<string, string>();
  const imageUrls = new Map<string, string>();

  for (const entity of entities) {
    values.set(entity.id, 0);
    ranks.set(entity.id, entities.length + 1);
  }

  for (const row of rows) {
    values.set(row.code, row.value);
    ranks.set(row.code, row.rank || entities.length + 1);
    clubs.set(row.code, row.club);
    countries.set(row.code, row.country);
    imageUrls.set(row.code, row.imageUrl);
  }

  return {
    date,
    year,
    month,
    monthIndex: getMonthIndex(year, month),
    values,
    ranks,
    clubs,
    countries,
    imageUrls,
    maxValue: Math.max(...rows.map((row) => row.value), 0),
  };
};

const compareRowsByValue = (a: MarketValueRaceRow, b: MarketValueRaceRow) =>
  b.value - a.value || a.name.localeCompare(b.name);

const crossingAnimatedRank = (
  row: MarketValueRaceRow,
  rows: MarketValueRaceRow[],
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
  row: MarketValueRaceRow,
  rows: MarketValueRaceRow[],
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
const CLUB_CHANGE_EFFECT_MONTHS = 2.2;
const MIN_VALUE_GAP = 0.0001;

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
  row: MarketValueRaceRow,
  other: MarketValueRaceRow,
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
  row: MarketValueRaceRow,
  other: MarketValueRaceRow,
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};

const interpolateSnapshotSpline = (
  p0: MarketValueSnapshot,
  p1: MarketValueSnapshot,
  p2: MarketValueSnapshot,
  p3: MarketValueSnapshot,
  valueFor: (snapshot: MarketValueSnapshot) => number,
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
