import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('data/football-market-values');
const OUTPUT_DIR = path.resolve('outputs/football-market-values/club-history');

const PLAYER_POOL_FILE = path.join(DATA_DIR, 'football_player_market_values_top10_player_pool.csv');
const MONTHLY_POOL_FILE = path.join(DATA_DIR, 'football_player_market_values_top10_player_pool_monthly.csv');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const main = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [players, monthlyRows] = await Promise.all([
    readCsv(PLAYER_POOL_FILE),
    readCsv(MONTHLY_POOL_FILE),
  ]);

  const playerOrder = new Map(players.map((player, index) => [player.player_id, index]));
  const monthlyHistory = buildMonthlyHistory(monthlyRows, playerOrder);
  const yearlyHistory = buildYearlyHistory(monthlyHistory, playerOrder);
  const clubSpells = buildClubSpells(monthlyHistory, playerOrder);

  await writeCsv(
    path.join(OUTPUT_DIR, 'top10-player-club-history-monthly.csv'),
    monthlyHistory,
    [
      'month',
      'year',
      'month_number',
      'player_id',
      'name',
      'country',
      'position',
      'sub_position',
      'club',
      'competition_id',
      'value_million_eur',
      'global_rank',
      'is_top10',
      'top10_rank',
      'valuation_date',
      'valuation_age_days',
      'valuation_source',
      'player_url',
    ],
  );

  await writeCsv(
    path.join(OUTPUT_DIR, 'top10-player-club-history-yearly.csv'),
    yearlyHistory,
    [
      'year',
      'player_id',
      'name',
      'country',
      'position',
      'primary_club',
      'clubs',
      'club_spans',
      'tracked_months',
      'top10_months',
      'best_global_rank',
      'peak_value_million_eur',
      'latest_value_million_eur',
      'latest_month',
    ],
  );

  await writeCsv(
    path.join(OUTPUT_DIR, 'top10-player-club-spells.csv'),
    clubSpells,
    [
      'player_id',
      'name',
      'country',
      'position',
      'club',
      'competition_id',
      'start_month',
      'end_month',
      'months',
      'top10_months',
      'best_global_rank',
      'first_value_million_eur',
      'last_value_million_eur',
      'peak_value_million_eur',
      'valuation_sources',
    ],
  );

  await writeFile(
    path.join(OUTPUT_DIR, 'README.md'),
    [
      '# Top 10 Player Pool Club History',
      '',
      'Generated from `data/football-market-values/football_player_market_values_top10_player_pool_monthly.csv`.',
      '',
      'Important caveat: this is a Transfermarkt valuation-snapshot club field, forward-filled month by month from the latest active valuation row. It is suitable for video labels and broad club-history analysis, but it is not an official match-appearance ledger.',
      '',
      'Files:',
      '',
      '- `top10-player-club-history-monthly.csv`: one row per tracked player-month.',
      '- `top10-player-club-history-yearly.csv`: one row per tracked player-year with club spans summarized.',
      '- `top10-player-club-spells.csv`: contiguous club periods inferred from monthly rows.',
      '',
      `Players: ${players.length}`,
      `Monthly rows: ${monthlyHistory.length}`,
      `Yearly rows: ${yearlyHistory.length}`,
      `Club spells: ${clubSpells.length}`,
      '',
    ].join('\n'),
  );

  console.log(`Wrote ${monthlyHistory.length} monthly rows`);
  console.log(`Wrote ${yearlyHistory.length} yearly rows`);
  console.log(`Wrote ${clubSpells.length} club spells`);
  console.log(`Saved club-history outputs to ${OUTPUT_DIR}`);
};

const readCsv = async (filePath) => parseCsv(await readFile(filePath, 'utf8'));

const buildMonthlyHistory = (rows, playerOrder) =>
  rows
    .map((row) => ({
      month: row.date.slice(0, 7),
      year: row.year,
      month_number: String(row.month).padStart(2, '0'),
      player_id: row.player_id,
      name: row.name,
      country: row.country,
      position: row.position,
      sub_position: row.sub_position,
      club: row.club || 'Unknown',
      competition_id: row.competition_id,
      value_million_eur: row.value_million_eur,
      global_rank: row.global_rank,
      is_top10: row.is_top10,
      top10_rank: row.top10_rank,
      valuation_date: row.valuation_date,
      valuation_age_days: row.valuation_age_days,
      valuation_source: row.valuation_source,
      player_url: row.player_url,
    }))
    .sort((a, b) => comparePlayerThenMonth(a, b, playerOrder));

