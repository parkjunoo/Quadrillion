import { mkdir, writeFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';

const DATA_DIR = path.resolve('data/world-cup-squads');
const SQUADS_CSV_FILE = path.join(DATA_DIR, 'world_cup_squads.csv');
const SUMMARY_CSV_FILE = path.join(DATA_DIR, 'world_cup_squad_country_summary.csv');
const META_FILE = path.join(DATA_DIR, 'world_cup_squads.meta.json');
const BASE_URL = 'https://en.wikipedia.org/wiki';
const DEFAULT_YEARS = [
  1930,
  1934,
  1938,
  1950,
  1954,
  1958,
  1962,
  1966,
  1970,
  1974,
  1978,
  1982,
  1986,
  1990,
  1994,
  1998,
  2002,
  2006,
  2010,
  2014,
  2018,
  2022,
  2026,
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const yearsArg = args.find((arg) => arg.startsWith('--years='));
  const years = yearsArg
    ? yearsArg
        .replace('--years=', '')
        .split(',')
        .map((year) => Number(year.trim()))
        .filter((year) => Number.isInteger(year))
    : [...DEFAULT_YEARS];

  if (args.includes('--include-2026') && !years.includes(2026)) {
    years.push(2026);
  }

  return {
    years: years.sort((yearA, yearB) => yearA - yearB),
  };
};

const main = async () => {
  const { years } = parseArgs();
  await mkdir(DATA_DIR, { recursive: true });

  const pages = [];
  const allPlayerRows = [];
  const allSummaryRows = [];

  for (const year of years) {
    const sourceUrl = `${BASE_URL}/${year}_FIFA_World_Cup_squads`;
    const html = await requestText(sourceUrl);
    const parsed = parseSquadPage({ html, sourceUrl, year });

    pages.push({
      countryCount: parsed.summaryRows.length,
      playerCount: parsed.playerRows.length,
      sourceUrl,
      year,
    });
    allPlayerRows.push(...parsed.playerRows);
    allSummaryRows.push(...parsed.summaryRows);

    console.log(
      `${year}: ${parsed.summaryRows.length} teams, ${parsed.playerRows.length} players`,
    );
  }

  await writeCsv(SQUADS_CSV_FILE, allPlayerRows, [
    'year',
    'tournament',
    'group',
    'country',
    'team_order',
    'coach',
    'player_order',
    'shirt_number',
    'position',
    'player_name',
    'player_url',
    'is_captain',
    'birth_date',
    'age',
    'caps',
    'goals',
    'club',
    'club_url',
    'source_url',
  ]);
  await writeCsv(SUMMARY_CSV_FILE, allSummaryRows, [
    'year',
    'tournament',
    'group',
    'country',
    'team_order',
    'coach',
    'player_count',
    'goalkeepers',
    'defenders',
    'midfielders',
    'forwards',
    'unknown_positions',
    'source_url',
  ]);
  await writeFile(
    META_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: {
          label: 'Wikipedia FIFA World Cup squads pages',
          pagePattern: `${BASE_URL}/{year}_FIFA_World_Cup_squads`,
          note:
            'The linked Wikipedia pages cite FIFA and federation squad sources, but public renders should still verify the source, roster rules, and late replacement handling for the chosen tournament years.',
        },
        outputFiles: [
          path.relative(process.cwd(), SQUADS_CSV_FILE),
          path.relative(process.cwd(), SUMMARY_CSV_FILE),
        ],
        years,
        rowCount: allPlayerRows.length,
        countryCount: allSummaryRows.length,
        pages,
        method:
          'Downloads each men FIFA World Cup squad page, parses national-team sections with nat-fs-player tables, and writes one row per listed player plus one country summary row.',
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${allPlayerRows.length} player rows to ${SQUADS_CSV_FILE}`);
  console.log(`Wrote ${allSummaryRows.length} country rows to ${SUMMARY_CSV_FILE}`);
};

const parseSquadPage = ({ html, sourceUrl, year }) => {
  const headings = extractHeadings(html);
  const playerRows = [];
  const summaryRows = [];
  let teamOrder = 0;

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const title = stripHtml(heading.titleHtml);

    if (![2, 3].includes(heading.level) || /^Group\b/i.test(title)) {
      continue;
    }

    const nextHeading = headings
      .slice(index + 1)
      .find((candidate) => candidate.level <= heading.level);
    const sectionHtml = html.slice(heading.endIndex, nextHeading?.startIndex ?? html.length);
    const tableHtml = extractPlayerTable(sectionHtml);

    if (!tableHtml) {
      continue;
    }

    teamOrder += 1;

    const group = findPreviousGroup(headings, index);
    const country = title;
    const coach = extractCoach(sectionHtml);
    const rows = parsePlayerTable(tableHtml).map((player, playerIndex) => ({
      year,
      tournament: `${year} FIFA World Cup`,
      group,
      country,
      team_order: teamOrder,
      coach,
      player_order: playerIndex + 1,
      ...player,
      source_url: sourceUrl,
    }));

    playerRows.push(...rows);
    summaryRows.push(buildSummaryRow({
      coach,
      country,
      group,
      rows,
      sourceUrl,
      teamOrder,
      year,
    }));
  }

  return {
    playerRows,
    summaryRows,
  };
};

const extractHeadings = (html) => {
  const headings = [];
  const headingPattern =
    /<div class="mw-heading mw-heading([23])"><h([23])[^>]*>([\s\S]*?)<\/h\2>[\s\S]*?<\/div>/g;
  let match;

  while ((match = headingPattern.exec(html))) {
    headings.push({
      endIndex: headingPattern.lastIndex,
      level: Number(match[1]),
      startIndex: match.index,
      titleHtml: match[3],
    });
  }

  return headings;
};

const findPreviousGroup = (headings, headingIndex) => {
  if (headings[headingIndex]?.level === 2) {
    return '';
  }

  for (let index = headingIndex - 1; index >= 0; index -= 1) {
    if (headings[index].level === 2) {
      const title = stripHtml(headings[index].titleHtml);
      return /^Group\b/i.test(title) ? title : '';
    }
  }

  return '';
};

const extractPlayerTable = (sectionHtml) => {
  const tableMatch = sectionHtml.match(/<table[^>]*>[\s\S]*?nat-fs-player[\s\S]*?<\/table>/);
  return tableMatch?.[0] ?? '';
};

const extractCoach = (sectionHtml) => {
  const beforeTable = sectionHtml.split(/<table/i)[0] ?? '';
  const coachMatch = beforeTable.match(
    /(?:Head coach(?:es)?|Coach(?:es)?|Manager)(?:\s|&nbsp;|&#160;)*:\s*([\s\S]*?)(?:<\/p>|<br\s*\/?>)/i,
  );

  if (!coachMatch) {
    return '';
  }

  return stripHtml(coachMatch[1]).replace(/\s+and\s+/g, ' and ');
};

const parsePlayerTable = (tableHtml) => {
  const headerRow = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/)?.[1] ?? '';
  const headers = extractCells(headerRow).map((cell) => normalizeHeader(cell.text));
  const playerRows = [...tableHtml.matchAll(/<tr[^>]*class="[^"]*\bnat-fs-player\b[^"]*"[^>]*>([\s\S]*?)<\/tr>/g)];

  return playerRows.map((rowMatch) => {
    const cells = extractCells(rowMatch[1]);
    const fieldCells = new Map();

    for (let index = 0; index < cells.length; index += 1) {
      const header = headers[index] ?? `column_${index}`;

      if (header) {
        fieldCells.set(header, cells[index]);
      }
    }

    const playerCell = fieldCells.get('player') ?? cells.find((cell) => cell.tag === 'th') ?? cells[2];
    const clubCell = fieldCells.get('club');
    const playerLink = extractMainLink(playerCell?.html ?? '');
    const clubLink = extractLastLink(clubCell?.html ?? '');
    const playerName = cleanPlayerName(playerCell?.text ?? '');

    return {
      shirt_number: normalizeInteger(fieldCells.get('number')?.text ?? ''),
      position: normalizePosition(fieldCells.get('position')?.text ?? ''),
      player_name: playerName,
      player_url: playerLink.href,
      is_captain: isCaptain(playerCell?.html ?? '', playerCell?.text ?? ''),
      birth_date: extractBirthDate(fieldCells.get('birth_date')?.html ?? ''),
      age: extractAge(fieldCells.get('birth_date')?.text ?? ''),
      caps: normalizeInteger(fieldCells.get('caps')?.text ?? ''),
      goals: normalizeInteger(fieldCells.get('goals')?.text ?? ''),
      club: cleanClubName(clubCell?.text ?? ''),
      club_url: clubLink.href,
    };
  });
};

const extractCells = (rowHtml) => {
  const cells = [];
  const cellPattern = /<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = cellPattern.exec(rowHtml))) {
    cells.push({
      html: match[2],
      tag: match[1],
      text: stripHtml(match[2]),
    });
  }

  return cells;
};

const normalizeHeader = (headerText) => {
  const normalized = headerText
    .toLowerCase()
    .replace(/\(.+?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  if (normalized === 'no' || normalized === 'number') {
    return 'number';
  }

  if (normalized === 'pos' || normalized === 'position') {
    return 'position';
  }

  if (normalized === 'player' || normalized === 'name') {
    return 'player';
  }

  if (normalized === 'date of birth' || normalized === 'dob') {
    return 'birth_date';
  }

  if (normalized === 'caps' || normalized === 'cap') {
    return 'caps';
  }

  if (normalized === 'goals' || normalized === 'goal') {
    return 'goals';
  }

  if (normalized === 'club' || normalized === 'club team') {
    return 'club';
  }

  return normalized.replace(/\s+/g, '_');
};

const buildSummaryRow = ({ coach, country, group, rows, sourceUrl, teamOrder, year }) => {
  const positionCounts = rows.reduce(
    (counts, row) => {
      if (row.position === 'GK') {
        counts.goalkeepers += 1;
      } else if (row.position === 'DF') {
        counts.defenders += 1;
      } else if (row.position === 'MF') {
        counts.midfielders += 1;
      } else if (row.position === 'FW') {
        counts.forwards += 1;
      } else {
        counts.unknown_positions += 1;
      }

      return counts;
    },
    {
      defenders: 0,
      forwards: 0,
      goalkeepers: 0,
      midfielders: 0,
      unknown_positions: 0,
    },
  );

  return {
    year,
    tournament: `${year} FIFA World Cup`,
    group,
    country,
    team_order: teamOrder,
    coach,
    player_count: rows.length,
    ...positionCounts,
    source_url: sourceUrl,
  };
};

const stripHtml = (html) =>
  decodeHtml(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<sup\b[\s\S]*?<\/sup>/gi, '')
      .replace(/<span[^>]*style="[^"]*display\s*:\s*none[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

const decodeHtml = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-');

const cleanPlayerName = (text) =>
  text
    .replace(/\s*\(\s*(?:captain|c|vice-captain|vc)\s*\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanClubName = (text) =>
  text
    .replace(/\s+/g, ' ')
    .trim();

const isCaptain = (html, text) =>
  /\b(captain|capt\.)\b|>\s*c\s*<|\(\s*c\s*\)/i.test(`${html} ${text}`);

const normalizePosition = (text) => {
  const normalized = text.trim().toUpperCase();

  if (normalized.includes('GK') || normalized.includes('GOALKEEPER')) {
    return 'GK';
  }

  if (normalized.includes('DF') || normalized.includes('DEFENDER')) {
    return 'DF';
  }

  if (normalized.includes('MF') || normalized.includes('MIDFIELDER')) {
    return 'MF';
  }

  if (normalized.includes('FW') || normalized.includes('FORWARD')) {
    return 'FW';
  }

  return normalized;
};

const extractBirthDate = (html) => {
  const match = html.match(/<span class="bday">([^<]+)<\/span>/);
  return match?.[1] ?? '';
};

const extractAge = (text) => {
  const match = text.match(/aged\s+(\d+)/i);
  return match?.[1] ? Number(match[1]) : '';
};

const normalizeInteger = (text) => {
  const trimmed = text.trim();

  if (!trimmed) {
    return '';
  }

  const match = trimmed.match(/-?\d+/);
  return match ? Number(match[0]) : '';
};

const extractMainLink = (html) => extractLinks(html)[0] ?? { href: '', text: '' };
const extractLastLink = (html) => {
  const links = extractLinks(html).filter((link) => !link.href.includes('/wiki/File:'));
  return links[links.length - 1] ?? { href: '', text: '' };
};

const extractLinks = (html) => {
  const links = [];
  const linkPattern = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = linkPattern.exec(html))) {
    links.push({
      href: absoluteWikiUrl(decodeHtml(match[1])),
      text: stripHtml(match[2]),
    });
  }

  return links;
};

const absoluteWikiUrl = (href) => {
  if (!href || href.startsWith('#')) {
    return '';
  }

  if (href.startsWith('//')) {
    return `https:${href}`;
  }

  if (href.startsWith('/')) {
    return `https://en.wikipedia.org${href}`;
  }

  return href;
};

const writeCsv = async (filePath, rows, headers) => {
  const body = rows.map((row) => headers.map((header) => csvValue(row[header])).join(','));
  await writeFile(filePath, `${headers.join(',')}\n${body.join('\n')}\n`);
};

const csvValue = (value) => {
  const stringValue = value === undefined || value === null ? '' : String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const requestText = (url, redirectCount = 0) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'QuadrillionWorldCupSquadData/0.1 (local data script)',
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
          resolve(requestText(nextUrl, redirectCount + 1));
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Request failed for ${url}: ${response.statusCode}`));
          return;
        }

        response.setEncoding('utf8');
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
      },
    );

    request.on('error', reject);
    request.end();
  });

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
