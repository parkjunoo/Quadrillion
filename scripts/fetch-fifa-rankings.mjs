import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FIFA_API_BASE = 'https://api.fifa.com/api/v3';
const MEN_RANKING_SCHEDULES_URL =
  `${FIFA_API_BASE}/rankingschedules/all?type=0&gender=1&idClient=64e9afa8-c5c0-413d-882b-bc9e6a81e264&language=en`;
const RANKINGS_BY_SCHEDULE_URL = `${FIFA_API_BASE}/rankingsbyschedule`;
const DATA_DIR = path.resolve('data/fifa-ranking-race');
const GENERATED_SOURCE_DIR = path.resolve('src/projects/fifa-ranking-race/generated');
const TOP_N = 8;
const VIDEO_POOL_N = 40;

const colorByCountry = new Map(
  [
    ['ARG', '#6EC6FF'],
    ['BRA', '#FFE45C'],
    ['ITA', '#31D07D'],
    ['GER', '#FFCC33'],
    ['ESP', '#FF4B3E'],
    ['FRA', '#4D7CFF'],
    ['POR', '#34D399'],
    ['NED', '#FF8A3D'],
    ['BEL', '#FFE15A'],
    ['ENG', '#F7F7F7'],
    ['CZE', '#2F80ED'],
    ['MEX', '#20C997'],
    ['URU', '#77C8FF'],
    ['COL', '#FFD84D'],
    ['CRO', '#FF5D5D'],
    ['USA', '#4DA3FF'],
  ],
);

const worldCupWinsByCountry = new Map(
  [
    ['BRA', 5],
    ['GER', 4],
    ['ITA', 4],
    ['ARG', 3],
    ['FRA', 2],
    ['URU', 2],
    ['ESP', 1],
    ['ENG', 1],
  ],
);

