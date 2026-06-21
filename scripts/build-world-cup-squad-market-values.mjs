import { mkdir, readFile, writeFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const SQUADS_FILE = path.resolve('data/world-cup-squads/world_cup_squads.csv');
const OBSERVED_VALUES_FILE = path.resolve('data/football-market-values/football_player_market_values_observed.csv');
const FOOTBALL_VALUES_META_FILE = path.resolve('data/football-market-values/football_player_market_values.meta.json');
const DATA_DIR = path.resolve('data/world-cup-squad-market-values');
const PLAYER_OUTPUT_FILE = path.join(DATA_DIR, 'world_cup_squad_player_market_values.csv');
const COUNTRY_OUTPUT_FILE = path.join(DATA_DIR, 'world_cup_country_squad_market_values.csv');
const VIDEO_TOP5_OUTPUT_FILE = path.join(DATA_DIR, 'world_cup_country_squad_market_values_top5_video.csv');
const MISSING_OUTPUT_FILE = path.join(DATA_DIR, 'world_cup_squad_market_value_missing.csv');
const META_FILE = path.join(DATA_DIR, 'world_cup_squad_market_values.meta.json');
const GENERATED_SOURCE_DIR = path.resolve('src/projects/world-cup-squad-market-values/generated');
const GENERATED_TOP5_TS_FILE = path.join(GENERATED_SOURCE_DIR, 'worldCupSquadMarketValueTop5Csv.ts');
const START_YEAR = 1998;
const VIDEO_TOP_N = 5;
const PLAYER_PROFILES_URL = 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/players.csv.gz';

const countryCodes = new Map([
  ['Algeria', 'ALG'],
  ['Argentina', 'ARG'],
  ['Australia', 'AUS'],
  ['Belgium', 'BEL'],
  ['Bosnia and Herzegovina', 'BIH'],
  ['Brazil', 'BRA'],
  ['Cameroon', 'CMR'],
  ['Canada', 'CAN'],
  ['Cape Verde', 'CPV'],
  ['Chile', 'CHI'],
  ['Colombia', 'COL'],
  ['Costa Rica', 'CRC'],
  ['Croatia', 'CRO'],
  ['Curaçao', 'CUW'],
  ['Czech Republic', 'CZE'],
  ['Denmark', 'DEN'],
  ['DR Congo', 'COD'],
  ['Ecuador', 'ECU'],
  ['Egypt', 'EGY'],
  ['England', 'ENG'],
  ['France', 'FRA'],
  ['FR Yugoslavia', 'YUG'],
  ['Germany', 'GER'],
  ['Ghana', 'GHA'],
  ['Greece', 'GRE'],
  ['Haiti', 'HAI'],
  ['Honduras', 'HON'],
  ['Iceland', 'ISL'],
  ['Iran', 'IRN'],
  ['Iraq', 'IRQ'],
  ['Italy', 'ITA'],
  ['Ivory Coast', 'CIV'],
  ['Jamaica', 'JAM'],
  ['Japan', 'JPN'],
  ['Jordan', 'JOR'],
  ['Mexico', 'MEX'],
  ['Morocco', 'MAR'],
  ['Netherlands', 'NED'],
  ['New Zealand', 'NZL'],
  ['Nigeria', 'NGA'],
  ['Norway', 'NOR'],
  ['Panama', 'PAN'],
  ['Paraguay', 'PAR'],
  ['Peru', 'PER'],
  ['Poland', 'POL'],
  ['Portugal', 'POR'],
  ['Qatar', 'QAT'],
  ['Romania', 'ROU'],
  ['Russia', 'RUS'],
  ['Saudi Arabia', 'KSA'],
  ['Scotland', 'SCO'],
  ['Senegal', 'SEN'],
  ['Serbia', 'SRB'],
  ['Slovakia', 'SVK'],
  ['Slovenia', 'SVN'],
  ['South Africa', 'RSA'],
  ['South Korea', 'KOR'],
  ['Spain', 'ESP'],
  ['Sweden', 'SWE'],
  ['Switzerland', 'SUI'],
  ['Tunisia', 'TUN'],
  ['Turkey', 'TUR'],
  ['United States', 'USA'],
  ['Uruguay', 'URU'],
  ['Uzbekistan', 'UZB'],
  ['Wales', 'WAL'],
]);

const countryColors = [
  '#F5E829',
  '#38BDF8',
  '#FF4D6D',
  '#22C55E',
  '#F97316',
  '#A78BFA',
  '#2DD4BF',
  '#FB7185',
  '#84CC16',
  '#60A5FA',
  '#FACC15',
  '#E879F9',
  '#14B8A6',
  '#EF4444',
  '#A3E635',
];

const tournamentOpeningDates = new Map([
  [1998, '1998-06-10'],
  [2002, '2002-05-31'],
  [2006, '2006-06-09'],
  [2010, '2010-06-11'],
  [2014, '2014-06-12'],
  [2018, '2018-06-14'],
  [2022, '2022-11-20'],
  [2026, '2026-06-11'],
]);

const main = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(GENERATED_SOURCE_DIR, { recursive: true });

  const [squadRows, observedRows, footballValuesMeta, playerProfileSource] = await Promise.all([
    readCsv(SQUADS_FILE),
    readCsv(OBSERVED_VALUES_FILE),
    readJsonIfExists(FOOTBALL_VALUES_META_FILE),
    fetchGzipCsv(PLAYER_PROFILES_URL),
  ]);
  const profiles = playerProfileSource.rows.map(toPlayerProfile).filter((profile) => profile.id);
  const profileIndex = buildProfileIndex(profiles);
  profileIndex.sourceLastModified = playerProfileSource.lastModified;
  const valuesByPlayerId = buildValuesByPlayerId(observedRows);
  const targetSquadRows = squadRows.filter((row) => Number(row.year) >= START_YEAR);
  const playerRows = targetSquadRows.map((squadRow) =>
    buildPlayerValueRow({
      profileIndex,
      squadRow,
      valuesByPlayerId,
    }),
  );
  const countryRows = buildCountrySummaryRows(playerRows);
  const videoTop5Rows = buildVideoTopRows(countryRows);
  const missingRows = playerRows.filter((row) => row.match_status !== 'matched' || row.valuation_method === 'zero_filled_missing');

  await writeCsv(PLAYER_OUTPUT_FILE, playerRows, [
    'year',
    'tournament',
    'opening_date',
    'group',
    'country',
    'country_rank_by_total_value',
    'coach',
    'player_order',
    'shirt_number',
    'position',
    'player_name',
    'birth_date',
    'age',
    'is_captain',
    'squad_club',
    'caps',
    'goals',
    'transfermarkt_player_id',
    'transfermarkt_name',
    'transfermarkt_country',
    'transfermarkt_position',
    'transfermarkt_sub_position',
    'match_status',
    'match_confidence',
    'match_reason',
    'value_eur',
    'value_million_eur',
    'valuation_date',
    'valuation_method',
    'valuation_day_offset',
    'valuation_source',
    'valuation_club',
    'valuation_competition_id',
    'transfermarkt_player_url',
    'transfermarkt_image_url',
    'squad_source_url',
  ]);
  await writeCsv(COUNTRY_OUTPUT_FILE, countryRows, [
    'year',
    'tournament',
    'opening_date',
    'group',
    'country',
    'rank_by_total_value',
    'coach',
    'player_count',
    'matched_player_count',
    'valued_player_count',
    'before_or_on_valuation_count',
    'after_valuation_count',
    'missing_value_count',
    'value_coverage_percent',
    'total_value_eur',
    'total_value_million_eur',
    'average_value_million_eur',
    'median_value_million_eur',
    'top_player_name',
    'top_player_value_million_eur',
    'source_url',
  ]);
  await writeCsv(VIDEO_TOP5_OUTPUT_FILE, videoTop5Rows, [
    'year',
    'name',
    'code',
    'region',
    'value',
    'color',
    'rank',
    'source',
    'playerCount',
    'valuedPlayerCount',
    'missingPlayerCount',
    'coveragePercent',
  ]);
  await writeFile(
    GENERATED_TOP5_TS_FILE,
    generatedRaceCsvModule('worldCupSquadMarketValueTop5Csv', videoTop5Rows, [
      'year',
      'name',
      'code',
      'region',
      'value',
      'color',
      'rank',
      'source',
      'playerCount',
      'valuedPlayerCount',
      'missingPlayerCount',
      'coveragePercent',
    ]),
  );
  await writeCsv(MISSING_OUTPUT_FILE, missingRows, [
    'year',
    'country',
    'player_name',
    'birth_date',
    'position',
    'squad_club',
    'match_status',
    'match_confidence',
    'match_reason',
    'transfermarkt_player_id',
    'transfermarkt_name',
    'value_eur',
    'valuation_date',
    'squad_source_url',
  ]);
  await writeFile(
    META_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        startYear: START_YEAR,
        tournamentYears: [...new Set(playerRows.map((row) => row.year))],
        rowCount: playerRows.length,
        countryCount: countryRows.length,
        matchedPlayerRows: playerRows.filter((row) => row.match_status === 'matched').length,
        valuedPlayerRows: playerRows.filter(hasKnownMarketValue).length,
        missingRows: missingRows.length,
        coverageByYear: buildCoverageByYear(playerRows),
        source: {
          squads: 'data/world-cup-squads/world_cup_squads.csv',
          squadPagePattern: 'https://en.wikipedia.org/wiki/{year}_FIFA_World_Cup_squads',
          transfermarktDataset: footballValuesMeta?.source?.dataset ?? 'https://github.com/dcaribou/transfermarkt-datasets',
          transfermarktLicense:
            footballValuesMeta?.source?.license ??
            'CC0-1.0 for the transfermarkt-datasets repository release; original values are Transfermarkt estimates.',
          observedValues: 'data/football-market-values/football_player_market_values_observed.csv',
          players: {
            url: PLAYER_PROFILES_URL,
            lastModified: playerProfileSource.lastModified,
            etag: playerProfileSource.etag,
          },
        },
        outputFiles: [
          path.relative(process.cwd(), PLAYER_OUTPUT_FILE),
          path.relative(process.cwd(), COUNTRY_OUTPUT_FILE),
          path.relative(process.cwd(), VIDEO_TOP5_OUTPUT_FILE),
          path.relative(process.cwd(), MISSING_OUTPUT_FILE),
          path.relative(process.cwd(), GENERATED_TOP5_TS_FILE),
        ],
        method:
          'For every men FIFA World Cup squad player from 1998 onward, match the Wikipedia squad row to Transfermarkt player profiles primarily by normalized name plus exact birth date, then country/name fallbacks. Use the latest observed Transfermarkt value on or before the tournament opening date; if no earlier value exists, use the first observed value after opening and mark valuation_method as first_after_opening. If no confident player match or value is available, write value_eur as 0 and mark valuation_method as zero_filled_missing. Country totals sum all rows, so missing values contribute 0.',
        caveats: [
          'Transfermarkt values are estimates, not official FIFA squad values.',
          '1998 has limited true pre-tournament coverage because the observed Transfermarkt data starts in 2000; rows using later valuations are explicitly marked first_after_opening.',
          'Rows without a confident player-profile match or valuation are retained with blank value fields and listed in the missing file.',
        ],
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Player value rows: ${playerRows.length}`);
  console.log(`Country summary rows: ${countryRows.length}`);
  console.log(`Matched player rows: ${playerRows.filter((row) => row.match_status === 'matched').length}`);
  console.log(`Valued player rows: ${playerRows.filter(hasKnownMarketValue).length}`);
  console.log(`Missing rows: ${missingRows.length}`);
  console.log(`Video top ${VIDEO_TOP_N} rows: ${videoTop5Rows.length}`);
  console.log(`Saved data to ${DATA_DIR}`);
};

const buildPlayerValueRow = ({ profileIndex, squadRow, valuesByPlayerId }) => {
  const year = Number(squadRow.year);
  const openingDate = tournamentOpeningDates.get(year) ?? `${year}-06-01`;
  const match = matchProfile(squadRow, profileIndex);
  const observedValuation = match.profile ? findTournamentValue(valuesByPlayerId.get(match.profile.id) ?? [], openingDate) : null;
  const valuation =
    observedValuation ??
    (year === 2026 && match.profile?.currentMarketValue > 0
      ? {
          club: match.profile.currentClub,
          competitionId: match.profile.currentCompetitionId,
          date: dateOnlyFromHttpDate(profileIndex.sourceLastModified) || openingDate,
          imageUrl: match.profile.imageUrl,
          marketValueEur: match.profile.currentMarketValue,
          method: 'current_profile_value',
          playerUrl: match.profile.url,
          sourceTable: 'players.market_value_in_eur',
        }
      : null);
  const dayOffset = valuation ? daysBetween(openingDate, valuation.date) : '';

  return {
    year,
    tournament: squadRow.tournament,
    opening_date: openingDate,
    group: squadRow.group,
    country: squadRow.country,
    country_rank_by_total_value: '',
    coach: squadRow.coach,
    player_order: toNumberOrBlank(squadRow.player_order),
    shirt_number: toNumberOrBlank(squadRow.shirt_number),
    position: squadRow.position,
    player_name: squadRow.player_name,
    birth_date: normalizeDate(squadRow.birth_date),
    age: toNumberOrBlank(squadRow.age),
    is_captain: squadRow.is_captain,
    squad_club: squadRow.club,
    caps: toNumberOrBlank(squadRow.caps),
    goals: toNumberOrBlank(squadRow.goals),
    transfermarkt_player_id: match.profile?.id ?? '',
    transfermarkt_name: match.profile?.name ?? '',
    transfermarkt_country: match.profile?.country ?? '',
    transfermarkt_position: match.profile?.position ?? '',
    transfermarkt_sub_position: match.profile?.subPosition ?? '',
    match_status: match.profile ? 'matched' : 'unmatched',
    match_confidence: match.confidence,
    match_reason: match.reason,
    value_eur: valuation?.marketValueEur ?? 0,
    value_million_eur: valuation ? roundMillion(valuation.marketValueEur) : 0,
    valuation_date: valuation?.date ?? '',
    valuation_method: valuation?.method ?? 'zero_filled_missing',
    valuation_day_offset: dayOffset,
    valuation_source: valuation?.sourceTable ?? '',
    valuation_club: valuation?.club ?? '',
    valuation_competition_id: valuation?.competitionId ?? '',
    transfermarkt_player_url: valuation?.playerUrl || match.profile?.url || '',
    transfermarkt_image_url: valuation?.imageUrl || match.profile?.imageUrl || '',
    squad_source_url: squadRow.source_url,
  };
};

const buildCountrySummaryRows = (playerRows) => {
  const grouped = groupBy(playerRows, (row) => `${row.year}\u0000${row.country}`);
  const rows = [];

  for (const groupRows of grouped.values()) {
    const valuedRows = groupRows.filter(hasKnownMarketValue);
    const values = valuedRows.map((row) => Number(row.value_eur)).sort((a, b) => a - b);
    const topPlayer = valuedRows
      .slice()
      .sort((rowA, rowB) => Number(rowB.value_eur) - Number(rowA.value_eur))[0];
    const totalValue = values.reduce((sum, value) => sum + value, 0);
    const first = groupRows[0];

    rows.push({
      year: first.year,
      tournament: first.tournament,
      opening_date: first.opening_date,
      group: first.group,
      country: first.country,
      rank_by_total_value: '',
      coach: first.coach,
      player_count: groupRows.length,
      matched_player_count: groupRows.filter((row) => row.match_status === 'matched').length,
      valued_player_count: valuedRows.length,
      before_or_on_valuation_count: valuedRows.filter((row) => row.valuation_method === 'latest_on_or_before_opening').length,
      after_valuation_count: valuedRows.filter((row) => row.valuation_method === 'first_after_opening').length,
      missing_value_count: groupRows.filter((row) => row.valuation_method === 'zero_filled_missing').length,
      value_coverage_percent: round1((valuedRows.length / Math.max(1, groupRows.length)) * 100),
      total_value_eur: totalValue,
      total_value_million_eur: roundMillion(totalValue),
      average_value_million_eur: values.length ? roundMillion(totalValue / groupRows.length) : 0,
      median_value_million_eur: values.length ? roundMillion(median(values)) : '',
      top_player_name: topPlayer?.player_name ?? '',
      top_player_value_million_eur: topPlayer ? topPlayer.value_million_eur : '',
      source_url: first.squad_source_url,
    });
  }

  const byYear = groupBy(rows, (row) => String(row.year));
  for (const yearRows of byYear.values()) {
    yearRows
      .slice()
      .sort(
        (rowA, rowB) =>
          Number(rowB.total_value_eur || 0) - Number(rowA.total_value_eur || 0) ||
          rowA.country.localeCompare(rowB.country),
      )
      .forEach((row, index) => {
        row.rank_by_total_value = index + 1;
      });
  }

  const rankByCountryYear = new Map(rows.map((row) => [`${row.year}\u0000${row.country}`, row.rank_by_total_value]));
  for (const playerRow of playerRows) {
    playerRow.country_rank_by_total_value = rankByCountryYear.get(`${playerRow.year}\u0000${playerRow.country}`) ?? '';
  }

  return rows.sort(
    (rowA, rowB) =>
      rowA.year - rowB.year ||
      rowA.rank_by_total_value - rowB.rank_by_total_value ||
      rowA.country.localeCompare(rowB.country),
  );
};

const buildVideoTopRows = (countryRows) =>
  countryRows
    .filter((row) => row.rank_by_total_value <= VIDEO_TOP_N)
    .sort((rowA, rowB) => rowA.year - rowB.year || rowA.rank_by_total_value - rowB.rank_by_total_value)
    .map((row) => ({
      year: row.year,
      name: row.country,
      code: countryCodes.get(row.country) ?? slugKey(row.country).slice(0, 3).toUpperCase(),
      region: row.group,
      value: row.total_value_million_eur,
      color: countryColors[Math.abs(hashText(row.country)) % countryColors.length],
      rank: row.rank_by_total_value,
      source: row.source_url,
      playerCount: row.player_count,
      valuedPlayerCount: row.valued_player_count,
      missingPlayerCount: row.missing_value_count,
      coveragePercent: row.value_coverage_percent,
    }));

const buildCoverageByYear = (playerRows) => {
  const grouped = groupBy(playerRows, (row) => String(row.year));
  const coverage = {};

  for (const [year, rows] of grouped.entries()) {
    const valuedRows = rows.filter(hasKnownMarketValue);

    coverage[year] = {
      playerRows: rows.length,
      matchedRows: rows.filter((row) => row.match_status === 'matched').length,
      valuedRows: valuedRows.length,
      latestOnOrBeforeOpeningRows: valuedRows.filter(
        (row) => row.valuation_method === 'latest_on_or_before_opening',
      ).length,
      firstAfterOpeningRows: valuedRows.filter((row) => row.valuation_method === 'first_after_opening').length,
      currentProfileValueRows: valuedRows.filter((row) => row.valuation_method === 'current_profile_value').length,
      valueCoveragePercent: round1((valuedRows.length / Math.max(1, rows.length)) * 100),
    };
  }

  return coverage;
};

const matchProfile = (squadRow, profileIndex) => {
  const nameKey = normalizeName(squadRow.player_name);
  const codeKey = slugKey(squadRow.player_name);
  const birthDate = normalizeDate(squadRow.birth_date);
  const countryKey = normalizeCountry(squadRow.country);
  const exactNameCandidates = uniqueProfiles([
    ...(profileIndex.byName.get(nameKey) ?? []),
    ...(profileIndex.byCode.get(codeKey) ?? []),
  ]);
  const exactNameDob = birthDate
    ? exactNameCandidates.filter((profile) => normalizeDate(profile.dateOfBirth) === birthDate)
    : [];

  if (exactNameDob.length > 0) {
    const countryPreferred = preferCountry(exactNameDob, countryKey);
    return {
      confidence: countryPreferred.countryMatch ? 1 : 0.96,
      profile: countryPreferred.profile,
      reason: countryPreferred.countryMatch ? 'name_birth_country' : 'name_birth',
    };
  }

  const exactNameCountry = preferCountry(
    birthDate
      ? exactNameCandidates.filter((profile) => !profile.dateOfBirth)
      : exactNameCandidates,
    countryKey,
  );
  if (exactNameCountry.profile && exactNameCountry.countryMatch) {
    return {
      confidence: birthDate ? 0.84 : 0.88,
      profile: exactNameCountry.profile,
      reason: birthDate ? 'name_country_birth_unmatched' : 'name_country',
    };
  }

  const dobCandidates = birthDate ? profileIndex.byBirthDate.get(birthDate) ?? [] : [];
  const dobCountryCandidates = dobCandidates.filter((profile) => countriesCompatible(profile.countryKey, countryKey));
  const fuzzyDobCountry = bestFuzzyNameMatch(squadRow.player_name, dobCountryCandidates);
  if (fuzzyDobCountry && fuzzyDobCountry.score >= 0.58) {
    return {
      confidence: round2(0.66 + fuzzyDobCountry.score * 0.24),
      profile: fuzzyDobCountry.profile,
      reason: 'birth_country_fuzzy_name',
    };
  }

  if (exactNameCandidates.length === 1) {
    return {
      confidence: 0.7,
      profile: exactNameCandidates[0],
      reason: 'unique_name',
    };
  }

  const fuzzyDob = bestFuzzyNameMatch(squadRow.player_name, dobCandidates);
  if (fuzzyDob && fuzzyDob.score >= 0.72) {
    return {
      confidence: round2(0.58 + fuzzyDob.score * 0.22),
      profile: fuzzyDob.profile,
      reason: 'birth_fuzzy_name',
    };
  }

  return {
    confidence: 0,
    profile: null,
    reason: 'no_confident_match',
  };
};

const preferCountry = (profiles, countryKey) => {
  if (!profiles.length) {
    return { countryMatch: false, profile: null };
  }

  const countryMatches = profiles.filter((profile) => countriesCompatible(profile.countryKey, countryKey));

  return {
    countryMatch: countryMatches.length > 0,
    profile: (countryMatches[0] ?? profiles[0]) ?? null,
  };
};

const bestFuzzyNameMatch = (squadName, profiles) => {
  let best = null;
  const squadTokens = nameTokens(squadName);

  for (const profile of profiles) {
    const score = tokenSimilarity(squadTokens, nameTokens(profile.name));

    if (!best || score > best.score) {
      best = { profile, score };
    }
  }

  return best;
};

const findTournamentValue = (rows, openingDate) => {
  if (!rows.length) {
    return null;
  }

  const openingMs = dateToMs(openingDate);
  let latestBefore = null;
  let firstAfter = null;

  for (const row of rows) {
    if (row.dateMs <= openingMs) {
      latestBefore = row;
      continue;
    }

    firstAfter = row;
    break;
  }

  if (latestBefore) {
    return {
      ...latestBefore,
      method: 'latest_on_or_before_opening',
    };
  }

  if (firstAfter) {
    return {
      ...firstAfter,
      method: 'first_after_opening',
    };
  }

  return null;
};

const toPlayerProfile = (row) => ({
  country: row.country_of_citizenship || '',
  countryKey: normalizeCountry(row.country_of_citizenship || ''),
  currentClub: row.current_club_name || '',
  currentCompetitionId: row.current_club_domestic_competition_id || '',
  currentMarketValue: Number(row.market_value_in_eur) || 0,
  dateOfBirth: normalizeDate(row.date_of_birth),
  id: row.player_id || '',
  imageUrl: row.image_url || '',
  name: row.name || row.player_code || '',
  nameKey: normalizeName(row.name || row.player_code || ''),
  playerCode: row.player_code || '',
  playerCodeKey: slugKey(row.player_code || row.name || ''),
  position: row.position || '',
  subPosition: row.sub_position || '',
  url: row.url || '',
});

const buildProfileIndex = (profiles) => {
  const byCode = new Map();
  const byName = new Map();
  const byBirthDate = new Map();

  for (const profile of profiles) {
    appendToMap(byCode, profile.playerCodeKey, profile);
    appendToMap(byName, profile.nameKey, profile);

    if (profile.dateOfBirth) {
      appendToMap(byBirthDate, profile.dateOfBirth, profile);
    }
  }

  return { byBirthDate, byCode, byName };
};

const buildValuesByPlayerId = (rows) => {
  const byPlayerId = new Map();

  for (const row of rows) {
    const playerId = row.player_id;
    const value = Number(row.market_value_eur);
    const date = normalizeDate(row.date);

    if (!playerId || !date || !Number.isFinite(value) || value <= 0) {
      continue;
    }

    appendToMap(byPlayerId, playerId, {
      club: row.club || '',
      competitionId: row.competition_id || '',
      date,
      dateMs: dateToMs(date),
      imageUrl: row.image_url || '',
      marketValueEur: value,
      playerUrl: row.player_url || '',
      sourceTable: row.source_table || '',
    });
  }

  for (const values of byPlayerId.values()) {
    values.sort((rowA, rowB) => rowA.dateMs - rowB.dateMs);
  }

  return byPlayerId;
};

const readCsv = async (filePath) => parseCsv(await readFile(filePath, 'utf8'));

const hasKnownMarketValue = (row) => row.valuation_method !== 'zero_filled_missing' && Number(row.value_eur) > 0;

const readJsonIfExists = async (filePath) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
};

const fetchGzipCsv = async (url) => {
  const response = await requestBuffer(url);
  const text = gunzipSync(response.body).toString('utf8');

  return {
    etag: response.headers.etag ?? null,
    lastModified: response.headers['last-modified'] ?? null,
    rows: parseCsv(text),
  };
};

const requestBuffer = (url, redirectCount = 0) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'QuadrillionWorldCupSquadMarketValues/0.1 (local data script)',
        },
      },
      (response) => {
        const location = response.headers.location;

        if (
          location &&
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400
        ) {
          if (redirectCount >= 5) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }

          const nextUrl = new URL(location, url).toString();
          response.resume();
          resolve(requestBuffer(nextUrl, redirectCount + 1));
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Request failed for ${url}: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () =>
          resolve({
            body: Buffer.concat(chunks),
            headers: response.headers,
          }),
        );
      },
    );

    request.on('error', reject);
    request.end();
  });

const parseCsv = (csv) => {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const [headerLine, ...bodyLines] = lines;
  const headers = splitCsvLine(headerLine);

  return bodyLines.map((line) => {
    const columns = splitCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = columns[index] ?? '';
    });

    return row;
  });
};

const splitCsvLine = (line) => {
  const columns = [];
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

const writeCsv = async (filePath, rows, headers) => {
  const body = rows.map((row) => headers.map((header) => csvValue(row[header])).join(','));
  await writeFile(filePath, `${headers.join(',')}\n${body.join('\n')}\n`);
};

const generatedRaceCsvModule = (exportName, rows, headers) => [
  '// Generated by scripts/build-world-cup-squad-market-values.mjs. Do not edit manually.',
  `export const ${exportName} = ${JSON.stringify(
    `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvValue(row[header])).join(',')).join('\n')}\n`,
  )};`,
  '',
].join('\n');

const csvValue = (value) => {
  const stringValue = value === undefined || value === null ? '' : String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const normalizeName = (name) =>
  normalizeText(name)
    .replace(/\b(jr|junior|sr|senior)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const slugKey = (text) => normalizeName(text).replace(/\s+/g, '-');

const normalizeText = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/ø/g, 'o')
    .replace(/đ/g, 'd')
    .replace(/ł/g, 'l')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeCountry = (country) => {
  const normalized = normalizeText(country);
  const aliases = new Map([
    ['bosnia herzegovina', 'bosnia and herzegovina'],
    ['cote d ivoire', 'ivory coast'],
    ['cote divoire', 'ivory coast'],
    ['czechia', 'czech republic'],
    ['dr congo', 'dr congo'],
    ['korea north', 'north korea'],
    ['korea south', 'south korea'],
    ['korea republic', 'south korea'],
    ['russia', 'russia'],
    ['serbia montenegro', 'serbia and montenegro'],
    ['turkiye', 'turkey'],
    ['tuerkiye', 'turkey'],
    ['united states', 'united states'],
    ['usa', 'united states'],
  ]);

  return aliases.get(normalized) ?? normalized;
};

const countriesCompatible = (countryA, countryB) =>
  !countryA ||
  !countryB ||
  countryA === countryB ||
  countryA.includes(countryB) ||
  countryB.includes(countryA);

const nameTokens = (name) => new Set(normalizeName(name).split(' ').filter(Boolean));

const tokenSimilarity = (tokensA, tokensB) => {
  if (!tokensA.size || !tokensB.size) {
    return 0;
  }

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(tokensA.size, tokensB.size);
};

const normalizeDate = (date) => {
  const match = String(date ?? '').match(/(\d{4})\s*-\s*(\d{1,2})\s*-\s*(\d{1,2})/);

  if (!match) {
    return '';
  }

  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
};

const dateToMs = (date) => new Date(`${normalizeDate(date)}T00:00:00Z`).getTime();

const dateOnlyFromHttpDate = (httpDate) => {
  if (!httpDate) {
    return '';
  }

  const date = new Date(httpDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const daysBetween = (startDate, endDate) =>
  Math.round((dateToMs(endDate) - dateToMs(startDate)) / (24 * 60 * 60 * 1000));

const roundMillion = (value) => Math.round((Number(value) / 1_000_000) * 10) / 10;
const round1 = (value) => Math.round(Number(value) * 10) / 10;
const round2 = (value) => Math.round(Number(value) * 100) / 100;

const median = (values) => {
  const middle = Math.floor(values.length / 2);

  if (values.length % 2 === 1) {
    return values[middle];
  }

  return (values[middle - 1] + values[middle]) / 2;
};

const toNumberOrBlank = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
};

const hashText = (text) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const groupBy = (rows, keyFn) => {
  const grouped = new Map();

  for (const row of rows) {
    appendToMap(grouped, keyFn(row), row);
  }

  return grouped;
};

const appendToMap = (map, key, value) => {
  if (!key) {
    return;
  }

  if (!map.has(key)) {
    map.set(key, []);
  }

  map.get(key).push(value);
};

const uniqueProfiles = (profiles) => {
  const seen = new Set();
  const unique = [];

  for (const profile of profiles) {
    if (seen.has(profile.id)) {
      continue;
    }

    seen.add(profile.id);
    unique.push(profile);
  }

  return unique;
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
