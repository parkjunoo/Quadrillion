import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outputCsvPath = join(repoRoot, 'data/exchange-rate-race/usd_exchange_rates_annual.csv');
const outputTsPath = join(repoRoot, 'src/projects/exchange-rate-race/generated/exchangeRateRaceCsv.ts');

const indicator = 'PA.NUS.FCRF';
const startYear = 2005;
const endYear = 2024;
const sourceLabel = 'World Bank PA.NUS.FCRF, annual average official exchange rate';

const countries = [
  { code: 'AUS', name: 'Australia', currency: 'AUD', region: 'Oceania', color: '#38BDF8' },
  { code: 'AUT', name: 'Austria', currency: 'EUR', region: 'Europe', color: '#F43F5E' },
  { code: 'BEL', name: 'Belgium', currency: 'EUR', region: 'Europe', color: '#F97316' },
  { code: 'CAN', name: 'Canada', currency: 'CAD', region: 'Americas', color: '#60A5FA' },
  { code: 'CHL', name: 'Chile', currency: 'CLP', region: 'Americas', color: '#EF4444' },
  { code: 'COL', name: 'Colombia', currency: 'COP', region: 'Americas', color: '#FACC15' },
  { code: 'CRI', name: 'Costa Rica', currency: 'CRC', region: 'Americas', color: '#22C55E' },
  { code: 'CZE', name: 'Czechia', currency: 'CZK', region: 'Europe', color: '#818CF8' },
  { code: 'DNK', name: 'Denmark', currency: 'DKK', region: 'Europe', color: '#14B8A6' },
  { code: 'EST', name: 'Estonia', currency: 'EUR', region: 'Europe', color: '#A855F7' },
  { code: 'FIN', name: 'Finland', currency: 'EUR', region: 'Europe', color: '#84CC16' },
  { code: 'FRA', name: 'France', currency: 'EUR', region: 'Europe', color: '#3B82F6' },
  { code: 'DEU', name: 'Germany', currency: 'EUR', region: 'Europe', color: '#EAB308' },
  { code: 'GRC', name: 'Greece', currency: 'EUR', region: 'Europe', color: '#06B6D4' },
  { code: 'HUN', name: 'Hungary', currency: 'HUF', region: 'Europe', color: '#EC4899' },
  { code: 'ISL', name: 'Iceland', currency: 'ISK', region: 'Europe', color: '#0EA5E9' },
  { code: 'IRL', name: 'Ireland', currency: 'EUR', region: 'Europe', color: '#10B981' },
  { code: 'ISR', name: 'Israel', currency: 'ILS', region: 'Middle East', color: '#6366F1' },
  { code: 'ITA', name: 'Italy', currency: 'EUR', region: 'Europe', color: '#22C55E' },
  { code: 'JPN', name: 'Japan', currency: 'JPY', region: 'Asia', color: '#FB7185' },
  { code: 'KOR', name: 'South Korea', currency: 'KRW', region: 'Asia', color: '#38BDF8' },
  { code: 'LVA', name: 'Latvia', currency: 'EUR', region: 'Europe', color: '#DC2626' },
  { code: 'LTU', name: 'Lithuania', currency: 'EUR', region: 'Europe', color: '#F59E0B' },
  { code: 'LUX', name: 'Luxembourg', currency: 'EUR', region: 'Europe', color: '#A3E635' },
  { code: 'MEX', name: 'Mexico', currency: 'MXN', region: 'Americas', color: '#2DD4BF' },
  { code: 'NLD', name: 'Netherlands', currency: 'EUR', region: 'Europe', color: '#F97316' },
  { code: 'NZL', name: 'New Zealand', currency: 'NZD', region: 'Oceania', color: '#7DD3FC' },
  { code: 'NOR', name: 'Norway', currency: 'NOK', region: 'Europe', color: '#F87171' },
  { code: 'POL', name: 'Poland', currency: 'PLN', region: 'Europe', color: '#E11D48' },
  { code: 'PRT', name: 'Portugal', currency: 'EUR', region: 'Europe', color: '#16A34A' },
  { code: 'SVK', name: 'Slovak Republic', currency: 'EUR', region: 'Europe', color: '#2563EB' },
  { code: 'SVN', name: 'Slovenia', currency: 'EUR', region: 'Europe', color: '#65A30D' },
  { code: 'ESP', name: 'Spain', currency: 'EUR', region: 'Europe', color: '#FBBF24' },
  { code: 'SWE', name: 'Sweden', currency: 'SEK', region: 'Europe', color: '#FDE047' },
  { code: 'CHE', name: 'Switzerland', currency: 'CHF', region: 'Europe', color: '#F87171' },
  { code: 'TUR', name: 'Turkiye', currency: 'TRY', region: 'Europe/Asia', color: '#A855F7' },
  { code: 'GBR', name: 'United Kingdom', currency: 'GBP', region: 'Europe', color: '#818CF8' },
  { code: 'USA', name: 'United States', currency: 'USD', region: 'Americas', color: '#22D3EE' },
];

