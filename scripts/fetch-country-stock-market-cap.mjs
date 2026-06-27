import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const INDICATOR = 'CM.MKT.LCAP.CD';
const INDICATOR_NAME = 'Market capitalization of listed domestic companies (current US$)';
const SOURCE_NAME = 'World Bank WDI via World Federation of Exchanges';
const SOURCE_URL = `https://data.worldbank.org/indicator/${INDICATOR}`;
const API_BASE_URL = 'https://api.worldbank.org/v2';
const DATA_DIR = path.resolve('data/country-stock-market-cap');
const GENERATED_SOURCE_DIR = path.resolve(
  'src/projects/country-stock-market-cap/generated',
);
const DEFAULT_TOP_LIMIT = 40;

const PANEL_FILE = path.join(
  DATA_DIR,
  'country_stock_market_cap_annual_wdi.csv',
);
const OBSERVED_FILE = path.join(
  DATA_DIR,
  'country_stock_market_cap_observed_wdi.csv',
);
const TOP_VIDEO_FILE = path.join(
  DATA_DIR,
  'country_stock_market_cap_top40_video.csv',
);
const COVERAGE_FILE = path.join(
  DATA_DIR,
  'country_stock_market_cap_coverage.csv',
);
const META_FILE = path.join(
  DATA_DIR,
  'country_stock_market_cap.meta.json',
);
const GENERATED_ENTRIES_FILE = path.join(
  GENERATED_SOURCE_DIR,
  'countryStockMarketCapEntries.ts',
);

const PANEL_HEADERS = [
  'year',
  'name',
  'code',
  'iso2',
  'region',
  'income_group',
  'value_usd',
  'value_million_usd',
  'value_trillion_usd',
  'rank',
  'source',
  'indicator',
  'source_url',
];

const OBSERVED_HEADERS = [
  ...PANEL_HEADERS.slice(0, 10),
  'color',
  ...PANEL_HEADERS.slice(10),
];

const TOP_VIDEO_HEADERS = [
  'year',
  'name',
  'code',
  'region',
  'value',
  'color',
  'rank',
  'valueUsd',
  'valueTrillionUsd',
  'source',
];

const COVERAGE_HEADERS = [
  'year',
  'country_count',
  'observed_count',
  'missing_count',
  'coverage_pct',
  'total_value_usd',
  'total_value_trillion_usd',
  'top_country',
  'top_code',
  'top_value_usd',
  'top_value_trillion_usd',
];

