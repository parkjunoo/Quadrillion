import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_CSV = path.resolve('data/football-market-values/football_player_market_values_monthly_top100.csv');
const SOURCE_META = path.resolve('data/football-market-values/football_player_market_values.meta.json');
const DATA_DIR = path.resolve('data/world-cup-squad-values');
const GENERATED_SOURCE_DIR = path.resolve('src/projects/world-cup-squad-values/generated');
const VIDEO_CSV_FILE = path.join(DATA_DIR, 'world_cup_squad_values_top_player_proxy.csv');
const META_FILE = path.join(DATA_DIR, 'world_cup_squad_values.meta.json');
const GENERATED_TS_FILE = path.join(GENERATED_SOURCE_DIR, 'worldCupSquadValueSnapshots.ts');
const PLAYERS_PER_COUNTRY = 8;
const COUNTRIES_PER_TOURNAMENT = 8;

const tournaments = [
  {
    year: 2006,
    date: '2006-06-01',
    host: 'Germany',
    champion: 'Italy',
    qualifiedCountries: [
      'Angola',
      'Argentina',
      'Australia',
      'Brazil',
      'Costa Rica',
      'Croatia',
      'Czech Republic',
      'Ecuador',
      'England',
      'France',
      'Germany',
      'Ghana',
      'Iran',
      'Italy',
      'Ivory Coast',
      'Japan',
      'Mexico',
      'Netherlands',
      'Paraguay',
      'Poland',
      'Portugal',
      'Saudi Arabia',
      'Serbia and Montenegro',
      'South Korea',
      'Spain',
      'Sweden',
      'Switzerland',
      'Togo',
      'Trinidad and Tobago',
      'Tunisia',
      'Ukraine',
      'United States',
    ],
  },
  {
    year: 2010,
    date: '2010-06-01',
    host: 'South Africa',
    champion: 'Spain',
    qualifiedCountries: [
      'Algeria',
      'Argentina',
      'Australia',
      'Brazil',
      'Cameroon',
      'Chile',
      'Denmark',
      'England',
      'France',
      'Germany',
      'Ghana',
      'Greece',
      'Honduras',
      'Italy',
      'Ivory Coast',
      'Japan',
      'Mexico',
      'Netherlands',
      'New Zealand',
      'Nigeria',
      'North Korea',
      'Paraguay',
      'Portugal',
      'Serbia',
      'Slovakia',
      'Slovenia',
      'South Africa',
      'South Korea',
      'Spain',
      'Switzerland',
      'United States',
      'Uruguay',
    ],
  },
  {
    year: 2014,
    date: '2014-06-01',
    host: 'Brazil',
    champion: 'Germany',
    qualifiedCountries: [
      'Algeria',
      'Argentina',
      'Australia',
      'Belgium',
      'Bosnia-Herzegovina',
      'Brazil',
      'Cameroon',
      'Chile',
      'Colombia',
      'Costa Rica',
      'Croatia',
      'Ecuador',
      'England',
      'France',
      'Germany',
      'Ghana',
      'Greece',
      'Honduras',
      'Iran',
      'Italy',
      'Ivory Coast',
      'Japan',
      'Mexico',
      'Netherlands',
      'Nigeria',
      'Portugal',
      'Russia',
      'South Korea',
      'Spain',
      'Switzerland',
      'United States',
      'Uruguay',
    ],
  },
  {
    year: 2018,
    date: '2018-06-01',
    host: 'Russia',
    champion: 'France',
    qualifiedCountries: [
      'Argentina',
      'Australia',
      'Belgium',
      'Brazil',
      'Colombia',
      'Costa Rica',
      'Croatia',
      'Denmark',
      'Egypt',
      'England',
      'France',
      'Germany',
      'Iceland',
      'Iran',
      'Japan',
      'Mexico',
      'Morocco',
      'Nigeria',
      'Panama',
      'Peru',
      'Poland',
      'Portugal',
      'Russia',
      'Saudi Arabia',
      'Senegal',
      'Serbia',
      'South Korea',
      'Spain',
      'Sweden',
      'Switzerland',
      'Tunisia',
      'Uruguay',
    ],
  },
  {
    year: 2022,
    date: '2022-11-01',
    host: 'Qatar',
    champion: 'Argentina',
    qualifiedCountries: [
      'Argentina',
      'Australia',
      'Belgium',
      'Brazil',
      'Cameroon',
      'Canada',
      'Costa Rica',
      'Croatia',
      'Denmark',
      'Ecuador',
      'England',
      'France',
      'Germany',
      'Ghana',
      'Iran',
      'Japan',
      'Mexico',
      'Morocco',
      'Netherlands',
      'Poland',
      'Portugal',
      'Qatar',
      'Saudi Arabia',
      'Senegal',
      'Serbia',
      'South Korea',
      'Spain',
      'Switzerland',
      'Tunisia',
      'United States',
      'Uruguay',
      'Wales',
    ],
  },
];