const countryCodes = countries.map((country) => country.code).join(';');
const url = `https://api.worldbank.org/v2/country/${countryCodes}/indicator/${indicator}?format=json&per_page=20000`;

const response = await fetch(url);

if (!response.ok) {
  throw new Error(`World Bank request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
const countryByCode = new Map(countries.map((country) => [country.code, country]));
const valueByCountryYear = new Map();

for (const row of rows) {
  const code = row.countryiso3code;
  const year = Number(row.date);
  const value = Number(row.value);

  if (!countryByCode.has(code) || year < startYear || year > endYear || !Number.isFinite(value)) {
    continue;
  }

  valueByCountryYear.set(`${code}:${year}`, value);
}

const csvRows = ['year,name,code,flag,region,currency,value,rank,color,source'];

for (let year = startYear; year <= endYear; year += 1) {
  const yearRows = countries
    .map((country) => ({
      ...country,
      value: valueByCountryYear.get(`${country.code}:${year}`),
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => b.value - a.value);

  yearRows.forEach((row, index) => {
    csvRows.push([
      year,
      csvEscape(row.name),
      row.code,
      flagForCode(row.code),
      csvEscape(row.region),
      currencyForYear(row.code, year, row.currency),
      formatNumber(row.value),
      index + 1,
      row.color,
      csvEscape(sourceLabel),
    ].join(','));
  });
}

const csv = `${csvRows.join('\n')}\n`;
const ts = `export const exchangeRateRaceCsv = ${JSON.stringify(csv)};\n`;

await mkdir(dirname(outputCsvPath), { recursive: true });
await mkdir(dirname(outputTsPath), { recursive: true });
await writeFile(outputCsvPath, csv);
await writeFile(outputTsPath, ts);

console.log(`Wrote ${outputCsvPath}`);
console.log(`Wrote ${outputTsPath}`);

function csvEscape(value) {
  const text = String(value);

  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function formatNumber(value) {
  if (value >= 1000) {
    return value.toFixed(2);
  }

  if (value >= 10) {
    return value.toFixed(4);
  }

  return value.toFixed(6);
}

function currencyForYear(code, year, defaultCurrency) {
  const historicalCurrencies = {
    EST: year <= 2010 ? 'EEK' : 'EUR',
    LVA: year <= 2013 ? 'LVL' : 'EUR',
    LTU: year <= 2014 ? 'LTL' : 'EUR',
    SVK: year <= 2008 ? 'SKK' : 'EUR',
    SVN: year <= 2006 ? 'SIT' : 'EUR',
  };

  return historicalCurrencies[code] ?? defaultCurrency;
}

function flagForCode(code) {
  const iso2ByIso3 = {
    AUS: 'AU',
    AUT: 'AT',
    BEL: 'BE',
    CAN: 'CA',
    CHL: 'CL',
    COL: 'CO',
    CRI: 'CR',
    CZE: 'CZ',
    DNK: 'DK',
    EST: 'EE',
    FIN: 'FI',
    FRA: 'FR',
    DEU: 'DE',
    GRC: 'GR',
    HUN: 'HU',
    ISL: 'IS',
    IRL: 'IE',
    ISR: 'IL',
    ITA: 'IT',
    JPN: 'JP',
    KOR: 'KR',
    LVA: 'LV',
    LTU: 'LT',
    LUX: 'LU',
    MEX: 'MX',
    NLD: 'NL',
    NZL: 'NZ',
    NOR: 'NO',
    POL: 'PL',
    PRT: 'PT',
    SVK: 'SK',
    SVN: 'SI',
    ESP: 'ES',
    SWE: 'SE',
    CHE: 'CH',
    TUR: 'TR',
    GBR: 'GB',
    USA: 'US',
  };
  const iso2 = iso2ByIso3[code] ?? code.slice(0, 2);

  return [...iso2.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}
