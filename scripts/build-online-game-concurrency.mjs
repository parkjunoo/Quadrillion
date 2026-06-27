import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, 'data/online-game-concurrency');
const PROFILE_DIR = join(ROOT, 'public/projects/online-game-concurrency/profiles');
const GENERATED_PATH = join(
  ROOT,
  'src/projects/online-game-concurrency/generated/onlineGameConcurrencyTop10Csv.ts',
);

const RAW_PATH = join(DATA_DIR, 'online_game_concurrent_players_annual.csv');
const PEAK_PATH = join(DATA_DIR, 'online_game_peak_by_game_year.csv');
const TOP10_PATH = join(DATA_DIR, 'online_game_top10_by_year.csv');
const ALL_TIME_PATH = join(DATA_DIR, 'online_game_all_time_top10.csv');
const ALL_TIME_NO_ROBLOX_PATH = join(
  DATA_DIR,
  'online_game_all_time_top10_excluding_roblox_experiences.csv',
);
const COVERAGE_PATH = join(DATA_DIR, 'online_game_yearly_coverage.csv');

const rawHeaders = [
  'year',
  'date',
  'name',
  'code',
  'region',
  'value',
  'color',
  'platform_scope',
  'metric_context',
  'source_type',
  'confidence',
  'source_url',
  'notes',
];

const topHeaders = [
  'year',
  'rank',
  'date',
  'name',
  'code',
  'region',
  'value',
  'color',
  'platform_scope',
  'metric_context',
  'source_type',
  'confidence',
  'source_url',
  'notes',
];

const generatedHeaders = [
  'date',
  'year',
  'month',
  'rank',
  'name',
  'code',
  'region',
  'value',
  'color',
  'imageUrl',
  'platformScope',
  'metricContext',
  'sourceType',
  'confidence',
  'sourceUrl',
  'observationDate',
  'notes',
];

const explicitProfileByCode = new Map([
  ['ARC_RAIDERS', 'arcraiders.svg'],
  ['BATTLEFIELD6', 'battlefield6.svg'],
  ['DFO', 'dfo.svg'],
  ['FORZAHORIZON6', 'forzahorizon6.svg'],
  ['SUBNAUTICA2', 'subnautica2.svg'],
  ['ROBLOX_ADOPTME', 'roblox_adoptme.svg'],
  ['ROBLOX_BLOXFRUITS', 'roblox_bloxfruits.svg'],
  ['ROBLOX_BROOKHAVEN', 'roblox_brookhaven.svg'],
  ['ROBLOX_DEADRAILS', 'roblox_deadrails.svg'],
  ['ROBLOX_DTI', 'roblox_dti.svg'],
  ['ROBLOX_FISCH', 'roblox_fisch.svg'],
  ['ROBLOX_FISHIT', 'roblox_fishit.svg'],
  ['ROBLOX_GROWGARDEN', 'roblox_growgarden.svg'],
  ['ROBLOX_LILNASX', 'roblox_lilnasx.svg'],
  ['ROBLOX_PETSIMX', 'roblox_petsimx.svg'],
  ['ROBLOX_PLANTSVSBRAINROTS', 'roblox_plantsvsbrainrots.svg'],
  ['ROBLOX_STEALBRAINROT', 'roblox_stealbrainrot.svg'],
  ['ROBLOX_STRONGESTBG', 'roblox_strongestbg.svg'],
]);

const rows = parseCsv(readFileSync(RAW_PATH, 'utf8')).map((row) => ({
  ...row,
  year: Number(row.year),
  value: Number(row.value),
}));

for (const row of rows) {
  for (const header of rawHeaders) {
    if (!(header in row)) {
      throw new Error(`Missing ${header} in ${RAW_PATH}`);
    }
  }
}

const peakRows = buildPeakRows(rows);
const top10Rows = buildTop10Rows(peakRows);

writeFileSync(PEAK_PATH, stringifyCsv(peakRows, rawHeaders));
writeFileSync(TOP10_PATH, stringifyCsv(top10Rows, topHeaders));
writeFileSync(ALL_TIME_PATH, stringifyCsv(buildAllTimeRows(peakRows), topHeaders));
writeFileSync(
  ALL_TIME_NO_ROBLOX_PATH,
  stringifyCsv(buildAllTimeRows(peakRows.filter(isVideoCandidate)), topHeaders),
);
writeFileSync(COVERAGE_PATH, stringifyCsv(buildCoverageRows(peakRows, top10Rows), [
  'year',
  'candidate_count',
  'top_rows',
  'coverage_status',
  'notes',
]));
writeFileSync(GENERATED_PATH, buildGeneratedTs(top10Rows));

function buildPeakRows(inputRows) {
  const byYearAndCode = new Map();

  for (const row of inputRows) {
    const key = `${row.year}:${row.code}`;
    const existing = byYearAndCode.get(key);

    if (!existing || row.value > existing.value || (
      row.value === existing.value && row.date > existing.date
    )) {
      byYearAndCode.set(key, row);
    }
  }

  return [...byYearAndCode.values()].sort(compareYearThenRank);
}

