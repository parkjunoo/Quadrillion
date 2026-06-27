export type OsLeader = 'Android' | 'Tie' | 'iOS';

export type IosAndroidCountry = {
  country: string;
  geoName: string | null;
  id: string;
};

export type IosAndroidSnapshotRow = IosAndroidCountry & {
  androidIosTotalShare: number;
  androidShare: number;
  iosMinusAndroid: number;
  iosShare: number;
  isPartialYear: boolean;
  leader: OsLeader;
  leaderShare: number;
  otherShare: number;
  period: string;
  year: number;
};

export type IosAndroidSnapshot = {
  isPartialYear: boolean;
  period: string;
  rows: IosAndroidSnapshotRow[];
  rowsByCountry: Map<string, IosAndroidSnapshotRow>;
  year: number;
};

export type IosAndroidUsageData = {
  countries: IosAndroidCountry[];
  maxYear: number;
  minYear: number;
  snapshots: IosAndroidSnapshot[];
};

export type IosAndroidFrameRow = IosAndroidSnapshotRow & {
  displayRank: number;
  leaderBlend: number;
  leaderSwitchIntensity: number;
  mapName: string | null;
};

export type IosAndroidFrameState = {
  androidCountryCount: number;
  avgAndroidShare: number;
  avgIosMinusAndroid: number;
  avgIosShare: number;
  iosCountryCount: number;
  mapRows: IosAndroidFrameRow[];
  periodLabel: string;
  raceRows: IosAndroidFrameRow[];
  segmentProgress: number;
  totalCountryCount: number;
  year: number;
  yearProgress: number;
};

type AnnualCsvRow = {
  androidIosTotalShare: number;
  androidShare: number;
  country: string;
  iosMinusAndroid: number;
  iosShare: number;
  isPartialYear: boolean;
  leader: OsLeader;
  leaderShare: number;
  otherShare: number;
  period: string;
  year: number;
};

const REQUIRED_HEADERS = [
  'year',
  'period',
  'country',
  'android_share',
  'ios_share',
  'other_share',
  'android_ios_total_share',
  'leader',
  'leader_share',
  'ios_minus_android_pp',
  'is_partial_year',
] as const;

const GEO_NAME_BY_COUNTRY: Record<string, string> = {
  'Aland Islands': 'Aland',
  'Antigua and Barbuda': 'Antigua and Barb.',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'British Indian Ocean Territory': 'Br. Indian Ocean Ter.',
  'Brunei Darussalam': 'Brunei',
  'Cayman Islands': 'Cayman Is.',
  'Central African Republic': 'Central African Rep.',
  'Congo The Democratic Republic of': 'Dem. Rep. Congo',
  "Cote d'Ivoire": "C\u00f4te d'Ivoire",
  Curacao: 'Cura\u00e7ao',
  'Czech Republic': 'Czech Rep.',
  'Dominican Republic': 'Dominican Rep.',
  'Equatorial Guinea': 'Eq. Guinea',
  'Falkland Islands (Malvinas)': 'Falkland Is.',
  'Faroe Islands': 'Faeroe Is.',
  'French Polynesia': 'Fr. Polynesia',
  'Iran Islamic Republic of': 'Iran',
  'Korea Democratic People\'s Republic of': 'Dem. Rep. Korea',
  'Korea Republic of': 'Korea',
  'Lao People\'s Democratic Republic': 'Lao PDR',
  'Micronesia Federated States of': 'Micronesia',
  'Moldova Republic of': 'Moldova',
  'Northern Mariana Islands': 'N. Mariana Is.',
  'Palestinian Territory': 'Palestine',
  'Russian Federation': 'Russia',
  'Saint Pierre and Miquelon': 'St. Pierre and Miquelon',
  'Saint Vincent and the Grenadines': 'St. Vin. and Gren.',
  'Sao Tome and Principe': 'S\u00e3o Tom\u00e9 and Principe',
  'Solomon Islands': 'Solomon Is.',
  'Syrian Arab Republic': 'Syria',
  'Tanzania United Republic of': 'Tanzania',
  'Turks and Caicos Islands': 'Turks and Caicos Is.',
  'Virgin Island U.S.': 'U.S. Virgin Is.',
};

