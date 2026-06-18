import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const DATA_DIR = path.resolve('data/football-market-values');
const GENERATED_SOURCE_DIR = path.resolve('src/projects/football-market-values/generated');
const START_MONTH = '2000-01';
const REQUESTED_END_MONTH = '2026-12';
const MONTHLY_TOP_N = 100;
const MONTHLY_FOCUS_TOP_N = 10;
const VIDEO_TOP_N = 40;
const STALE_DAYS = 548;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SOURCES = {
  dataset: 'https://github.com/dcaribou/transfermarkt-datasets',
  playerValuations: 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/player_valuations.csv.gz',
  players: 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/players.csv.gz',
};

const colorPalette = [
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#BE123C',
  '#65A30D',
  '#C2410C',
  '#4F46E5',
  '#0D9488',
  '#A21CAF',
  '#B45309',
  '#15803D',
  '#1D4ED8',
  '#B91C1C',
  '#0369A1',
  '#9333EA',
  '#A16207',
  '#047857',
  '#9F1239',
  '#6D28D9',
  '#0F766E',
  '#CA8A04',
  '#4338CA',
  '#E11D48',
  '#0284C7',
  '#4D7C0F',
  '#B4538A',
  '#1E40AF',
  '#B83280',
  '#166534',
  '#92400E',
  '#5B21B6',
  '#155E75',
  '#991B1B',
  '#0E7490',
  '#854D0E',
  '#312E81',
  '#9D174D',
  '#075985',
  '#3F6212',
];