const sourceCountryByDisplayCountry = new Map([
  ['Bosnia-Herzegovina', 'Bosnia-Herzegovina'],
  ['Czech Republic', 'Czech Republic'],
  ['Ivory Coast', "Cote d'Ivoire"],
  ['North Korea', 'Korea, North'],
  ['South Korea', 'Korea, South'],
  ['United States', 'United States'],
]);

const displayCountryBySourceCountry = new Map(
  [...sourceCountryByDisplayCountry.entries()].map(([display, source]) => [source, display]),
);

const countryCodes = new Map([
  ['Algeria', 'ALG'],
  ['Angola', 'ANG'],
  ['Argentina', 'ARG'],
  ['Australia', 'AUS'],
  ['Belgium', 'BEL'],
  ['Bosnia-Herzegovina', 'BIH'],
  ['Brazil', 'BRA'],
  ['Cameroon', 'CMR'],
  ['Canada', 'CAN'],
  ['Chile', 'CHI'],
  ['Colombia', 'COL'],
  ['Costa Rica', 'CRC'],
  ['Croatia', 'CRO'],
  ['Czech Republic', 'CZE'],
  ['Denmark', 'DEN'],
  ['Ecuador', 'ECU'],
  ['Egypt', 'EGY'],
  ['England', 'ENG'],
  ['France', 'FRA'],
  ['Germany', 'GER'],
  ['Ghana', 'GHA'],
  ['Greece', 'GRE'],
  ['Honduras', 'HON'],
  ['Iceland', 'ISL'],
  ['Iran', 'IRN'],
  ['Italy', 'ITA'],
  ['Ivory Coast', 'CIV'],
  ['Japan', 'JPN'],
  ['Mexico', 'MEX'],
  ['Morocco', 'MAR'],
  ['Netherlands', 'NED'],
  ['New Zealand', 'NZL'],
  ['Nigeria', 'NGA'],
  ['North Korea', 'PRK'],
  ['Panama', 'PAN'],
  ['Paraguay', 'PAR'],
  ['Peru', 'PER'],
  ['Poland', 'POL'],
  ['Portugal', 'POR'],
  ['Qatar', 'QAT'],
  ['Russia', 'RUS'],
  ['Saudi Arabia', 'KSA'],
  ['Senegal', 'SEN'],
  ['Serbia', 'SRB'],
  ['Serbia and Montenegro', 'SCG'],
  ['Slovakia', 'SVK'],
  ['Slovenia', 'SVN'],
  ['South Africa', 'RSA'],
  ['South Korea', 'KOR'],
  ['Spain', 'ESP'],
  ['Sweden', 'SWE'],
  ['Switzerland', 'SUI'],
  ['Togo', 'TOG'],
  ['Trinidad and Tobago', 'TTO'],
  ['Tunisia', 'TUN'],
  ['Ukraine', 'UKR'],
  ['United States', 'USA'],
  ['Uruguay', 'URU'],
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
];

const main = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(GENERATED_SOURCE_DIR, { recursive: true });

  const rows = parseCsv(await readFile(SOURCE_CSV, 'utf8')).map(toPlayerRow);
  const sourceMeta = JSON.parse(await readFile(SOURCE_META, 'utf8'));
  const snapshots = tournaments.map((tournament) => buildTournamentSnapshot(tournament, rows));
  const videoRows = snapshots.flatMap((snapshot) =>
    snapshot.countries.flatMap((country) =>
      country.players.map((player) => ({
        year: snapshot.year,
        tournament: snapshot.label,
        date: snapshot.date,
        host: snapshot.host,
        champion: snapshot.champion,
        country: country.name,
        code: country.code,
        country_rank: country.rank,
        country_total_million_eur: country.totalValue,
        player_rank: player.rank,
        player_id: player.id,
        player_name: player.name,
        player_code: player.code,
        position: player.position,
        club: player.club,
        value_million_eur: player.value,
        value_eur: player.valueEur,
        valuation_date: player.valuationDate,
        valuation_source: player.valuationSource,
        image_url: player.imageUrl,
        player_url: player.playerUrl,
      }))
    )
  );

  await writeCsv(VIDEO_CSV_FILE, videoRows, [
    'year',
    'tournament',
    'date',
    'host',
    'champion',
    'country',
    'code',
    'country_rank',
    'country_total_million_eur',
    'player_rank',
    'player_id',
    'player_name',
    'player_code',
    'position',
    'club',
    'value_million_eur',
    'value_eur',
    'valuation_date',
    'valuation_source',
    'image_url',
    'player_url',
  ]);
  await writeFile(GENERATED_TS_FILE, generatedSnapshotsModule(snapshots));
  await writeFile(
    META_FILE,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      source: sourceMeta.source,
      sourceInput: path.relative(process.cwd(), SOURCE_CSV),
      outputFiles: [
        path.relative(process.cwd(), VIDEO_CSV_FILE),
        path.relative(process.cwd(), GENERATED_TS_FILE),
      ],
      tournamentYears: snapshots.map((snapshot) => snapshot.year),
      countriesPerTournament: COUNTRIES_PER_TOURNAMENT,
      playersPerCountry: PLAYERS_PER_COUNTRY,
      method:
        'For completed men World Cup tournaments from 2006-2022, filter the monthly global top 100 Transfermarkt player valuation snapshot to qualified countries, sum each country available top-100-player values, and show the top countries plus their top players. This is a top-player proxy, not an official 23/26-man squad market-value total.',
    }, null, 2)}\n`,
  );

  console.log(`Wrote ${videoRows.length} player rows to ${VIDEO_CSV_FILE}`);
  console.log(`Wrote generated snapshots to ${GENERATED_TS_FILE}`);
};

const buildTournamentSnapshot = (tournament, rows) => {
  const qualifiedSources = new Set(
    tournament.qualifiedCountries.map((country) => sourceCountryByDisplayCountry.get(country) ?? country),
  );
  const rowsForDate = rows
    .filter((row) => row.date === tournament.date && qualifiedSources.has(row.sourceCountry))
    .sort((rowA, rowB) => rowB.value - rowA.value || rowA.name.localeCompare(rowB.name));
  const rowsByCountry = groupBy(rowsForDate, (row) => row.sourceCountry);
  const countries = [...rowsByCountry.entries()]
    .map(([sourceCountry, countryRows]) => {
      const displayName = displayCountryBySourceCountry.get(sourceCountry) ?? sourceCountry;
      const totalValue = round1(countryRows.reduce((sum, row) => sum + row.value, 0));
      const players = countryRows
        .slice(0, PLAYERS_PER_COUNTRY)
        .map((row, index) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          position: row.position,
          club: row.club,
          value: row.value,
          valueEur: row.valueEur,
          rank: index + 1,
          color: colorForPosition(row.position),
          imageUrl: row.imageUrl,
          playerUrl: row.playerUrl,
          valuationDate: row.valuationDate,
          valuationSource: row.valuationSource,
        }));

      return {
        id: stableId(displayName),
        name: displayName,
        code: countryCodes.get(displayName) ?? displayName.slice(0, 3).toUpperCase(),
        color: countryColors[Math.abs(hashText(displayName)) % countryColors.length],
        totalValue,
        playerCount: countryRows.length,
        rank: 0,
        players,
      };
    })
    .filter((country) => country.totalValue > 0)
    .sort((countryA, countryB) => countryB.totalValue - countryA.totalValue || countryA.name.localeCompare(countryB.name))
    .slice(0, COUNTRIES_PER_TOURNAMENT)
    .map((country, index) => ({
      ...country,
      rank: index + 1,
    }));

  return {
    year: tournament.year,
    label: `${tournament.year} ${tournament.host}`,
    date: tournament.date,
    host: tournament.host,
    champion: tournament.champion,
    countries,
  };
};

const toPlayerRow = (row) => ({
  date: row.date,
  id: row.player_id,
  name: row.name,
  code: row.player_code,
  sourceCountry: row.country,
  position: row.position,
  club: row.club,
  value: round1(Number(row.value_million_eur)),
  valueEur: Number(row.value_eur),
  valuationDate: row.valuation_date,
  valuationSource: row.valuation_source,
  imageUrl: row.image_url,
  playerUrl: row.player_url,
});

const generatedSnapshotsModule = (snapshots) => [
  '// Generated by scripts/build-world-cup-squad-values.mjs. Do not edit manually.',
  "import type { WorldCupSquadSnapshot } from '../squadValues';",
  '',
  'export const worldCupSquadValueSnapshots: WorldCupSquadSnapshot[] =',
  `  ${JSON.stringify(snapshots, null, 2)};`,
  '',
].join('\n');

const parseCsv = (csv) => {
  const [headerLine, ...bodyLines] = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));

  return bodyLines.map((line) => {
    const columns = splitCsvLine(line);

    return Object.fromEntries(
      headers.map((header) => [header, columns[headerIndex.get(header)] ?? '']),
    );
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

const csvValue = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const groupBy = (items, keyFor) => {
  const groups = new Map();

  for (const item of items) {
    const key = keyFor(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
};

const colorForPosition = (position) => {
  if (/goalkeeper/i.test(position)) {
    return '#F5E829';
  }

  if (/defender/i.test(position)) {
    return '#22C55E';
  }

  if (/midfield/i.test(position)) {
    return '#38BDF8';
  }

  if (/attack/i.test(position)) {
    return '#FF4D6D';
  }

  return '#FFFFFF';
};

const stableId = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const hashText = (text) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const round1 = (value) => Math.round(value * 10) / 10;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