export const buildIosAndroidUsageData = (csv: string): IosAndroidUsageData => {
  const parsedRows = parseCsv(csv).map(toAnnualRow);
  const countryById = new Map<string, IosAndroidCountry>();
  const rowsByYear = new Map<number, AnnualCsvRow[]>();

  for (const row of parsedRows) {
    const id = idForCountry(row.country);
    countryById.set(id, {
      country: row.country,
      geoName: geoNameForCountry(row.country),
      id,
    });

    const yearRows = rowsByYear.get(row.year) ?? [];
    yearRows.push(row);
    rowsByYear.set(row.year, yearRows);
  }

  const countries = [...countryById.values()].sort((countryA, countryB) =>
    countryA.country.localeCompare(countryB.country),
  );
  const snapshots = [...rowsByYear.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, rows]) => toSnapshot(year, rows, countries));
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    countries,
    maxYear: lastSnapshot?.year ?? 0,
    minYear: firstSnapshot?.year ?? 0,
    snapshots,
  };
};

export const getIosAndroidFrameState = ({
  data,
  durationInFrames,
  frame,
  raceCountries,
  topN,
}: {
  data: IosAndroidUsageData;
  durationInFrames: number;
  frame: number;
  raceCountries: string[];
  topN: number;
}): IosAndroidFrameState => {
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
  const displaySnapshot =
    progress === 1 || rawSegmentProgress >= 0.5 ? nextSnapshot : previousSnapshot;
  const raceCountrySet = new Set(raceCountries);
  const mapRows = data.countries.map((country) =>
    interpolateRow(country, previousSnapshot, nextSnapshot, valueProgress),
  );
  const totalCountryCount = mapRows.length;
  const androidCountryCount = mapRows.filter((row) => row.leader === 'Android').length;
  const iosCountryCount = mapRows.filter((row) => row.leader === 'iOS').length;
  const raceCandidates = mapRows
    .filter((row) => raceCountrySet.size === 0 || raceCountrySet.has(row.country))
    .filter((row) => row.androidIosTotalShare >= 70);
  const androidRaceRows = raceCandidates
    .filter((row) => row.leader === 'Android')
    .slice()
    .sort(
      (rowA: IosAndroidFrameRow, rowB: IosAndroidFrameRow) =>
        rowB.leaderShare - rowA.leaderShare ||
        Math.abs(rowB.iosMinusAndroid) - Math.abs(rowA.iosMinusAndroid) ||
        rowA.country.localeCompare(rowB.country),
    )
    .slice(0, Math.ceil(topN / 2));
  const iosRaceRows = raceCandidates
    .filter((row) => row.leader === 'iOS')
    .slice()
    .sort(
      (rowA: IosAndroidFrameRow, rowB: IosAndroidFrameRow) =>
        rowB.leaderShare - rowA.leaderShare ||
        Math.abs(rowB.iosMinusAndroid) - Math.abs(rowA.iosMinusAndroid) ||
        rowA.country.localeCompare(rowB.country),
    )
    .slice(0, topN - androidRaceRows.length);
  const selectedCountryIds = new Set(
    [...androidRaceRows, ...iosRaceRows].map((row) => row.id),
  );
  const fallbackRaceRows = raceCandidates
    .filter((row) => !selectedCountryIds.has(row.id))
    .slice()
    .sort(
      (rowA: IosAndroidFrameRow, rowB: IosAndroidFrameRow) =>
        rowB.leaderShare - rowA.leaderShare ||
        Math.abs(rowB.iosMinusAndroid) - Math.abs(rowA.iosMinusAndroid) ||
        rowA.country.localeCompare(rowB.country),
    )
    .slice(0, Math.max(0, topN - androidRaceRows.length - iosRaceRows.length));
  const raceRows = [...androidRaceRows, ...iosRaceRows, ...fallbackRaceRows]
    .map((row: IosAndroidFrameRow, index: number) => ({
      ...row,
      displayRank: index + 1,
    }));

  return {
    androidCountryCount,
    avgAndroidShare: average(mapRows.map((row) => row.androidShare)),
    avgIosMinusAndroid: average(mapRows.map((row) => row.iosMinusAndroid)),
    avgIosShare: average(mapRows.map((row) => row.iosShare)),
    iosCountryCount,
    mapRows,
    periodLabel: displaySnapshot?.period ?? String(displaySnapshot?.year ?? ''),
    raceRows,
    segmentProgress: rawSegmentProgress,
    totalCountryCount,
    year: displaySnapshot?.year ?? 0,
    yearProgress: progress,
  };
};