const PALETTE = [
  '#38BDF8',
  '#F97316',
  '#22C55E',
  '#A78BFA',
  '#F43F5E',
  '#FACC15',
  '#2DD4BF',
  '#818CF8',
  '#FB7185',
  '#84CC16',
  '#60A5FA',
  '#E879F9',
  '#14B8A6',
  '#F59E0B',
  '#94A3B8',
  '#EF4444',
];

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const topLimit = options.top ?? DEFAULT_TOP_LIMIT;

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(GENERATED_SOURCE_DIR, { recursive: true });

  const countryResponse = await fetchWorldBankPages('country');
  const countries = countryResponse.rows
    .filter((country) => country.region?.value !== 'Aggregates')
    .map(toCountry)
    .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code));
  const countryByCode = new Map(countries.map((country) => [country.code, country]));

  const indicatorResponse = await fetchWorldBankPages(
    `country/all/indicator/${INDICATOR}`,
  );
  const indicatorRows = indicatorResponse.rows.filter((row) =>
    countryByCode.has(row.countryiso3code),
  );

  const observedYears = unique(
    indicatorRows
      .filter((row) => row.value !== null && Number.isFinite(Number(row.value)))
      .map((row) => Number(row.date))
      .filter((year) => Number.isInteger(year)),
  ).sort((a, b) => a - b);
  const startYear = options.start ?? observedYears[0];
  const endYear = options.end ?? observedYears.at(-1);
  const years = observedYears.filter(
    (year) => year >= startYear && year <= endYear,
  );

  const valueByCountryYear = new Map();

  for (const row of indicatorRows) {
    const year = Number(row.date);
    const value = row.value === null ? null : Number(row.value);

    if (
      !years.includes(year) ||
      !countryByCode.has(row.countryiso3code) ||
      !Number.isFinite(value)
    ) {
      continue;
    }

    valueByCountryYear.set(`${row.countryiso3code}:${year}`, value);
  }

  const panelRows = [];
  const observedRows = [];
  const topVideoRows = [];
  const coverageRows = [];

  for (const year of years) {
    const yearObserved = countries
      .map((country) => ({
        ...country,
        year,
        valueUsd: valueByCountryYear.get(`${country.code}:${year}`),
      }))
      .filter((row) => Number.isFinite(row.valueUsd))
      .sort((a, b) => b.valueUsd - a.valueUsd || a.name.localeCompare(b.name));

    const rankByCode = new Map(
      yearObserved.map((row, index) => [row.code, index + 1]),
    );
    const missingRows = countries
      .filter((country) => !rankByCode.has(country.code))
      .map((country) => ({ ...country, year, valueUsd: null }));

    for (const row of [...yearObserved, ...missingRows]) {
      panelRows.push(toPanelRow(row, rankByCode.get(row.code)));
    }

    for (const row of yearObserved) {
      const rank = rankByCode.get(row.code);
      observedRows.push(toObservedRow(row, rank));

      if (rank <= topLimit) {
        topVideoRows.push(toTopVideoRow(row, rank));
      }
    }

    coverageRows.push(toCoverageRow(year, countries.length, yearObserved));
  }

  await writeCsv(PANEL_FILE, PANEL_HEADERS, panelRows);
  await writeCsv(OBSERVED_FILE, OBSERVED_HEADERS, observedRows);
  await writeCsv(TOP_VIDEO_FILE, TOP_VIDEO_HEADERS, topVideoRows);
  await writeCsv(COVERAGE_FILE, COVERAGE_HEADERS, coverageRows);
  await writeGeneratedEntries({
    countries,
    topVideoRows,
    valueByCountryYear,
    years,
  });
  await writeMetadata({
    countryResponse,
    indicatorResponse,
    countries,
    years,
    observedRows,
    panelRows,
    topVideoRows,
    coverageRows,
    topLimit,
  });

  console.log(`Wrote ${panelRows.length} rows to ${PANEL_FILE}`);
  console.log(`Wrote ${observedRows.length} rows to ${OBSERVED_FILE}`);
  console.log(`Wrote ${topVideoRows.length} rows to ${TOP_VIDEO_FILE}`);
  console.log(`Wrote ${coverageRows.length} rows to ${COVERAGE_FILE}`);
  console.log(`Wrote generated entries to ${GENERATED_ENTRIES_FILE}`);
  console.log(`Wrote metadata to ${META_FILE}`);
};

function parseArgs(args) {
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--start=')) {
      options.start = parseYear(arg.slice('--start='.length), arg);
      continue;
    }

    if (arg.startsWith('--end=')) {
      options.end = parseYear(arg.slice('--end='.length), arg);
      continue;
    }

    if (arg.startsWith('--top=')) {
      const value = Number(arg.slice('--top='.length));

      if (!Number.isInteger(value) || value < 1) {
        throw new Error(`Invalid top limit: ${arg}`);
      }

      options.top = value;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (
    options.start !== undefined &&
    options.end !== undefined &&
    options.start > options.end
  ) {
    throw new Error(`Start year must be before end year: ${options.start} > ${options.end}`);
  }

  return options;
}

function parseYear(value, arg) {
  const year = Number(value);

  if (!Number.isInteger(year)) {
    throw new Error(`Invalid year: ${arg}`);
  }

  return year;
}