const buildYearlyHistory = (monthlyHistory, playerOrder) => {
  const groups = groupBy(
    monthlyHistory,
    (row) => `${row.player_id}:${row.year}`,
  );

  return [...groups.values()]
    .map((rows) => {
      const sortedRows = rows.toSorted(compareByMonth);
      const clubCounts = countBy(sortedRows, (row) => row.club);
      const primaryClub = [...clubCounts.entries()].toSorted((a, b) =>
        b[1] - a[1] || a[0].localeCompare(b[0])
      )[0]?.[0] ?? 'Unknown';
      const latestRow = sortedRows.at(-1);

      return {
        year: sortedRows[0].year,
        player_id: sortedRows[0].player_id,
        name: sortedRows[0].name,
        country: sortedRows[0].country,
        position: sortedRows[0].position,
        primary_club: primaryClub,
        clubs: [...new Set(sortedRows.map((row) => row.club))].join(' | '),
        club_spans: summarizeClubSpans(sortedRows),
        tracked_months: sortedRows.length,
        top10_months: sortedRows.filter((row) => row.is_top10 === '1').length,
        best_global_rank: Math.min(...sortedRows.map((row) => toNumber(row.global_rank))),
        peak_value_million_eur: Math.max(...sortedRows.map((row) => toNumber(row.value_million_eur))),
        latest_value_million_eur: latestRow?.value_million_eur ?? '',
        latest_month: latestRow?.month ?? '',
      };
    })
    .sort((a, b) => comparePlayerThenYear(a, b, playerOrder));
};

const buildClubSpells = (monthlyHistory, playerOrder) => {
  const playerRows = groupBy(monthlyHistory, (row) => row.player_id);
  const spells = [];

  for (const rows of playerRows.values()) {
    const sortedRows = rows.toSorted(compareByMonth);
    let currentSpell = null;

    for (const row of sortedRows) {
      if (
        !currentSpell ||
        row.club !== currentSpell.club ||
        row.competition_id !== currentSpell.competition_id ||
        !areAdjacentMonths(currentSpell.rows.at(-1).month, row.month)
      ) {
        if (currentSpell) {
          spells.push(finishSpell(currentSpell));
        }

        currentSpell = {
          player_id: row.player_id,
          name: row.name,
          country: row.country,
          position: row.position,
          club: row.club,
          competition_id: row.competition_id,
          start_month: row.month,
          rows: [row],
        };
        continue;
      }

      currentSpell.rows.push(row);
    }

    if (currentSpell) {
      spells.push(finishSpell(currentSpell));
    }
  }

  return spells.sort((a, b) => comparePlayerThenMonth(a, b, playerOrder));
};

const finishSpell = (spell) => {
  const rows = spell.rows;
  const firstRow = rows[0];
  const lastRow = rows.at(-1);

  return {
    player_id: spell.player_id,
    name: spell.name,
    country: spell.country,
    position: spell.position,
    club: spell.club,
    competition_id: spell.competition_id,
    start_month: spell.start_month,
    end_month: lastRow.month,
    months: rows.length,
    top10_months: rows.filter((row) => row.is_top10 === '1').length,
    best_global_rank: Math.min(...rows.map((row) => toNumber(row.global_rank))),
    first_value_million_eur: firstRow.value_million_eur,
    last_value_million_eur: lastRow.value_million_eur,
    peak_value_million_eur: Math.max(...rows.map((row) => toNumber(row.value_million_eur))),
    valuation_sources: [...new Set(rows.map((row) => row.valuation_source))].join(' | '),
  };
};

const summarizeClubSpans = (rows) => {
  const spans = [];
  let spanStart = rows[0];
  let previous = rows[0];

  for (const row of rows.slice(1)) {
    if (
      row.club !== previous.club ||
      row.competition_id !== previous.competition_id ||
      !areAdjacentMonths(previous.month, row.month)
    ) {
      spans.push(formatSpan(spanStart, previous));
      spanStart = row;
    }

    previous = row;
  }

  spans.push(formatSpan(spanStart, previous));

  return spans.join(' | ');
};

const formatSpan = (start, end) => {
  const monthRange = start.month === end.month
    ? monthLabel(start.month)
    : `${monthLabel(start.month)}-${monthLabel(end.month)}`;

  return `${monthRange}: ${start.club}`;
};

const monthLabel = (month) => MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? month;

const areAdjacentMonths = (previousMonth, currentMonth) =>
  monthIndex(currentMonth) - monthIndex(previousMonth) === 1;

const monthIndex = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return year * 12 + monthNumber;
};

const groupBy = (rows, keyFor) => {
  const groups = new Map();

  for (const row of rows) {
    const key = keyFor(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return groups;
};

const countBy = (rows, keyFor) => {
  const counts = new Map();

  for (const row of rows) {
    const key = keyFor(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
};

const writeCsv = async (filePath, rows, headers) => {
  await writeFile(filePath, `${toCsv(rows, headers)}\n`);
};

const toCsv = (rows, headers) => [
  headers.join(','),
  ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
].join('\n');

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

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY;
};

const compareByMonth = (a, b) => a.month.localeCompare(b.month);

const comparePlayerThenMonth = (a, b, playerOrder) =>
  (playerOrder.get(a.player_id) ?? Number.MAX_SAFE_INTEGER) -
    (playerOrder.get(b.player_id) ?? Number.MAX_SAFE_INTEGER) ||
  monthForCompare(a).localeCompare(monthForCompare(b));

const comparePlayerThenYear = (a, b, playerOrder) =>
  (playerOrder.get(a.player_id) ?? Number.MAX_SAFE_INTEGER) -
    (playerOrder.get(b.player_id) ?? Number.MAX_SAFE_INTEGER) ||
  Number(a.year) - Number(b.year);

const monthForCompare = (row) => row.month ?? row.start_month ?? '';

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
