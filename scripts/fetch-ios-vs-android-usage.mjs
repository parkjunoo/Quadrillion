import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('data/ios-vs-android');
const GENERATED_SOURCE_DIR = path.resolve('src/projects/ios-vs-android/generated');
const STATCOUNTER_DOWNLOAD_URL = 'https://gs.statcounter.com/download/os-country/';
const SOURCE_LABEL = 'StatCounter GlobalStats mobile OS web usage share';
const DEFAULT_START_MONTH = '2009-01';
const TOP_COUNTRY_LIMIT = 10;

const MONTHLY_FILE = path.join(
  DATA_DIR,
  'statcounter_mobile_os_country_monthly.csv',
);
const ANNUAL_FILE = path.join(
  DATA_DIR,
  'statcounter_mobile_os_country_annual.csv',
);
const YEARLY_SUMMARY_FILE = path.join(
  DATA_DIR,
  'statcounter_mobile_os_yearly_summary.csv',
);
const CROSSOVERS_FILE = path.join(
  DATA_DIR,
  'statcounter_mobile_os_country_crossovers.csv',
);
const META_FILE = path.join(DATA_DIR, 'statcounter_mobile_os.meta.json');
const GENERATED_ANNUAL_TS_FILE = path.join(
  GENERATED_SOURCE_DIR,
  'iosVsAndroidAnnualCsv.ts',
);

const MONTHLY_HEADERS = [
  'date',
  'year',
  'month',
  'country',
  'android_share',
  'ios_share',
  'other_share',
  'android_ios_total_share',
  'leader',
  'leader_share',
  'ios_minus_android_pp',
  'source',
  'source_url',
];

const ANNUAL_HEADERS = [
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
  'month_count',
  'first_month',
  'last_month',
  'is_partial_year',
  'source',
  'method',
];

const YEARLY_SUMMARY_HEADERS = [
  'year',
  'period',
  'country_count',
  'android_led_countries',
  'ios_led_countries',
  'tied_countries',
  'avg_android_share',
  'avg_ios_share',
  'avg_other_share',
  'avg_ios_minus_android_pp',
  'top_ios_countries',
  'top_android_countries',
  'is_partial_year',
  'source',
  'method',
];