export const formatShare = (value: number) => `${Math.round(value)}%`;

export const formatSignedPoints = (value: number) => {
  const rounded = Math.round(Math.abs(value));

  if (rounded === 0) {
    return 'even';
  }

  return `${value > 0 ? 'iOS' : 'Android'} +${rounded}pp`;
};

const interpolateRow = (
  country: IosAndroidCountry,
  previousSnapshot: IosAndroidSnapshot | undefined,
  nextSnapshot: IosAndroidSnapshot | undefined,
  progress: number,
): IosAndroidFrameRow => {
  const previousRow = previousSnapshot?.rowsByCountry.get(country.id);
  const nextRow = nextSnapshot?.rowsByCountry.get(country.id) ?? previousRow;
  const androidShare = lerp(previousRow?.androidShare ?? 0, nextRow?.androidShare ?? 0, progress);
  const iosShare = lerp(previousRow?.iosShare ?? 0, nextRow?.iosShare ?? 0, progress);
  const otherShare = lerp(previousRow?.otherShare ?? 0, nextRow?.otherShare ?? 0, progress);
  const androidIosTotalShare = androidShare + iosShare;
  const iosMinusAndroid = iosShare - androidShare;
  const leader = leaderFor(androidShare, iosShare);
  const leaderTransition = leaderTransitionForGaps(
    previousRow?.iosMinusAndroid ?? iosMinusAndroid,
    nextRow?.iosMinusAndroid ?? iosMinusAndroid,
    progress,
  );
  const leaderShare =
    leader === 'Android'
      ? androidShare
      : leader === 'iOS'
        ? iosShare
        : Math.max(androidShare, iosShare);

  return {
    ...country,
    androidIosTotalShare: round2(androidIosTotalShare),
    androidShare: round2(androidShare),
    displayRank: 0,
    iosMinusAndroid: round2(iosMinusAndroid),
    iosShare: round2(iosShare),
    isPartialYear: Boolean(nextRow?.isPartialYear ?? previousRow?.isPartialYear),
    leader,
    leaderBlend: round3(leaderTransition.leaderBlend),
    leaderShare: round2(leaderShare),
    leaderSwitchIntensity: round3(leaderTransition.leaderSwitchIntensity),
    mapName: country.geoName,
    otherShare: round2(otherShare),
    period: nextRow?.period ?? previousRow?.period ?? '',
    year: nextRow?.year ?? previousRow?.year ?? 0,
  };
};