function buildTop10Rows(inputRows) {
  const byYear = groupBy(inputRows.filter(isVideoCandidate), (row) => row.year);
  const ranked = [];

  for (const [year, yearRows] of [...byYear.entries()].sort(([a], [b]) => a - b)) {
    yearRows.sort(compareRank);
    ranked.push(...yearRows.slice(0, 10).map((row, index) => ({
      year,
      rank: index + 1,
      date: row.date,
      name: row.name,
      code: row.code,
      region: row.region,
      value: row.value,
      color: row.color,
      platform_scope: row.platform_scope,
      metric_context: row.metric_context,
      source_type: row.source_type,
      confidence: row.confidence,
      source_url: row.source_url,
      notes: row.notes,
    })));
  }

  return ranked;
}

function buildAllTimeRows(inputRows) {
  return [...inputRows]
    .filter(
      (row) =>
        row.source_type !== 'latest_disclosed_benchmark' &&
        row.source_type !== 'estimated_min_peak_ccu' &&
        row.source_type !== 'estimated_mid_peak_ccu',
    )
    .sort(compareRank)
    .slice(0, 10)
    .map((row, index) => ({
      year: row.year,
      rank: index + 1,
      date: row.date,
      name: row.name,
      code: row.code,
      region: row.region,
      value: row.value,
      color: row.color,
      platform_scope: row.platform_scope,
      metric_context: row.metric_context,
      source_type: row.source_type,
      confidence: row.confidence,
      source_url: row.source_url,
      notes: row.notes,
    }));
}

function buildCoverageRows(inputRows, topRows) {
  const allYears = [...new Set(inputRows.map((row) => row.year))].sort((a, b) => a - b);
  const topCountByYear = groupBy(topRows, (row) => row.year);

  return allYears.map((year) => {
    const candidateCount = inputRows.filter((row) => row.year === year).length;
    const topRowsForYear = topCountByYear.get(year)?.length ?? 0;
    const isEarlySparse = year < 2012;

    return {
      year,
      candidate_count: candidateCount,
      top_rows: topRowsForYear,
      coverage_status: topRowsForYear >= 10 ? 'top10_filled' : 'early_public_records_only',
      notes: isEarlySparse
        ? 'Sparse pre-SteamCharts era; only public CCU records found'
        : 'Roblox experience rows excluded from video Top 10; platform-wide Roblox row used only when sourced; LoL estimates are marked in source_type',
    };
  });
}

function buildGeneratedTs(topRows) {
  const generatedRows = topRows.map((row) => ({
    date: `${row.year}-12-01`,
    year: row.year,
    month: 12,
    rank: row.rank,
    name: row.name,
    code: row.code,
    region: row.region,
    value: row.value,
    color: row.color,
    imageUrl: imageUrlForCode(row.code),
    platformScope: row.platform_scope,
    metricContext: row.metric_context,
    sourceType: row.source_type,
    confidence: row.confidence,
    sourceUrl: row.source_url,
    observationDate: row.date,
    notes: row.notes,
  }));

  return `export const onlineGameConcurrencyTop10Csv = \`\n${stringifyCsv(generatedRows, generatedHeaders).trimEnd()}\n\`;\n`;
}

function imageUrlForCode(code) {
  const explicit = explicitProfileByCode.get(code);
  const explicitJpg = explicit?.replace(/\.svg$/i, '.jpg');
  const explicitPng = explicit?.replace(/\.svg$/i, '.png');
  const base = code.toLowerCase();
  const candidates = [
    explicitJpg,
    explicitPng,
    explicit,
    `${base}.jpg`,
    `${base}.png`,
    `${base}.svg`,
  ].filter(Boolean);
  const fileName = candidates.find((candidate) =>
    existsSync(join(PROFILE_DIR, candidate)),
  );

  return fileName ? `projects/online-game-concurrency/profiles/${fileName}` : '';
}

function isVideoCandidate(row) {
  return row.platform_scope !== 'Roblox experience';
}

function compareYearThenRank(a, b) {
  return a.year - b.year || compareRank(a, b);
}

function compareRank(a, b) {
  return b.value - a.value || String(a.name).localeCompare(String(b.name));
}

function groupBy(inputRows, keyForRow) {
  const grouped = new Map();

  for (const row of inputRows) {
    const key = keyForRow(row);
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  return grouped;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());

  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(value);
      value = '';
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
}

function stringifyCsv(inputRows, headers) {
  const lines = [headers.join(',')];

  for (const row of inputRows) {
    lines.push(headers.map((header) => serializeCsvValue(row[header])).join(','));
  }

  return `${lines.join('\n')}\n`;
}

function serializeCsvValue(value) {
  const text = String(value ?? '');

  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}