const CROSSOVER_HEADERS = [
  'country',
  'crossover_count',
  'first_observed_leader',
  'first_observed_month',
  'latest_leader',
  'latest_month',
  'latest_android_share',
  'latest_ios_share',
  'latest_ios_minus_android_pp',
  'leader_timeline',
  'source',
];

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const startMonth = options.start ?? DEFAULT_START_MONTH;
  const endMonth = options.end ?? latestCompletedStatcounterMonth(new Date());
  const months = monthsBetween(parseMonth(startMonth), parseMonth(endMonth));

  if (months.length === 0) {
    throw new Error(`No months selected: start=${startMonth}, end=${endMonth}`);
  }

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(GENERATED_SOURCE_DIR, { recursive: true });

  const monthlyRows = [];
  const skippedMonths = [];

  for (let index = 0; index < months.length; index += 1) {
    const month = months[index];
    const sourceUrl = statcounterUrl(month.year, month.month);
    const table = await fetchMonthlyTable(month.year, month.month, sourceUrl);

    if (!table) {
      skippedMonths.push(formatMonth(month));
      continue;
    }

    monthlyRows.push(...toMonthlyRows(table, month, sourceUrl));
    console.log(
      `${String(index + 1).padStart(3, '0')}/${months.length} ${formatMonth(month)} ${table.countryCount} countries`,
    );
  }

  monthlyRows.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.country.localeCompare(b.country),
  );

  const annualRows = toAnnualRows(monthlyRows, parseMonth(endMonth));
  const yearlySummaryRows = toYearlySummaryRows(annualRows);
  const crossoverRows = toCrossoverRows(monthlyRows);

  await writeCsv(MONTHLY_FILE, monthlyRows, MONTHLY_HEADERS);
  await writeCsv(ANNUAL_FILE, annualRows, ANNUAL_HEADERS);
  await writeCsv(YEARLY_SUMMARY_FILE, yearlySummaryRows, YEARLY_SUMMARY_HEADERS);
  await writeCsv(CROSSOVERS_FILE, crossoverRows, CROSSOVER_HEADERS);
  await writeFile(
    GENERATED_ANNUAL_TS_FILE,
    generatedCsvModule({
      exportName: 'iosVsAndroidAnnualCsv',
      generator: 'scripts/fetch-ios-vs-android-usage.mjs',
      headers: ANNUAL_HEADERS,
      rows: annualRows,
    }),
  );
  await writeFile(
    META_FILE,
    `${JSON.stringify(
      {
        source: {
          name: SOURCE_LABEL,
          chartPage:
            'https://gs.statcounter.com/os-market-share/mobile/worldwide/',
          downloadEndpoint:
            'https://gs.statcounter.com/download/os-country/?year={year}&month={month}&device=mobile',
          methodology: 'https://gs.statcounter.com/faq',
          license:
            'StatCounter GlobalStats says its data is available under Creative Commons Attribution-Share Alike 3.0 Unported with credit.',
        },
        generatedAt: new Date().toISOString(),
        startMonth,
        endMonth,
        requestedMonthCount: months.length,
        skippedMonths,
        countryCount: uniqueCount(monthlyRows.map((row) => row.country)),
        monthlyRowCount: monthlyRows.length,
        annualRowCount: annualRows.length,
        yearlySummaryRowCount: yearlySummaryRows.length,
        crossoverRowCount: crossoverRows.length,
        files: {
          monthly: path.relative(process.cwd(), MONTHLY_FILE),
          annual: path.relative(process.cwd(), ANNUAL_FILE),
          yearlySummary: path.relative(process.cwd(), YEARLY_SUMMARY_FILE),
          crossovers: path.relative(process.cwd(), CROSSOVERS_FILE),
          generatedAnnualModule: path.relative(
            process.cwd(),
            GENERATED_ANNUAL_TS_FILE,
          ),
        },
        method:
          'Downloaded monthly StatCounter country CSVs with device=mobile, extracted Android and iOS rows, treated all other OS rows as other_share, and computed annual rows as an unweighted mean of available monthly percentages for each country/year.',
        caveats: [
          'Usage share is based on web page views observed by StatCounter, not device shipments, installed base, or unique users.',
          'Annual values are simple averages of monthly percentage shares, not traffic-volume-weighted annual totals.',
          'The final year can be partial when the latest completed month is before December.',
        ],
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${monthlyRows.length} rows to ${MONTHLY_FILE}`);
  console.log(`Wrote ${annualRows.length} rows to ${ANNUAL_FILE}`);
  console.log(`Wrote ${yearlySummaryRows.length} rows to ${YEARLY_SUMMARY_FILE}`);
  console.log(`Wrote ${crossoverRows.length} rows to ${CROSSOVERS_FILE}`);
  console.log(`Wrote generated module to ${GENERATED_ANNUAL_TS_FILE}`);
  console.log(`Wrote metadata to ${META_FILE}`);
};