const main = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(GENERATED_SOURCE_DIR, { recursive: true });

  const schedulesResponse = await fetchJson(MEN_RANKING_SCHEDULES_URL);
  const schedules = schedulesResponse.Results.toSorted(
    (a, b) => new Date(a.OfficialDate).getTime() - new Date(b.OfficialDate).getTime(),
  );

  console.log(`Found ${schedules.length} official men's ranking releases.`);

  const allRows = [];

  for (let index = 0; index < schedules.length; index += 1) {
    const schedule = schedules[index];
    const rankings = await fetchRankingsForSchedule(schedule.IdRankingSchedule);
    const releaseDate = toDate(schedule.OfficialDate);

    for (const ranking of rankings.Results) {
      allRows.push(toRankingRow(schedule, releaseDate, ranking));
    }

    console.log(
      `${String(index + 1).padStart(3, '0')}/${schedules.length} ${releaseDate} ${schedule.IdRankingSchedule} ${rankings.Results.length} teams`,
    );
  }

  const { rows: cleanedRows, duplicateRows } = dedupeRowsByScheduleAndCountry(allRows);
  const quarterSchedules = latestScheduleInEachQuarter(schedules);
  const quarterScheduleIds = new Set(
    quarterSchedules.map((schedule) => schedule.IdRankingSchedule),
  );
  const quarterRows = cleanedRows.filter((row) => quarterScheduleIds.has(row.schedule_id));
  const scheduleRows = schedules.map((schedule) => ({
    schedule_id: schedule.IdRankingSchedule,
    official_date: toDate(schedule.OfficialDate),
    year: yearOf(schedule.OfficialDate),
    month: monthOf(schedule.OfficialDate),
    visibility_date: schedule.VisibilityDate ?? '',
    match_window_end_date: schedule.MatchWindowEndDate ?? '',
  }));
  const topRows = toVideoRows(topRowsBySchedule(cleanedRows, TOP_N));
  const videoPoolRows = toVideoRows(topRowsBySchedule(cleanedRows, VIDEO_POOL_N));
  const quarterTopRows = toVideoRows(topRowsBySchedule(quarterRows, TOP_N));
  const quarterVideoPoolRows = toVideoRows(topRowsBySchedule(quarterRows, VIDEO_POOL_N));
  const videoHeaders = [
    'date',
    'year',
    'quarter',
    'month',
    'name',
    'code',
    'region',
    'value',
    'rank',
    'color',
    'flag',
    'worldCupWins',
  ];

  const metadata = {
    source: {
      schedules: MEN_RANKING_SCHEDULES_URL,
      rankingsBySchedule: `${RANKINGS_BY_SCHEDULE_URL}?rankingScheduleId={schedule_id}&language=en`,
    },
    generatedAt: new Date().toISOString(),
    releaseCount: schedules.length,
    rawRowCount: allRows.length,
    rowCount: cleanedRows.length,
    droppedDuplicateRows: duplicateRows.length,
    videoTopN: TOP_N,
    videoPoolN: VIDEO_POOL_N,
    quarterReleaseCount: quarterSchedules.length,
    firstReleaseDate: scheduleRows[0]?.official_date ?? null,
    latestReleaseDate: scheduleRows.at(-1)?.official_date ?? null,
    note:
      'FIFA rankings are available by official release date, not guaranteed once per calendar month. Use official_date/year/month for monthly grouping. Duplicate schedule/country rows from the source API are dropped from the cleaned CSV.',
  };

  await writeCsv(
    path.join(DATA_DIR, 'fifa_mens_ranking_schedules.csv'),
    scheduleRows,
    [
      'schedule_id',
      'official_date',
      'year',
      'month',
      'visibility_date',
      'match_window_end_date',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'fifa_mens_rankings.csv'),
    cleanedRows,
    [
      'schedule_id',
      'official_date',
      'year',
      'month',
      'rank',
      'previous_rank',
      'ranking_movement',
      'team_name',
      'country_code',
      'confederation',
      'points',
      'points_decimal',
      'previous_points_decimal',
      'matches',
      'status_ranked',
      'color',
      'flag',
      'world_cup_wins',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'fifa_mens_rankings_top8_video.csv'),
    topRows,
    videoHeaders,
  );
  await writeCsv(
    path.join(DATA_DIR, 'fifa_mens_rankings_top40_video.csv'),
    videoPoolRows,
    videoHeaders,
  );
  await writeCsv(
    path.join(DATA_DIR, 'fifa_mens_rankings_top8_quarter_video.csv'),
    quarterTopRows,
    videoHeaders,
  );
  await writeCsv(
    path.join(DATA_DIR, 'fifa_mens_rankings_top40_quarter_video.csv'),
    quarterVideoPoolRows,
    videoHeaders,
  );
  await writeFile(
    path.join(GENERATED_SOURCE_DIR, 'fifaMensRankingRaceCsv.ts'),
    generatedRaceCsvModule(videoPoolRows, videoHeaders),
  );
  await writeFile(
    path.join(DATA_DIR, 'fifa_mens_rankings.meta.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );

  console.log(
    `Saved ${cleanedRows.length} ranking rows to ${path.join(DATA_DIR, 'fifa_mens_rankings.csv')} (${duplicateRows.length} duplicates dropped)`,
  );
};

const toVideoRows = (rows) => rows.map((row) => ({
  date: row.official_date,
  year: row.year,
  quarter: quarterOf(row.official_date),
  month: row.month,
  name: row.team_name,
  code: row.country_code,
  region: row.confederation,
  value: row.points_decimal,
  rank: row.rank,
  color: row.color,
  flag: row.flag,
  worldCupWins: row.world_cup_wins,
}));

const latestScheduleInEachQuarter = (schedules) => {
  const scheduleByQuarter = new Map();

  for (const schedule of schedules) {
    const key = `${yearOf(schedule.OfficialDate)}-Q${quarterOf(schedule.OfficialDate)}`;
    scheduleByQuarter.set(key, schedule);
  }

  return [...scheduleByQuarter.values()].sort(
    (a, b) => new Date(a.OfficialDate).getTime() - new Date(b.OfficialDate).getTime(),
  );
};

const fetchRankingsForSchedule = (scheduleId) =>
  fetchJson(`${RANKINGS_BY_SCHEDULE_URL}?rankingScheduleId=${encodeURIComponent(scheduleId)}&language=en`);

const dedupeRowsByScheduleAndCountry = (rows) => {
  const seen = new Set();
  const duplicateRows = [];
  const cleanedRows = [];

  for (const row of rows) {
    const key = `${row.schedule_id}:${row.country_code}`;

    if (seen.has(key)) {
      duplicateRows.push(row);
      continue;
    }

    seen.add(key);
    cleanedRows.push(row);
  }

  return { rows: cleanedRows, duplicateRows };
};

const topRowsBySchedule = (rows, topN) => {
  const rowsBySchedule = new Map();

  for (const row of rows) {
    const groupedRows = rowsBySchedule.get(row.schedule_id) ?? [];
    groupedRows.push(row);
    rowsBySchedule.set(row.schedule_id, groupedRows);
  }

  return [...rowsBySchedule.values()].flatMap((rowsForSchedule) =>
    rowsForSchedule
      .filter((row) => Number.isFinite(Number(row.rank)) && Number(row.rank) > 0)
      .toSorted((a, b) => Number(a.rank) - Number(b.rank))
      .slice(0, topN),
  );
};

const fetchJson = async (url, attempt = 1) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'QuadrillionDataCollector/1.0',
    },
  });

  if (!response.ok) {
    if (attempt < 4 && response.status >= 500) {
      await sleep(500 * attempt);
      return fetchJson(url, attempt + 1);
    }

    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url}`);
  }

  return response.json();
};

const toRankingRow = (schedule, releaseDate, ranking) => {
  const countryCode = ranking.IdCountry ?? '';

  return {
    schedule_id: schedule.IdRankingSchedule,
    official_date: releaseDate,
    year: releaseDate.slice(0, 4),
    month: releaseDate.slice(5, 7),
    rank: valueOrEmpty(ranking.Rank),
    previous_rank: valueOrEmpty(ranking.PrevRank),
    ranking_movement: valueOrEmpty(ranking.RankingMovement),
    team_name: localizedName(ranking.TeamName),
    country_code: countryCode,
    confederation: ranking.ConfederationName ?? '',
    points: valueOrEmpty(ranking.TotalPoints),
    points_decimal: valueOrEmpty(ranking.DecimalTotalPoints),
    previous_points_decimal: valueOrEmpty(ranking.DecimalPrevPoints),
    matches: valueOrEmpty(ranking.Matches),
    status_ranked: valueOrEmpty(ranking.StatusRanked),
    color: colorByCountry.get(countryCode) ?? fallbackColor(countryCode),
    flag: countryCode,
    world_cup_wins: worldCupWinsByCountry.get(countryCode) ?? 0,
  };
};

const localizedName = (names) => names?.find((name) => name.Locale === 'en-GB')?.Description ?? names?.[0]?.Description ?? '';

const toDate = (date) => new Date(date).toISOString().slice(0, 10);

const yearOf = (date) => toDate(date).slice(0, 4);

const monthOf = (date) => toDate(date).slice(5, 7);

const quarterOf = (date) => Math.floor((Number(monthOf(date)) - 1) / 3) + 1;

const valueOrEmpty = (value) => (value === null || value === undefined ? '' : value);

const fallbackColor = (code) => {
  let hash = 0;

  for (const char of code) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }

  return hslToHex(hash, 74, 58);
};

const hslToHex = (h, s, l) => {
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lightness - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return `#${[r, g, b]
    .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
};

const writeCsv = async (filePath, rows, headers) => {
  await writeFile(filePath, `${toCsv(rows, headers)}\n`);
};

const generatedRaceCsvModule = (rows, headers) => {
  const csv = `${toCsv(rows, headers)}\n`;

  return [
    '// Generated by scripts/fetch-fifa-rankings.mjs. Do not edit manually.',
    'export const fifaMensRankingRaceCsv =',
    `  ${JSON.stringify(csv)};`,
    '',
  ].join('\n');
};

const toCsv = (rows, headers) => {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ];

  return lines.join('\n');
};

const csvCell = (value) => {
  const text = String(value ?? '');

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
