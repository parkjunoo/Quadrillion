import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('data/world-cup-standings');
const CSV_FILE = path.join(DATA_DIR, 'world_cup_top16_standings.csv');
const META_FILE = path.join(DATA_DIR, 'world_cup_top16_standings.meta.json');
const USER_AGENT = 'QuadrillionDataBot/0.1 (+https://github.com/openai/codex)';

const tournaments = [
  { year: 1930, host: 'Uruguay', page: '1930_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1934, host: 'Italy', page: '1934_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1938, host: 'France', page: '1938_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1950, host: 'Brazil', page: '1950_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1954, host: 'Switzerland', page: '1954_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1958, host: 'Sweden', page: '1958_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1962, host: 'Chile', page: '1962_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1966, host: 'England', page: '1966_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1970, host: 'Mexico', page: '1970_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1974, host: 'West Germany', page: '1974_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1978, host: 'Argentina', page: '1978_FIFA_World_Cup', headingId: 'FIFA_retrospective_ranking' },
  { year: 1982, host: 'Spain', page: '1982_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 1986, host: 'Mexico', page: '1986_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 1990, host: 'Italy', page: '1990_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 1994, host: 'United States', page: '1994_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 1998, host: 'France', page: '1998_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 2002, host: 'South Korea / Japan', page: '2002_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 2006, host: 'Germany', page: '2006_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 2010, host: 'South Africa', page: '2010_FIFA_World_Cup', headingId: 'Final_standings' },
  { year: 2014, host: 'Brazil', page: '2014_FIFA_World_Cup', headingId: 'Final_standings' },
];

const manualTop16 = [
  {
    year: 2018,
    host: 'Russia',
    page: '2018_FIFA_World_Cup',
    rows: [
      row(1, 'France', 'FRA', 'C', 7, 6, 1, 0, 14, 6, 19),
      row(2, 'Croatia', 'CRO', 'D', 7, 4, 2, 1, 14, 9, 14),
      row(3, 'Belgium', 'BEL', 'G', 7, 6, 0, 1, 16, 6, 18),
      row(4, 'England', 'ENG', 'G', 7, 3, 1, 3, 12, 8, 10),
      row(5, 'Uruguay', 'URU', 'A', 5, 4, 0, 1, 7, 3, 12),
      row(6, 'Brazil', 'BRA', 'E', 5, 3, 1, 1, 8, 3, 10),
      row(7, 'Sweden', 'SWE', 'F', 5, 3, 0, 2, 6, 4, 9),
      row(8, 'Russia', 'RUS', 'A', 5, 2, 2, 1, 11, 7, 8),
      row(9, 'Colombia', 'COL', 'H', 4, 2, 1, 1, 6, 3, 7),
      row(10, 'Spain', 'ESP', 'B', 4, 1, 3, 0, 7, 6, 6),
      row(11, 'Denmark', 'DEN', 'C', 4, 1, 3, 0, 3, 2, 6),
      row(12, 'Mexico', 'MEX', 'F', 4, 2, 0, 2, 3, 6, 6),
      row(13, 'Portugal', 'POR', 'B', 4, 1, 2, 1, 6, 6, 5),
      row(14, 'Switzerland', 'SUI', 'E', 4, 1, 2, 1, 5, 5, 5),
      row(15, 'Japan', 'JPN', 'H', 4, 1, 1, 2, 6, 7, 4),
      row(16, 'Argentina', 'ARG', 'D', 4, 1, 1, 2, 6, 9, 4),
    ],
  },
  {
    year: 2022,
    host: 'Qatar',
    page: '2022_FIFA_World_Cup',
    rows: [
      row(1, 'Argentina', 'ARG', 'C', 7, 4, 2, 1, 15, 8, 14),
      row(2, 'France', 'FRA', 'D', 7, 5, 1, 1, 16, 8, 16),
      row(3, 'Croatia', 'CRO', 'F', 7, 2, 4, 1, 8, 7, 10),
      row(4, 'Morocco', 'MAR', 'F', 7, 3, 2, 2, 6, 5, 11),
      row(5, 'Netherlands', 'NED', 'A', 5, 3, 2, 0, 10, 4, 11),
      row(6, 'England', 'ENG', 'B', 5, 3, 1, 1, 13, 4, 10),
      row(7, 'Brazil', 'BRA', 'G', 5, 3, 1, 1, 8, 3, 10),
      row(8, 'Portugal', 'POR', 'H', 5, 3, 0, 2, 12, 6, 9),
      row(9, 'Japan', 'JPN', 'E', 4, 2, 1, 1, 5, 4, 7),
      row(10, 'Senegal', 'SEN', 'A', 4, 2, 0, 2, 5, 7, 6),
      row(11, 'Australia', 'AUS', 'D', 4, 2, 0, 2, 4, 6, 6),
      row(12, 'Switzerland', 'SUI', 'G', 4, 2, 0, 2, 5, 9, 6),
      row(13, 'Spain', 'ESP', 'E', 4, 1, 2, 1, 9, 3, 5),
      row(14, 'United States', 'USA', 'B', 4, 1, 2, 1, 3, 4, 5),
      row(15, 'Poland', 'POL', 'C', 4, 1, 1, 2, 3, 5, 4),
      row(16, 'South Korea', 'KOR', 'H', 4, 1, 1, 2, 5, 8, 4),
    ],
  },
];

const countryCodes = new Map([
  ['Algeria', 'ALG'],
  ['Angola', 'ANG'],
  ['Argentina', 'ARG'],
  ['Australia', 'AUS'],
  ['Austria', 'AUT'],
  ['Belgium', 'BEL'],
  ['Bolivia', 'BOL'],
  ['Bosnia and Herzegovina', 'BIH'],
  ['Brazil', 'BRA'],
  ['Bulgaria', 'BUL'],
  ['Cameroon', 'CMR'],
  ['Canada', 'CAN'],
  ['Chile', 'CHI'],
  ['China', 'CHN'],
  ['Colombia', 'COL'],
  ['Costa Rica', 'CRC'],
  ['Czech Republic', 'CZE'],
  ['Croatia', 'CRO'],
  ['Cuba', 'CUB'],
  ['Czechoslovakia', 'TCH'],
  ['Denmark', 'DEN'],
  ['Dutch East Indies', 'INH'],
  ['East Germany', 'GDR'],
  ['Ecuador', 'ECU'],
  ['Egypt', 'EGY'],
  ['El Salvador', 'SLV'],
  ['England', 'ENG'],
  ['France', 'FRA'],
  ['FR Yugoslavia', 'YUG'],
  ['Germany', 'GER'],
  ['Ghana', 'GHA'],
  ['Greece', 'GRE'],
  ['Haiti', 'HAI'],
  ['Honduras', 'HON'],
  ['Hungary', 'HUN'],
  ['Iran', 'IRN'],
  ['Iraq', 'IRQ'],
  ['Iceland', 'ISL'],
  ['Israel', 'ISR'],
  ['Italy', 'ITA'],
  ['Ivory Coast', 'CIV'],
  ['Japan', 'JPN'],
  ['Jamaica', 'JAM'],
  ['Kuwait', 'KUW'],
  ['Mexico', 'MEX'],
  ['Morocco', 'MAR'],
  ['Netherlands', 'NED'],
  ['New Zealand', 'NZL'],
  ['Nigeria', 'NGA'],
  ['North Korea', 'PRK'],
  ['Northern Ireland', 'NIR'],
  ['Norway', 'NOR'],
  ['Paraguay', 'PAR'],
  ['Panama', 'PAN'],
  ['Peru', 'PER'],
  ['Poland', 'POL'],
  ['Portugal', 'POR'],
  ['Republic of Ireland', 'IRL'],
  ['Romania', 'ROU'],
  ['Russia', 'RUS'],
  ['Saudi Arabia', 'KSA'],
  ['Scotland', 'SCO'],
  ['Senegal', 'SEN'],
  ['Serbia', 'SRB'],
  ['Serbia and Montenegro', 'SCG'],
  ['Slovakia', 'SVK'],
  ['Slovenia', 'SVN'],
  ['South Africa', 'RSA'],
  ['South Korea', 'KOR'],
  ['Soviet Union', 'URS'],
  ['Spain', 'ESP'],
  ['Sweden', 'SWE'],
  ['Switzerland', 'SUI'],
  ['Tunisia', 'TUN'],
  ['Turkey', 'TUR'],
  ['Togo', 'TOG'],
  ['Trinidad and Tobago', 'TRI'],
  ['United Arab Emirates', 'UAE'],
  ['Ukraine', 'UKR'],
  ['United States', 'USA'],
  ['Uruguay', 'URU'],
  ['Wales', 'WAL'],
  ['West Germany', 'FRG'],
  ['Yugoslavia', 'YUG'],
  ['Zaire', 'ZAI'],
]);

const headers = [
  'year',
  'host',
  'final_rank',
  'team',
  'team_code',
  'stage',
  'group',
  'played',
  'won',
  'drawn',
  'lost',
  'goals_for',
  'goals_against',
  'goal_difference',
  'points',
  'source_type',
  'source_url',
  'source_section',
];

await mkdir(DATA_DIR, { recursive: true });

const fetchedRows = [];
const fetchReports = [];

for (const tournament of tournaments) {
  const sourceUrl = pageUrl(tournament.page);
  const html = await fetchHtml(sourceUrl);
  const parsedRows = parseStandingsRows(html, tournament)
    .filter((parsedRow) => parsedRow.final_rank <= 16)
    .map((parsedRow) => ({
      ...parsedRow,
      source_type: tournament.headingId === 'FIFA_retrospective_ranking'
        ? 'wikipedia_fifa_retrospective_ranking'
        : 'wikipedia_final_standings',
      source_url: sourceUrl,
      source_section: tournament.headingId,
    }));

  fetchedRows.push(...parsedRows);
  fetchReports.push({
    year: tournament.year,
    rowCount: parsedRows.length,
    sourceUrl,
    sourceSection: tournament.headingId,
  });
}

for (const tournament of manualTop16) {
  const sourceUrl = pageUrl(tournament.page);

  fetchedRows.push(
    ...tournament.rows.map((manualRow) => ({
      ...manualRow,
      host: tournament.host,
      stage: stageForRank(tournament.year, manualRow.final_rank),
      source_type: 'manual_from_match_results_fifa_penalty_draw_convention',
      source_url: sourceUrl,
      source_section: 'match_results_and_knockout_stage',
      year: tournament.year,
    })),
  );
  fetchReports.push({
    year: tournament.year,
    rowCount: tournament.rows.length,
    sourceUrl,
    sourceSection: 'manual_top16',
  });
}

const rows = fetchedRows
  .map((standingRow) => ({
    ...standingRow,
    goal_difference: standingRow.goals_for - standingRow.goals_against,
  }))
  .sort((rowA, rowB) => rowA.year - rowB.year || rowA.final_rank - rowB.final_rank);

const validation = validateRows(rows);

await writeFile(CSV_FILE, toCsv(rows, headers), 'utf8');
await writeFile(
  META_FILE,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    scope:
      'FIFA men World Cup final standings top 16 for every completed tournament from 1930 through 2022. For tournaments with fewer than 16 entrants, all ranked teams are included.',
    rowCount: rows.length,
    tournaments: fetchReports,
    validation,
    sources: [
      'Wikipedia tournament pages, using FIFA retrospective ranking sections for 1930-1978 and final standings sections for 1982-2014.',
      '2018 and 2022 top 16 rows are explicitly encoded from match results with FIFA/Wikipedia penalty shoot-out convention: shoot-outs count as draws for both teams.',
    ],
    output: CSV_FILE,
  }, null, 2)}\n`,
  'utf8',
);

console.log(`Wrote ${rows.length} rows to ${CSV_FILE}`);
console.log(`Wrote metadata to ${META_FILE}`);
for (const report of fetchReports) {
  console.log(`${report.year}: ${report.rowCount} rows (${report.sourceSection})`);
}

function row(finalRank, team, teamCode, group, played, won, drawn, lost, goalsFor, goalsAgainst, points) {
  return {
    final_rank: finalRank,
    team,
    team_code: teamCode,
    group,
    played,
    won,
    drawn,
    lost,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_difference: goalsFor - goalsAgainst,
    points,
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseStandingsRows(html, tournament) {
  const section = extractSection(html, tournament.headingId);
  const tables = extractTopLevelTables(section);
  const table = tables.find((candidate) => tableLooksLikeStandings(candidate));

  if (!table) {
    throw new Error(`Could not locate standings table for ${tournament.year}`);
  }

  const parsedRows = parseTableRows(table, tournament);

  if (parsedRows.length < 13) {
    throw new Error(`Parsed only ${parsedRows.length} rows for ${tournament.year}`);
  }

  return parsedRows;
}

function extractSection(html, headingId) {
  const headingIndex = html.indexOf(`id="${headingId}"`);

  if (headingIndex === -1) {
    throw new Error(`Could not locate heading ${headingId}`);
  }

  const sectionStart = html.lastIndexOf('<div class="mw-heading', headingIndex);
  const nextHeadingIndex = html.indexOf('<div class="mw-heading mw-heading2"', headingIndex + headingId.length);
  const sectionEnd = nextHeadingIndex === -1 ? html.length : nextHeadingIndex;

  return html.slice(sectionStart, sectionEnd);
}

function extractTopLevelTables(html) {
  const tables = [];
  let index = 0;

  while (index < html.length) {
    const tableStart = html.indexOf('<table', index);

    if (tableStart === -1) {
      break;
    }

    let searchIndex = tableStart + 6;
    let depth = 1;

    while (depth > 0 && searchIndex < html.length) {
      const nextOpen = html.indexOf('<table', searchIndex);
      const nextClose = html.indexOf('</table>', searchIndex);

      if (nextClose === -1) {
        throw new Error('Malformed HTML table: missing closing tag');
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        searchIndex = nextOpen + 6;
      } else {
        depth -= 1;
        searchIndex = nextClose + '</table>'.length;
      }
    }

    tables.push(html.slice(tableStart, searchIndex));
    index = searchIndex;
  }

  return tables;
}

function tableLooksLikeStandings(tableHtml) {
  const rows = extractRows(tableHtml);
  const headerCells = rows
    .map((rowHtml) => extractCells(rowHtml).map((cell) => cleanCellText(cell.html)))
    .find((cells) => cells.some((cell) => /^team$/i.test(cell)) && cells.some((cell) => /^(r|pos|position)$/i.test(cell)));

  return Boolean(headerCells);
}

function parseTableRows(tableHtml, tournament) {
  const rows = extractRows(tableHtml);
  let header = [];
  let currentStage = '';
  let previousRank = 0;
  const standingsRows = [];

  for (const rowHtml of rows) {
    const cells = extractCells(rowHtml);

    if (cells.length === 0) {
      continue;
    }

    const texts = cells.map((cell) => cleanCellText(cell.html));

    if (texts.some((text) => /^team$/i.test(text)) && texts.some((text) => /^(r|pos|position)$/i.test(text))) {
      header = texts.map(normalizeHeader);
      continue;
    }

    if (texts.length === 1 && /eliminated|round|final|group/i.test(texts[0])) {
      currentStage = normalizeStageLabel(texts[0]);
      continue;
    }

    if (header.length === 0) {
      continue;
    }

    const rankIndex = header.findIndex((cell) => cell === 'rank');
    const teamIndex = header.findIndex((cell) => cell === 'team');
    let finalRank = Number.parseInt(texts[rankIndex], 10);
    let effectiveHeader = header;
    let effectiveTexts = texts;
    let effectiveCells = cells;

    if (!Number.isFinite(finalRank)) {
      const shiftedTexts = insertAt(texts, rankIndex, String(previousRank + 1));
      const shiftedCells = insertAt(cells, rankIndex, { tag: 'td', html: String(previousRank + 1) });
      const shiftedRank = Number.parseInt(shiftedTexts[rankIndex], 10);

      if (!Number.isFinite(shiftedRank)) {
        continue;
      }

      finalRank = shiftedRank;
      effectiveHeader = header;
      effectiveTexts = shiftedTexts;
      effectiveCells = shiftedCells;
    }

    previousRank = finalRank;

    const team = cleanTeamName(effectiveCells[teamIndex]?.html ?? effectiveTexts[teamIndex] ?? '');

    if (!team) {
      continue;
    }
    const parsedRow = {
      year: tournament.year,
      host: tournament.host,
      final_rank: finalRank,
      team,
      team_code: teamCode(team),
      stage: stageForRank(tournament.year, finalRank, currentStage),
      group: valueAtHeader(effectiveTexts, effectiveHeader, 'group'),
      played: numberAtHeader(effectiveTexts, effectiveHeader, 'played'),
      won: numberAtHeader(effectiveTexts, effectiveHeader, 'won'),
      drawn: numberAtHeader(effectiveTexts, effectiveHeader, 'drawn'),
      lost: numberAtHeader(effectiveTexts, effectiveHeader, 'lost'),
      goals_for: numberAtHeader(effectiveTexts, effectiveHeader, 'goals_for'),
      goals_against: numberAtHeader(effectiveTexts, effectiveHeader, 'goals_against'),
      goal_difference: numberAtHeader(effectiveTexts, effectiveHeader, 'goal_difference'),
      points: numberAtHeader(effectiveTexts, effectiveHeader, 'points'),
    };

    standingsRows.push(parsedRow);
  }

  return standingsRows;
}

function insertAt(items, index, item) {
  return [
    ...items.slice(0, index),
    item,
    ...items.slice(index),
  ];
}

function extractRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
}

function extractCells(rowHtml) {
  return [...rowHtml.matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => ({
    tag: match[1].toLowerCase(),
    html: match[2],
  }));
}

function cleanTeamName(cellHtml) {
  const withoutRefs = cellHtml.replace(/<sup\b[\s\S]*?<\/sup>/gi, '');
  const linkMatches = [...withoutRefs.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => cleanCellText(match[1]))
    .filter((text) => text && !/^\d+$/.test(text) && !/^Group /.test(text));
  const linkTeam = linkMatches.find((text) => countryCodes.has(normalizeTeamName(text)));

  if (linkTeam) {
    return normalizeTeamName(linkTeam);
  }

  return normalizeTeamName(cleanCellText(withoutRefs));
}

function normalizeTeamName(team) {
  return team
    .replace(/\[[^\]]+]/g, '')
    .replace(/\([^)]*title\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^Korea Republic$/, 'South Korea')
    .replace(/^Republic of Korea$/, 'South Korea')
    .replace(/^United States of America$/, 'United States')
    .replace(/^Czech Republic$/, 'Czechoslovakia');
}

function cleanCellText(cellHtml) {
  return decodeHtml(
    cellHtml
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<sup\b[\s\S]*?<\/sup>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function decodeHtml(text) {
  return text
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeHeader(headerCell) {
  const normalized = headerCell.toLowerCase().replace(/[.\s]/g, '');

  if (['r', 'pos', 'position'].includes(normalized)) {
    return 'rank';
  }

  if (normalized === 'team') {
    return 'team';
  }

  if (['g', 'grp', 'group'].includes(normalized)) {
    return 'group';
  }

  if (['p', 'pld', 'played'].includes(normalized)) {
    return 'played';
  }

  if (['w', 'won', 'win'].includes(normalized)) {
    return 'won';
  }

  if (['d', 'draw', 'drawn'].includes(normalized)) {
    return 'drawn';
  }

  if (['l', 'lost', 'lose'].includes(normalized)) {
    return 'lost';
  }

  if (['gf', 'goalsfor'].includes(normalized)) {
    return 'goals_for';
  }

  if (['ga', 'goalsagainst'].includes(normalized)) {
    return 'goals_against';
  }

  if (['gd', 'goaldifference'].includes(normalized)) {
    return 'goal_difference';
  }

  if (['pts', 'points'].includes(normalized)) {
    return 'points';
  }

  return normalized;
}

function normalizeStageLabel(label) {
  return label
    .toLowerCase()
    .replace(/^eliminated in the /, '')
    .replace(/^eliminated in /, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function stageForRank(year, rank, parsedStage = '') {
  if (rank === 1) {
    return 'champion';
  }

  if (rank === 2) {
    return 'runner_up';
  }

  if (rank === 3) {
    return 'third_place';
  }

  if (rank === 4) {
    return 'fourth_place';
  }

  if (parsedStage) {
    return parsedStage;
  }

  if ([1934, 1938].includes(year)) {
    return rank <= 8 ? 'quarter_finals' : 'round_of_16';
  }

  if ([1954, 1958, 1962, 1966, 1970].includes(year)) {
    return rank <= 8 ? 'quarter_finals' : 'group_stage';
  }

  if ([1974, 1978].includes(year)) {
    return rank <= 8 ? 'second_group_stage' : 'first_group_stage';
  }

  if (year === 1982) {
    return rank <= 12 ? 'second_group_stage' : 'first_group_stage';
  }

  if (year >= 1986) {
    return rank <= 8 ? 'quarter_finals' : 'round_of_16';
  }

  return 'group_stage';
}

function teamCode(team) {
  const code = countryCodes.get(team);

  if (!code) {
    throw new Error(`Missing team code for "${team}"`);
  }

  return code;
}

function valueAtHeader(texts, header, field) {
  const index = header.findIndex((cell) => cell === field);

  return index === -1 ? '' : (texts[index] ?? '');
}

function numberAtHeader(texts, header, field) {
  const rawValue = String(valueAtHeader(texts, header, field))
    .replace(/[−–—]/g, '-')
    .replace(/[^\d+-.]/g, '');
  const value = Number(rawValue);

  return Number.isFinite(value) ? value : 0;
}

function pageUrl(page) {
  return `https://en.wikipedia.org/wiki/${page}`;
}

function validateRows(rows) {
  const byYear = new Map();

  for (const standingRow of rows) {
    const yearRows = byYear.get(standingRow.year) ?? [];
    yearRows.push(standingRow);
    byYear.set(standingRow.year, yearRows);
  }

  return [...byYear.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, yearRows]) => ({
      year,
      rowCount: yearRows.length,
      minRank: Math.min(...yearRows.map((row) => row.final_rank)),
      maxRank: Math.max(...yearRows.map((row) => row.final_rank)),
      teams: yearRows.map((row) => row.team),
    }));
}

function toCsv(rows, fields) {
  return `${fields.join(',')}\n${rows.map((csvRow) =>
    fields.map((field) => csvEscape(csvRow[field])).join(',')
  ).join('\n')}\n`;
}

function csvEscape(value) {
  const stringValue = String(value ?? '');

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