const toSnapshot = (
  year: number,
  rows: AnnualCsvRow[],
  countries: IosAndroidCountry[],
): IosAndroidSnapshot => {
  const rowsByCountry = new Map<string, IosAndroidSnapshotRow>();
  const firstRow = rows[0];

  for (const row of rows) {
    const country = countries.find((item) => item.id === idForCountry(row.country));

    if (!country) {
      continue;
    }

    rowsByCountry.set(country.id, {
      ...country,
      androidIosTotalShare: row.androidIosTotalShare,
      androidShare: row.androidShare,
      iosMinusAndroid: row.iosMinusAndroid,
      iosShare: row.iosShare,
      isPartialYear: row.isPartialYear,
      leader: row.leader,
      leaderShare: row.leaderShare,
      otherShare: row.otherShare,
      period: row.period,
      year,
    });
  }

  return {
    isPartialYear: firstRow?.isPartialYear ?? false,
    period: firstRow?.period ?? String(year),
    rows: [...rowsByCountry.values()],
    rowsByCountry,
    year,
  };
};

const toAnnualRow = (row: Record<string, string>): AnnualCsvRow => ({
  androidIosTotalShare: toNumber(row.android_ios_total_share),
  androidShare: toNumber(row.android_share),
  country: row.country,
  iosMinusAndroid: toNumber(row.ios_minus_android_pp),
  iosShare: toNumber(row.ios_share),
  isPartialYear: row.is_partial_year === 'true',
  leader: leaderFromText(row.leader),
  leaderShare: toNumber(row.leader_share),
  otherShare: toNumber(row.other_share),
  period: row.period,
  year: toNumber(row.year),
});

const geoNameForCountry = (country: string) => GEO_NAME_BY_COUNTRY[country] ?? country;

const idForCountry = (country: string) => country.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

const leaderFor = (androidShare: number, iosShare: number): OsLeader => {
  if (Math.abs(androidShare - iosShare) < 0.005) {
    return 'Tie';
  }

  return androidShare > iosShare ? 'Android' : 'iOS';
};

const leaderForGap = (iosMinusAndroid: number): OsLeader => {
  if (Math.abs(iosMinusAndroid) < 0.005) {
    return 'Tie';
  }

  return iosMinusAndroid > 0 ? 'iOS' : 'Android';
};

const leaderBlendValue = (leader: OsLeader) => {
  if (leader === 'iOS') {
    return 1;
  }

  if (leader === 'Android') {
    return 0;
  }

  return 0.5;
};

const leaderTransitionForGaps = (
  previousGap: number,
  nextGap: number,
  progress: number,
) => {
  const previousLeader = leaderForGap(previousGap);
  const nextLeader = leaderForGap(nextGap);
  const fromBlend = leaderBlendValue(previousLeader);
  const toBlend = leaderBlendValue(nextLeader);

  if (fromBlend === toBlend) {
    return {
      leaderBlend: fromBlend,
      leaderSwitchIntensity: 0,
    };
  }

  const gapDelta = previousGap - nextGap;
  const crossingProgress =
    Math.abs(gapDelta) < 0.005 ? 0.5 : clamp(previousGap / gapDelta, 0, 1);
  const transitionWidth = 0.28;
  const transitionProgress = smoothstep(
    clamp(
      (progress - (crossingProgress - transitionWidth / 2)) / transitionWidth,
      0,
      1,
    ),
  );

  return {
    leaderBlend: lerp(fromBlend, toBlend, transitionProgress),
    leaderSwitchIntensity: Math.sin(Math.PI * transitionProgress),
  };
};

const leaderFromText = (value: string): OsLeader => {
  if (value === 'Android' || value === 'iOS' || value === 'Tie') {
    return value;
  }

  return 'Tie';
};

const parseCsv = (csv: string) => {
  const [headerLine, ...bodyLines] = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine);
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing iOS vs Android CSV headers: ${missingHeaders.join(', ')}`);
  }

  return bodyLines.map((line) => {
    const columns = splitCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [header, columns[index] ?? '']),
    );
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
      columns.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  columns.push(current);
  return columns;
};

const toNumber = (value: string) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const average = (values: number[]) =>
  values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

const round2 = (value: number) => Math.round(value * 100) / 100;

const round3 = (value: number) => Math.round(value * 1000) / 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;

const smoothstep = (value: number) => value * value * (3 - 2 * value);