const parseArgs = (args) => {
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--start=')) {
      options.start = arg.slice('--start='.length);
      continue;
    }

    if (arg.startsWith('--end=')) {
      options.end = arg.slice('--end='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const latestCompletedStatcounterMonth = (date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const monthsBack = day >= 3 ? 1 : 2;
  const latest = addMonths({ year, month }, -monthsBack);

  return formatMonth(latest);
};

const monthsBetween = (start, end) => {
  const months = [];
  let cursor = start;

  while (compareMonth(cursor, end) <= 0) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return months;
};

const addMonths = ({ year, month }, count) => {
  const zeroBased = year * 12 + (month - 1) + count;

  return {
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12) + 1,
  };
};

const parseMonth = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Expected YYYY-MM month, got: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${value}`);
  }

  return { year, month };
};

const compareMonth = (left, right) =>
  left.year === right.year ? left.month - right.month : left.year - right.year;

const formatMonth = ({ year, month }) =>
  `${year}-${String(month).padStart(2, '0')}`;

const dateForMonth = (month) => `${formatMonth(month)}-01`;

const statcounterUrl = (year, month) =>
  `${STATCOUNTER_DOWNLOAD_URL}?year=${year}&month=${month}&device=mobile`;

const fetchMonthlyTable = async (year, month, sourceUrl) => {
  const response = await fetch(sourceUrl, {
    headers: {
      accept: 'text/csv,*/*;q=0.8',
      'user-agent':
        'Quadrillion data collector (StatCounter GlobalStats source attribution)',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `StatCounter download failed for ${year}-${month}: ${response.status} ${response.statusText}`,
    );
  }

  const csv = await response.text();
  const records = parseCsv(csv);

  if (records.length === 0) {
    throw new Error(`No rows returned for ${year}-${month}: ${sourceUrl}`);
  }

  const countries = Object.keys(records[0]).filter((key) => key !== 'OS');
  const rowsByOs = new Map(records.map((record) => [record.OS, record]));

  if (!rowsByOs.has('Android') || !rowsByOs.has('iOS')) {
    throw new Error(`Android/iOS rows missing for ${year}-${month}`);
  }

  return {
    countries,
    records,
    rowsByOs,
    countryCount: countries.length,
  };
};

const toMonthlyRows = ({ countries, records, rowsByOs }, month, sourceUrl) => {
  const androidRow = rowsByOs.get('Android');
  const iosRow = rowsByOs.get('iOS');

  return countries.map((country) => {
    const androidShare = parseShare(androidRow[country]);
    const iosShare = parseShare(iosRow[country]);
    const totalShare = records.reduce(
      (sum, record) => sum + parseShare(record[country]),
      0,
    );
    const otherShare = Math.max(0, totalShare - androidShare - iosShare);
    const leader = leaderFor(androidShare, iosShare);
    const leaderShare =
      leader === 'Android'
        ? androidShare
        : leader === 'iOS'
          ? iosShare
          : Math.max(androidShare, iosShare);

    return {
      date: dateForMonth(month),
      year: month.year,
      month: month.month,
      country,
      android_share: roundShare(androidShare),
      ios_share: roundShare(iosShare),
      other_share: roundShare(otherShare),
      android_ios_total_share: roundShare(androidShare + iosShare),
      leader,
      leader_share: roundShare(leaderShare),
      ios_minus_android_pp: roundShare(iosShare - androidShare),
      source: SOURCE_LABEL,
      source_url: sourceUrl,
    };
  });
};

const toAnnualRows = (monthlyRows, endMonth) => {
  const rowsByCountryYear = groupBy(
    monthlyRows,
    (row) => `${row.country}\u0000${row.year}`,
  );
  const rows = [];

  for (const groupRows of rowsByCountryYear.values()) {
    const sortedRows = groupRows.toSorted(
      (a, b) => a.date.localeCompare(b.date),
    );
    const firstRow = sortedRows[0];
    const year = Number(firstRow.year);
    const monthCount = sortedRows.length;
    const isPartialYear = year === endMonth.year && endMonth.month < 12;
    const androidShare = average(sortedRows.map((row) => row.android_share));
    const iosShare = average(sortedRows.map((row) => row.ios_share));
    const otherShare = average(sortedRows.map((row) => row.other_share));
    const leader = leaderFor(androidShare, iosShare);
    const leaderShare =
      leader === 'Android'
        ? androidShare
        : leader === 'iOS'
          ? iosShare
          : Math.max(androidShare, iosShare);

    rows.push({
      year,
      period: isPartialYear ? `${year} YTD` : String(year),
      country: firstRow.country,
      android_share: roundShare(androidShare),
      ios_share: roundShare(iosShare),
      other_share: roundShare(otherShare),
      android_ios_total_share: roundShare(androidShare + iosShare),
      leader,
      leader_share: roundShare(leaderShare),
      ios_minus_android_pp: roundShare(iosShare - androidShare),
      month_count: monthCount,
      first_month: firstRow.date.slice(0, 7),
      last_month: sortedRows.at(-1).date.slice(0, 7),
      is_partial_year: String(isPartialYear),
      source: SOURCE_LABEL,
      method: 'unweighted average of available monthly country shares',
    });
  }

  return rows.sort(
    (a, b) =>
      Number(a.year) - Number(b.year) ||
      a.country.localeCompare(b.country),
  );
};

const toYearlySummaryRows = (annualRows) => {
  const rowsByYear = groupBy(annualRows, (row) => row.year);

  return [...rowsByYear.entries()]
    .toSorted(([left], [right]) => Number(left) - Number(right))
    .map(([year, rows]) => {
      const sortedByIos = rows.toSorted(
        (a, b) => b.ios_share - a.ios_share || a.country.localeCompare(b.country),
      );
      const sortedByAndroid = rows.toSorted(
        (a, b) =>
          b.android_share - a.android_share || a.country.localeCompare(b.country),
      );

      return {
        year,
        period: rows[0].period,
        country_count: rows.length,
        android_led_countries: rows.filter((row) => row.leader === 'Android')
          .length,
        ios_led_countries: rows.filter((row) => row.leader === 'iOS').length,
        tied_countries: rows.filter((row) => row.leader === 'Tie').length,
        avg_android_share: roundShare(
          average(rows.map((row) => row.android_share)),
        ),
        avg_ios_share: roundShare(average(rows.map((row) => row.ios_share))),
        avg_other_share: roundShare(average(rows.map((row) => row.other_share))),
        avg_ios_minus_android_pp: roundShare(
          average(rows.map((row) => row.ios_minus_android_pp)),
        ),
        top_ios_countries: topCountryList(sortedByIos, 'ios_share'),
        top_android_countries: topCountryList(sortedByAndroid, 'android_share'),
        is_partial_year: String(rows.some((row) => row.is_partial_year === 'true')),
        source: SOURCE_LABEL,
        method: 'country-level annual rows summarized without population weighting',
      };
    });
};

const toCrossoverRows = (monthlyRows) => {
  const rowsByCountry = groupBy(monthlyRows, (row) => row.country);

  return [...rowsByCountry.entries()]
    .map(([country, rows]) => {
      const sortedRows = rows.toSorted((a, b) => a.date.localeCompare(b.date));
      const timeline = [];
      let previousLeader = null;

      for (const row of sortedRows) {
        if (row.leader === 'Tie') {
          continue;
        }

        if (row.leader !== previousLeader) {
          timeline.push(`${row.date.slice(0, 7)}:${row.leader}`);
          previousLeader = row.leader;
        }
      }

      const firstRow = sortedRows[0];
      const latestRow = sortedRows.at(-1);

      return {
        country,
        crossover_count: Math.max(0, timeline.length - 1),
        first_observed_leader: timeline[0]?.split(':')[1] ?? firstRow.leader,
        first_observed_month: timeline[0]?.split(':')[0] ?? firstRow.date.slice(0, 7),
        latest_leader: latestRow.leader,
        latest_month: latestRow.date.slice(0, 7),
        latest_android_share: latestRow.android_share,
        latest_ios_share: latestRow.ios_share,
        latest_ios_minus_android_pp: latestRow.ios_minus_android_pp,
        leader_timeline: timeline.join(' | '),
        source: SOURCE_LABEL,
      };
    })
    .sort(
      (a, b) =>
        b.crossover_count - a.crossover_count ||
        a.country.localeCompare(b.country),
    );
};

const leaderFor = (androidShare, iosShare) => {
  if (Math.abs(androidShare - iosShare) < 0.005) {
    return 'Tie';
  }

  return androidShare > iosShare ? 'Android' : 'iOS';
};

const parseShare = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const roundShare = (value) => Number(value.toFixed(2));

const average = (values) =>
  values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + Number(value), 0) / values.length;

const topCountryList = (rows, shareKey) =>
  rows
    .slice(0, TOP_COUNTRY_LIMIT)
    .map((row) => `${row.country} ${roundShare(row[shareKey])}`)
    .join(' | ');

const uniqueCount = (values) => new Set(values).size;

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

const parseCsv = (csv) => {
  const [headerLine, ...bodyLines] = csv.trim().split(/\r?\n/).filter(Boolean);

  if (!headerLine) {
    return [];
  }

  const headers = splitCsvLine(headerLine);

  return bodyLines.map((line) => {
    const columns = splitCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [header, columns[index] ?? '']),
    );
  });
};

const writeCsv = async (filePath, rows, headers) => {
  const body = rows.map((row) =>
    headers.map((header) => csvValue(row[header])).join(','),
  );

  await writeFile(filePath, `${headers.join(',')}\n${body.join('\n')}\n`);
};

const generatedCsvModule = ({ exportName, generator, headers, rows }) => {
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(',')),
  ].join('\n');

  return [
    `// Generated by ${generator}. Do not edit manually.`,
    `export const ${exportName} =`,
    `  ${JSON.stringify(`${csv}\n`)};`,
    '',
  ].join('\n');
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

const csvValue = (value) => {
  const text = String(value ?? '');

  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