async function fetchWorldBankPages(pathname) {
  const rows = [];
  let metadata = null;
  let page = 1;
  let pages = 1;

  do {
    const url = new URL(`${API_BASE_URL}/${pathname}`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('per_page', '20000');
    url.searchParams.set('page', String(page));

    const payload = await fetchJson(url);

    if (!Array.isArray(payload) || !payload[0]) {
      throw new Error(`Unexpected World Bank response for ${url}`);
    }

    metadata = payload[0];
    pages = Number(metadata.pages) || 1;

    if (Array.isArray(payload[1])) {
      rows.push(...payload[1]);
    }

    page += 1;
  } while (page <= pages);

  return { metadata, rows };
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} ${url}`);
  }

  return response.json();
}

function toCountry(country) {
  return {
    code: country.id,
    iso2: country.iso2Code,
    name: country.name,
    region: cleanValue(country.region?.value),
    incomeGroup: cleanValue(country.incomeLevel?.value),
  };
}

function toPanelRow(row, rank) {
  return {
    year: row.year,
    name: row.name,
    code: row.code,
    iso2: row.iso2,
    region: row.region,
    income_group: row.incomeGroup,
    value_usd: formatUsd(row.valueUsd),
    value_million_usd: formatDecimal(row.valueUsd / 1e6, 2),
    value_trillion_usd: formatDecimal(row.valueUsd / 1e12, 6),
    rank: rank ?? '',
    source: SOURCE_NAME,
    indicator: INDICATOR,
    source_url: SOURCE_URL,
  };
}

function toObservedRow(row, rank) {
  return {
    ...toPanelRow(row, rank),
    color: colorForCode(row.code),
  };
}

function toTopVideoRow(row, rank) {
  const valueTrillionUsd = row.valueUsd / 1e12;

  return {
    year: row.year,
    name: row.name,
    code: row.code,
    region: row.region,
    value: formatDecimal(valueTrillionUsd, 6),
    color: colorForCode(row.code),
    rank,
    valueUsd: formatUsd(row.valueUsd),
    valueTrillionUsd: formatDecimal(valueTrillionUsd, 6),
    source: SOURCE_NAME,
  };
}

function toCoverageRow(year, countryCount, observedRows) {
  const totalValue = observedRows.reduce((sum, row) => sum + row.valueUsd, 0);
  const topRow = observedRows[0];

  return {
    year,
    country_count: countryCount,
    observed_count: observedRows.length,
    missing_count: countryCount - observedRows.length,
    coverage_pct: formatDecimal((observedRows.length / countryCount) * 100, 2),
    total_value_usd: formatUsd(totalValue),
    total_value_trillion_usd: formatDecimal(totalValue / 1e12, 6),
    top_country: topRow?.name ?? '',
    top_code: topRow?.code ?? '',
    top_value_usd: formatUsd(topRow?.valueUsd),
    top_value_trillion_usd: topRow
      ? formatDecimal(topRow.valueUsd / 1e12, 6)
      : '',
  };
}

async function writeMetadata({
  countryResponse,
  indicatorResponse,
  countries,
  years,
  observedRows,
  panelRows,
  topVideoRows,
  coverageRows,
  topLimit,
}) {
  const latestCoverage = coverageRows.at(-1);

  const metadata = {
    source: {
      name: SOURCE_NAME,
      indicator: INDICATOR,
      indicatorName: INDICATOR_NAME,
      indicatorPage: SOURCE_URL,
      apiEndpoint: `${API_BASE_URL}/country/all/indicator/${INDICATOR}?format=json`,
      countryApiEndpoint: `${API_BASE_URL}/country?format=json`,
      license: 'CC BY-4.0',
    },
    generatedAt: new Date().toISOString(),
    worldBank: {
      countryMetadataLastUpdated: countryResponse.metadata?.lastupdated ?? null,
      indicatorLastUpdated: indicatorResponse.metadata?.lastupdated ?? null,
      sourceId: indicatorResponse.metadata?.sourceid ?? null,
    },
    yearRange: {
      start: years[0],
      end: years.at(-1),
      count: years.length,
    },
    countryCount: countries.length,
    fullPanelRowCount: panelRows.length,
    observedRowCount: observedRows.length,
    topVideoRowCount: topVideoRows.length,
    topVideoLimitPerYear: topLimit,
    latestYearCoverage: latestCoverage ?? null,
    files: {
      fullPanel: path.relative(process.cwd(), PANEL_FILE),
      observedOnly: path.relative(process.cwd(), OBSERVED_FILE),
      topVideo: path.relative(process.cwd(), TOP_VIDEO_FILE),
      coverage: path.relative(process.cwd(), COVERAGE_FILE),
    },
    method:
      'Downloaded World Bank WDI CM.MKT.LCAP.CD for all economies, kept only country/economy rows whose World Bank region is not Aggregates, preserved missing values in the full panel, and ranked observed values within each year in descending current US dollars.',
    caveats: [
      'Values are current US dollars and are not inflation adjusted.',
      'Values are end-of-year market capitalization of listed domestic companies as reported through World Bank WDI/WFE.',
      'No interpolation, forward fill, or manual correction is applied; missing World Bank observations remain blank.',
      'The country filter follows World Bank economy metadata, so economies such as Hong Kong SAR can appear separately from sovereign states.',
    ],
  };

  await writeFile(META_FILE, `${JSON.stringify(metadata, null, 2)}\n`);
}

async function writeGeneratedEntries({
  countries,
  topVideoRows,
  valueByCountryYear,
  years,
}) {
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const topPoolCodes = unique(topVideoRows.map((row) => row.code));
  const entries = topPoolCodes
    .map((code) => {
      const country = countryByCode.get(code);

      if (!country) {
        return null;
      }

      const observations = years
        .map((year) => ({
          year,
          valueUsd: valueByCountryYear.get(`${code}:${year}`),
        }))
        .filter((row) => Number.isFinite(row.valueUsd))
        .map((row) => ({
          year: row.year,
          valueUsd: Math.round(row.valueUsd),
        }));

      if (observations.length === 0) {
        return null;
      }

      const latestObservation = observations.at(-1);
      const maxObservedValue = Math.max(
        ...observations.map((observation) => observation.valueUsd),
      );

      return {
        adjustedUsd2026: maxObservedValue,
        code: country.code,
        color: colorForCode(country.code),
        firstYear: observations[0].year,
        host: country.name,
        iso2: country.iso2,
        lastYear: latestObservation.year,
        latestValueUsd: latestObservation.valueUsd,
        note: country.incomeGroup,
        observations,
        region: country.region,
        year: observations[0].year,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.firstYear - b.firstYear ||
        b.latestValueUsd - a.latestValueUsd ||
        a.host.localeCompare(b.host),
    );
  const source = [
    '// Generated by scripts/fetch-country-stock-market-cap.mjs',
    '// Source: World Bank WDI CM.MKT.LCAP.CD via World Federation of Exchanges',
    `export const countryStockMarketCapEntries = ${JSON.stringify(entries, null, 2)};`,
    '',
  ].join('\n');

  await writeFile(GENERATED_ENTRIES_FILE, source);
}

async function writeCsv(file, headers, rows) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ];

  await writeFile(file, `${lines.join('\n')}\n`);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function cleanValue(value) {
  return String(value ?? '').trim();
}

function unique(values) {
  return [...new Set(values)];
}

function formatUsd(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  if (Number.isInteger(value)) {
    return value.toFixed(0);
  }

  return value.toFixed(2);
}

function formatDecimal(value, digits) {
  if (!Number.isFinite(value)) {
    return '';
  }

  return value.toFixed(digits);
}

function colorForCode(code) {
  let hash = 0;

  for (const char of code) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return PALETTE[hash % PALETTE.length];
}

await main();