const main = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(GENERATED_SOURCE_DIR, { recursive: true });

  const [valuationSource, playerSource] = await Promise.all([
    fetchGzipCsv(SOURCES.playerValuations),
    fetchGzipCsv(SOURCES.players),
  ]);

  const playersById = new Map(
    playerSource.rows.map((player) => [
      player.player_id,
      {
        id: player.player_id,
        name: player.name || player.player_code || `Player ${player.player_id}`,
        code: player.player_code || `player-${player.player_id}`,
        country: player.country_of_citizenship || '',
        dateOfBirth: toDateOnly(player.date_of_birth),
        position: player.position || '',
        subPosition: player.sub_position || '',
        currentClubName: player.current_club_name || '',
        currentCompetitionId: player.current_club_domestic_competition_id || '',
        currentMarketValue: toNumber(player.market_value_in_eur),
        imageUrl: player.image_url || '',
        lastSeason: toNumber(player.last_season),
        url: player.url || '',
      },
    ]),
  );

  const currentProfileDate = dateOnlyFromHttpDate(playerSource.lastModified);
  const currentProfileSeason = seasonStartYearForDate(currentProfileDate);
  const historicalObservedRows = valuationSource.rows
    .map((row) => toObservedRow(row, playersById.get(row.player_id), 'player_valuations'))
    .filter((row) => row && row.month >= START_MONTH && row.month <= REQUESTED_END_MONTH);
  const currentProfileRows = [...playersById.values()]
    .filter((player) =>
      player.currentMarketValue > 0 &&
      player.lastSeason >= currentProfileSeason &&
      monthKey(currentProfileDate) >= START_MONTH &&
      monthKey(currentProfileDate) <= REQUESTED_END_MONTH
    )
    .map((player) => toCurrentProfileRow(player, currentProfileDate));
  const observedRows = [...historicalObservedRows, ...currentProfileRows]
    .sort(compareObservedRows);

  const latestSourceMonth = observedRows.at(-1)?.month ?? START_MONTH;
  const endMonth = minMonth(REQUESTED_END_MONTH, latestSourceMonth, currentMonth());
  const monthlyRows = buildMonthlySnapshots(observedRows, START_MONTH, endMonth);
  const monthlyTop10Rows = monthlyRows.filter((row) => row.rank <= MONTHLY_FOCUS_TOP_N);
  const top10PlayerIds = new Set(monthlyTop10Rows.map((row) => row.player_id));
  const top10PlayerPoolMonthlyRows = buildPlayerPoolMonthlySnapshots(
    observedRows,
    top10PlayerIds,
    START_MONTH,
    endMonth,
  );
  const top10PlayerPoolRows = buildPlayerPoolRows(
    monthlyTop10Rows,
    top10PlayerPoolMonthlyRows,
    playersById,
  );
  const monthlyTop10VideoRows = monthlyTop10Rows.map(toVideoRow);
  const videoRows = monthlyRows.filter((row) => row.rank <= VIDEO_TOP_N).map(toVideoRow);
  const top10VideoRows = top10PlayerPoolMonthlyRows.map(toVideoRow);

  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_observed.csv'),
    observedRows,
    [
      'date',
      'year',
      'month',
      'player_id',
      'name',
      'player_code',
      'country',
      'position',
      'sub_position',
      'club',
      'competition_id',
      'market_value_eur',
      'market_value_million_eur',
      'source_table',
      'image_url',
      'player_url',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_monthly_top100.csv'),
    monthlyRows,
    [
      'date',
      'year',
      'quarter',
      'month',
      'rank',
      'player_id',
      'name',
      'player_code',
      'country',
      'position',
      'sub_position',
      'club',
      'competition_id',
      'value_eur',
      'value_million_eur',
      'valuation_date',
      'valuation_age_days',
      'valuation_source',
      'color',
      'image_url',
      'player_url',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_monthly_top10.csv'),
    monthlyTop10Rows,
    [
      'date',
      'year',
      'quarter',
      'month',
      'rank',
      'player_id',
      'name',
      'player_code',
      'country',
      'position',
      'sub_position',
      'club',
      'competition_id',
      'value_eur',
      'value_million_eur',
      'valuation_date',
      'valuation_age_days',
      'valuation_source',
      'color',
      'image_url',
      'player_url',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_top10_player_pool.csv'),
    top10PlayerPoolRows,
    [
      'player_id',
      'name',
      'player_code',
      'country',
      'date_of_birth',
      'position',
      'sub_position',
      'current_club',
      'current_competition_id',
      'first_top10_month',
      'last_top10_month',
      'top10_months',
      'peak_rank',
      'peak_value_eur',
      'peak_value_million_eur',
      'peak_value_month',
      'latest_tracked_month',
      'latest_value_eur',
      'latest_value_million_eur',
      'latest_global_rank',
      'color',
      'image_url',
      'player_url',
      'transfer_history_status',
      'photo_mosaic_status',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_top10_player_pool_monthly.csv'),
    top10PlayerPoolMonthlyRows,
    [
      'date',
      'year',
      'quarter',
      'month',
      'pool_rank',
      'global_rank',
      'top10_rank',
      'is_top10',
      'player_id',
      'name',
      'player_code',
      'country',
      'position',
      'sub_position',
      'club',
      'competition_id',
      'value_eur',
      'value_million_eur',
      'valuation_date',
      'valuation_age_days',
      'valuation_source',
      'color',
      'image_url',
      'player_url',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_top10_player_pool_video.csv'),
    top10VideoRows,
    [
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
      'playerId',
      'playerCode',
      'club',
      'position',
      'valuationDate',
      'valuationSource',
      'valueEur',
      'isTop10',
      'globalRank',
      'imageUrl',
    ],
  );
  await writeFile(
    path.join(GENERATED_SOURCE_DIR, 'footballMarketValueTop10RaceCsv.ts'),
    generatedRaceCsvModule(top10VideoRows, [
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
      'playerId',
      'playerCode',
      'club',
      'position',
      'valuationDate',
      'valuationSource',
      'valueEur',
      'isTop10',
      'globalRank',
      'imageUrl',
    ]),
  );
  await writeCsv(
    path.join(DATA_DIR, 'football_player_market_values_top40_video.csv'),
    videoRows,
    [
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
      'playerId',
      'playerCode',
      'club',
      'position',
      'valuationDate',
      'valuationSource',
      'valueEur',
    ],
  );

  const metadata = {
    source: {
      dataset: SOURCES.dataset,
      license: 'CC0-1.0 for the transfermarkt-datasets repository release; original values are Transfermarkt estimates.',
      playerValuations: {
        url: SOURCES.playerValuations,
        lastModified: valuationSource.lastModified,
        etag: valuationSource.etag,
      },
      players: {
        url: SOURCES.players,
        lastModified: playerSource.lastModified,
        etag: playerSource.etag,
      },
    },
    generatedAt: new Date().toISOString(),
    requestedStartMonth: START_MONTH,
    requestedEndMonth: REQUESTED_END_MONTH,
    actualEndMonth: endMonth,
    staleDays: STALE_DAYS,
    observedRowCount: observedRows.length,
    historicalObservedRowCount: historicalObservedRows.length,
    currentProfileSnapshotRowCount: currentProfileRows.length,
    currentProfileSnapshotDate: currentProfileDate,
    monthlyTopN: MONTHLY_TOP_N,
    monthlyRowCount: monthlyRows.length,
    monthlyFocusTopN: MONTHLY_FOCUS_TOP_N,
    monthlyTop10RowCount: monthlyTop10Rows.length,
    top10PlayerPoolCount: top10PlayerPoolRows.length,
    top10PlayerPoolMonthlyRowCount: top10PlayerPoolMonthlyRows.length,
    videoTopN: VIDEO_TOP_N,
    videoRowCount: videoRows.length,
    top10PlayerPoolVideoRowCount: top10VideoRows.length,
    method:
      'Monthly snapshots rank players by the latest observed Transfermarkt market value available on or before the final day of each month. Historical observations come from player_valuations. Active-player current profile market values from players.csv are added as a current-month snapshot when the historical valuation table is behind the dataset refresh date. Values older than staleDays are excluded to avoid carrying inactive players indefinitely. The top10 player pool includes every player who appears in a monthly global top 10 at least once, then tracks those players across every month where they have an active value. Monthly CSV values are top 100; video CSV values are top 40 and top10-player-pool rows use value in millions of euros for the existing chart-race parser.',
    outputFiles: [
      'football_player_market_values_observed.csv',
      'football_player_market_values_monthly_top100.csv',
      'football_player_market_values_monthly_top10.csv',
      'football_player_market_values_top10_player_pool.csv',
      'football_player_market_values_top10_player_pool_monthly.csv',
      'football_player_market_values_top10_player_pool_video.csv',
      'src/projects/football-market-values/generated/footballMarketValueTop10RaceCsv.ts',
      'football_player_market_values_top40_video.csv',
    ],
  };

  await writeFile(
    path.join(DATA_DIR, 'football_player_market_values.meta.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );

  console.log(`Observed valuation rows: ${observedRows.length}`);
  console.log(`Monthly top ${MONTHLY_TOP_N} rows: ${monthlyRows.length}`);
  console.log(`Monthly top ${MONTHLY_FOCUS_TOP_N} rows: ${monthlyTop10Rows.length}`);
  console.log(`Top ${MONTHLY_FOCUS_TOP_N} player pool: ${top10PlayerPoolRows.length} players`);
  console.log(`Top ${MONTHLY_FOCUS_TOP_N} player pool monthly rows: ${top10PlayerPoolMonthlyRows.length}`);
  console.log(`Video top ${VIDEO_TOP_N} rows: ${videoRows.length}`);
  console.log(`Saved data to ${DATA_DIR}`);
};

const fetchGzipCsv = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const compressed = Buffer.from(await response.arrayBuffer());
  const text = gunzipSync(compressed).toString('utf8');

  return {
    rows: parseCsv(text),
    lastModified: response.headers.get('last-modified'),
    etag: response.headers.get('etag'),
  };
};

const toObservedRow = (row, player, sourceTable) => {
  const value = toNumber(row.market_value_in_eur);
  const date = toDateOnly(row.date);

  if (!date || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const [year, month] = monthParts(monthKey(date));
  const playerId = row.player_id;
  const fallbackName = `Player ${playerId}`;
  const playerCode = player?.code || `player-${playerId}`;

  return {
    date,
    year,
    month: monthKey(date),
    player_id: playerId,
    name: displayNameForPlayer(playerId, player?.name || fallbackName),
    player_code: playerCode,
    country: player?.country || '',
    position: player?.position || '',
    sub_position: player?.subPosition || '',
    club: row.current_club_name || player?.currentClubName || '',
    competition_id: row.player_club_domestic_competition_id || player?.currentCompetitionId || '',
    market_value_eur: value,
    market_value_million_eur: roundMillion(value),
    source_table: sourceTable,
    image_url: player?.imageUrl || '',
    player_url: player?.url || '',
    dateMs: dateToMs(date),
    monthNumber: month,
    color: colorForPlayer(playerId),
    lastSeason: player?.lastSeason ?? null,
  };
};

const toCurrentProfileRow = (player, date) => {
  const [year, month] = monthParts(monthKey(date));

  return {
    date,
    year,
    month: monthKey(date),
    player_id: player.id,
    name: displayNameForPlayer(player.id, player.name),
    player_code: player.code,
    country: player.country,
    position: player.position,
    sub_position: player.subPosition,
    club: player.currentClubName,
    competition_id: player.currentCompetitionId,
    market_value_eur: player.currentMarketValue,
    market_value_million_eur: roundMillion(player.currentMarketValue),
    source_table: 'players.current_market_value',
    image_url: player.imageUrl,
    player_url: player.url,
    dateMs: dateToMs(date),
    monthNumber: month,
    color: colorForPlayer(player.id),
    lastSeason: player.lastSeason,
  };
};

const buildMonthlySnapshots = (observedRows, startMonth, endMonth) => {
  const latestByPlayerId = new Map();
  const monthlyRows = [];
  let observedIndex = 0;

  for (const month of monthsBetween(startMonth, endMonth)) {
    const [year, monthNumber] = monthParts(month);
    const monthEndMs = monthEndDateMs(year, monthNumber);

    while (
      observedIndex < observedRows.length &&
      observedRows[observedIndex].dateMs <= monthEndMs
    ) {
      latestByPlayerId.set(observedRows[observedIndex].player_id, observedRows[observedIndex]);
      observedIndex += 1;
    }

    const ranked = [...latestByPlayerId.values()]
      .filter((row) => isActiveMonthlyValue(row, monthEndMs))
      .sort(compareRankingRows)
      .slice(0, MONTHLY_TOP_N);

    ranked.forEach((row, index) => {
      const rank = index + 1;
      const ageDays = Math.floor((monthEndMs - row.dateMs) / MS_PER_DAY);

      monthlyRows.push({
        date: `${month}-01`,
        year,
        quarter: quarterFromMonth(monthNumber),
        month: monthNumber,
        rank,
        player_id: row.player_id,
        name: row.name,
        player_code: row.player_code,
        country: row.country,
        position: row.position,
        sub_position: row.sub_position,
        club: row.club,
        competition_id: row.competition_id,
        value_eur: row.market_value_eur,
        value_million_eur: roundMillion(row.market_value_eur),
        valuation_date: row.date,
        valuation_age_days: ageDays,
        valuation_source: row.source_table,
        color: row.color,
        image_url: row.image_url,
        player_url: row.player_url,
      });
    });
  }

  return monthlyRows;
};

const buildPlayerPoolMonthlySnapshots = (observedRows, playerIds, startMonth, endMonth) => {
  const latestByPlayerId = new Map();
  const monthlyRows = [];
  let observedIndex = 0;

  for (const month of monthsBetween(startMonth, endMonth)) {
    const [year, monthNumber] = monthParts(month);
    const monthEndMs = monthEndDateMs(year, monthNumber);

    while (
      observedIndex < observedRows.length &&
      observedRows[observedIndex].dateMs <= monthEndMs
    ) {
      latestByPlayerId.set(observedRows[observedIndex].player_id, observedRows[observedIndex]);
      observedIndex += 1;
    }

    const activeRows = [...latestByPlayerId.values()]
      .filter((row) => isActiveMonthlyValue(row, monthEndMs))
      .sort(compareRankingRows);
    const playerPoolRows = activeRows
      .map((row, index) => ({ row, globalRank: index + 1 }))
      .filter(({ row }) => playerIds.has(row.player_id));

    playerPoolRows.forEach(({ row, globalRank }, index) => {
      const ageDays = Math.floor((monthEndMs - row.dateMs) / MS_PER_DAY);
      const poolRank = index + 1;

      monthlyRows.push({
        date: `${month}-01`,
        year,
        quarter: quarterFromMonth(monthNumber),
        month: monthNumber,
        rank: poolRank,
        pool_rank: poolRank,
        global_rank: globalRank,
        top10_rank: globalRank <= MONTHLY_FOCUS_TOP_N ? globalRank : '',
        is_top10: globalRank <= MONTHLY_FOCUS_TOP_N ? 1 : 0,
        player_id: row.player_id,
        name: row.name,
        player_code: row.player_code,
        country: row.country,
        position: row.position,
        sub_position: row.sub_position,
        club: row.club,
        competition_id: row.competition_id,
        value_eur: row.market_value_eur,
        value_million_eur: roundMillion(row.market_value_eur),
        valuation_date: row.date,
        valuation_age_days: ageDays,
        valuation_source: row.source_table,
        color: row.color,
        image_url: row.image_url,
        player_url: row.player_url,
      });
    });
  }

  return monthlyRows;
};

const buildPlayerPoolRows = (monthlyTop10Rows, playerPoolMonthlyRows, playersById) => {
  const top10RowsByPlayerId = groupRowsByPlayerId(monthlyTop10Rows);
  const monthlyRowsByPlayerId = groupRowsByPlayerId(playerPoolMonthlyRows);

  return [...top10RowsByPlayerId.entries()]
    .map(([playerId, top10Rows]) => {
      const player = playersById.get(playerId);
      const sortedTop10Rows = top10Rows.toSorted(compareRowsByDate);
      const trackedRows = (monthlyRowsByPlayerId.get(playerId) ?? []).toSorted(compareRowsByDate);
      const firstTop10Row = sortedTop10Rows[0];
      const lastTop10Row = sortedTop10Rows.at(-1);
      const latestTrackedRow = trackedRows.at(-1) ?? lastTop10Row;
      const bestRankRow = sortedTop10Rows.toSorted((a, b) =>
        a.rank - b.rank ||
        b.value_eur - a.value_eur ||
        a.date.localeCompare(b.date)
      )[0];
      const peakValueRow = sortedTop10Rows.toSorted((a, b) =>
        b.value_eur - a.value_eur ||
        a.rank - b.rank ||
        a.date.localeCompare(b.date)
      )[0];

      return {
        player_id: playerId,
        name: player?.name || firstTop10Row.name,
        player_code: player?.code || firstTop10Row.player_code,
        country: player?.country || firstTop10Row.country,
        date_of_birth: player?.dateOfBirth || '',
        position: player?.position || firstTop10Row.position,
        sub_position: player?.subPosition || firstTop10Row.sub_position,
        current_club: player?.currentClubName || '',
        current_competition_id: player?.currentCompetitionId || '',
        first_top10_month: firstTop10Row.date.slice(0, 7),
        last_top10_month: lastTop10Row.date.slice(0, 7),
        top10_months: sortedTop10Rows.length,
        peak_rank: bestRankRow.rank,
        peak_value_eur: peakValueRow.value_eur,
        peak_value_million_eur: peakValueRow.value_million_eur,
        peak_value_month: peakValueRow.date.slice(0, 7),
        latest_tracked_month: latestTrackedRow.date.slice(0, 7),
        latest_value_eur: latestTrackedRow.value_eur,
        latest_value_million_eur: latestTrackedRow.value_million_eur,
        latest_global_rank: latestTrackedRow.global_rank || latestTrackedRow.rank,
        color: firstTop10Row.color,
        image_url: player?.imageUrl || firstTop10Row.image_url,
        player_url: player?.url || firstTop10Row.player_url,
        transfer_history_status: 'pending',
        photo_mosaic_status: player?.imageUrl ? 'image_url_available' : 'missing_image_url',
      };
    })
    .sort((a, b) =>
      a.first_top10_month.localeCompare(b.first_top10_month) ||
      a.peak_rank - b.peak_rank ||
      a.name.localeCompare(b.name)
    );
};

const isActiveMonthlyValue = (row, monthEndMs) => {
  const ageDays = Math.floor((monthEndMs - row.dateMs) / MS_PER_DAY);

  if (ageDays < 0 || ageDays > STALE_DAYS) {
    return false;
  }

  if (row.lastSeason && monthEndMs > seasonEndDateMs(row.lastSeason) + STALE_DAYS * MS_PER_DAY) {
    return false;
  }

  return row.market_value_eur > 0;
};

const toVideoRow = (row) => ({
  date: row.date,
  year: row.year,
  quarter: row.quarter,
  month: row.month,
  name: displayNameForPlayer(row.player_id, row.name),
  code: `P${row.player_id}`,
  region: row.country,
  value: row.value_million_eur,
  rank: row.pool_rank ?? row.rank,
  color: row.color,
  flag: '',
  playerId: row.player_id,
  playerCode: row.player_code,
  club: row.club,
  position: row.position,
  valuationDate: row.valuation_date,
  valuationSource: row.valuation_source,
  valueEur: row.value_eur,
  isTop10: row.is_top10 ?? (row.rank <= MONTHLY_FOCUS_TOP_N ? 1 : 0),
  globalRank: row.global_rank ?? row.rank,
  imageUrl: row.image_url,
});

const displayNameForPlayer = (playerId, name) =>
  toEnglishDisplayName(
    playerDisplayNameAliasesById[playerId] ?? playerDisplayNameAliasesByName[name] ?? name,
  );

const playerDisplayNameAliasesById = {
  371998: 'Vinicius Junior',
  4276: 'Carlos Tevez',
  6893: 'Gabriel Tamas',
};

const playerDisplayNameAliasesByName = {
  'Vinícius Júnior': 'Vinicius Junior',
  'Carlos Tévez': 'Carlos Tevez',
  'Gabriel Tamaș': 'Gabriel Tamas',
};

const toEnglishDisplayName = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[Łł]/g, 'l')
    .replace(/[Đđ]/g, 'd')
    .replace(/[Øø]/g, 'o')
    .replace(/[Ææ]/g, 'ae')
    .replace(/[Œœ]/g, 'oe')
    .replace(/ß/g, 'ss');

const writeCsv = async (filePath, rows, headers) => {
  await writeFile(filePath, `${toCsv(rows, headers)}\n`);
};

const generatedRaceCsvModule = (rows, headers) => {
  const csv = `${toCsv(rows, headers)}\n`;

  return [
    '// Generated by scripts/fetch-football-market-values.mjs. Do not edit manually.',
    'export const footballMarketValueTop10RaceCsv =',
    `  ${JSON.stringify(csv)};`,
    '',
  ].join('\n');
};

const toCsv = (rows, headers) => {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ];

  return lines.join('\n');
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }

      row.push(current);
      pushCsvRow(rows, row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current || row.length > 0) {
    row.push(current);
    pushCsvRow(rows, row);
  }

  const [headers, ...bodyRows] = rows;

  if (!headers) {
    return [];
  }

  return bodyRows.map((bodyRow) => Object.fromEntries(
    headers.map((header, index) => [header, bodyRow[index] ?? '']),
  ));
};

const pushCsvRow = (rows, row) => {
  if (row.length === 1 && row[0] === '') {
    return;
  }

  rows.push(row);
};

const csvEscape = (value) => {
  const text = String(value ?? '');

  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
};

const compareObservedRows = (a, b) =>
  a.dateMs - b.dateMs || Number(a.player_id) - Number(b.player_id);

const compareRankingRows = (a, b) =>
  b.market_value_eur - a.market_value_eur ||
  a.name.localeCompare(b.name) ||
  Number(a.player_id) - Number(b.player_id);

const compareRowsByDate = (a, b) =>
  a.date.localeCompare(b.date) ||
  Number(a.player_id) - Number(b.player_id);

const groupRowsByPlayerId = (rows) => {
  const rowsByPlayerId = new Map();

  for (const row of rows) {
    const playerRows = rowsByPlayerId.get(row.player_id) ?? [];
    playerRows.push(row);
    rowsByPlayerId.set(row.player_id, playerRows);
  }

  return rowsByPlayerId;
};

const toDateOnly = (value) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
};

const dateOnlyFromHttpDate = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const dateToMs = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const monthEndDateMs = (year, month) => Date.UTC(year, month, 0);

const seasonEndDateMs = (lastSeason) => Date.UTC(lastSeason + 1, 5, 30);

const seasonStartYearForDate = (date) => {
  const [year, month] = monthParts(monthKey(date));
  return month <= 6 ? year - 1 : year;
};

const monthKey = (value) => {
  if (typeof value === 'string') {
    return value.slice(0, 7);
  }

  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
};

const currentMonth = () => monthKey(new Date());

const monthParts = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return [year, monthNumber];
};

const monthsBetween = (startMonth, endMonth) => {
  const months = [];
  let [year, month] = monthParts(startMonth);
  const [endYear, endMonthNumber] = monthParts(endMonth);

  while (year < endYear || (year === endYear && month <= endMonthNumber)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;

    if (month > 12) {
      year += 1;
      month = 1;
    }
  }

  return months;
};

const quarterFromMonth = (month) => Math.floor((month - 1) / 3) + 1;

const minMonth = (...months) => months.sort()[0];

const roundMillion = (value) => Number((value / 1_000_000).toFixed(3));

const colorForPlayer = (playerId) => {
  const index = Math.abs(hashText(playerId)) % colorPalette.length;
  return colorPalette[index];
};

const hashText = (text) => {
  let hash = 0;

  for (const char of String(text)) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
