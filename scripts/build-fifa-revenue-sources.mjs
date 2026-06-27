import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data/fifa-revenue-sources');
const generatedDir = path.join(rootDir, 'src/projects/fifa-revenue-sources/generated');

const sources = [
  {
    label: 'FIFA Financial Report 2010',
    url: 'https://static.poder360.com.br/2022/11/relatorio-anual-fifa-2010.pdf',
  },
  {
    label: 'FIFA Financial Report 2014',
    url: 'https://web.archive.org/web/20150530072408id_/http://resources.fifa.com/mm/document/affederation/administration/02/56/80/39/fr2014weben_neutral.pdf',
  },
  {
    label: 'FIFA Financial Report 2018',
    url: 'https://digitalhub.fifa.com/m/337fab75839abc76/original/xzshsoe2ayttyquuxhq0-pdf.pdf',
  },
  {
    label: 'FIFA Financial Report 2019',
    url: 'https://digitalhub.fifa.com/m/6b641d4162be6ab4/original/ksndm8om7duu5h8qxlpn-pdf.pdf',
  },
  {
    label: 'FIFA Annual Report 2020',
    url: 'https://digitalhub.fifa.com/m/c01ac2121988dcf/original/FIFA_Annual-Report-2020.pdf',
  },
  {
    label: 'FIFA Annual Report 2021',
    url: 'https://digitalhub.fifa.com/m/7b8f2f002eb69403/original/FIFA-Annual-Report-21.pdf',
  },
  {
    label: 'FIFA Annual Report 2022',
    url: 'https://digitalhub.fifa.com/m/2252cd6dfdadad73/original/FIFA-Annual-Report-2022-Football-Unites-The-World.pdf',
  },
  {
    label: 'FIFA Annual Report 2023 revenue',
    url: 'https://inside.fifa.com/official-documents/annual-report/2023/financials/2023-financials-in-review/2023-revenue',
  },
  {
    label: 'FIFA Annual Report 2024 revenue',
    url: 'https://inside.fifa.com/official-documents/annual-report/2024/financials/2024-financials-in-review/2024-revenue',
  },
  {
    label: 'FIFA Annual Report 2025 revenue',
    url: 'https://inside.fifa.com/official-documents/annual-report/2025/financials/2025-financials-in-review/2025-revenue',
  },
  {
    label: 'FIFA Annual Report 2024 revised 2023-2026 budget',
    url: 'https://inside.fifa.com/official-documents/annual-report/2024/financials/revised-2023-2026-budget',
  },
];

const categories = [
  {
    code: 'TV',
    color: '#38BDF8',
    name: 'TV Rights',
    region: 'Media',
  },
  {
    code: 'MKT',
    color: '#FACC15',
    name: 'Marketing Rights',
    region: 'Sponsorship',
  },
  {
    code: 'TIX',
    color: '#22C55E',
    name: 'Tickets + Hospitality',
    region: 'Matchday',
  },
  {
    code: 'LIC',
    color: '#A78BFA',
    name: 'Licensing Rights',
    region: 'Licensing',
  },
  {
    code: 'OTH',
    color: '#94A3B8',
    name: 'Other Revenue',
    region: 'Other',
  },
];

const annualRowsTUsd = [
  { year: 2007, tv: 524524, mkt: 223398, tix: 0, lic: 19388, oth: 79433, total: 846743 },
  { year: 2008, tv: 555484, mkt: 253406, tix: 40000, lic: 15105, oth: 70687, total: 934682 },
  { year: 2009, tv: 649957, mkt: 277266, tix: 40500, lic: 10184, oth: 65913, total: 1043820 },
  { year: 2010, tv: 717978, mkt: 342936, tix: 40000, lic: 26100, oth: 109896, total: 1236910 },
  { year: 2011, tv: 550286, mkt: 381245, tix: 15111, lic: 12475, oth: 81283, total: 1040400 },
  { year: 2012, tv: 560852, mkt: 370099, tix: 12000, lic: 23061, oth: 111451, total: 1077463 },
  { year: 2013, tv: 629980, mkt: 412772, tix: 47163, lic: 25696, oth: 187534, total: 1303145 },
  { year: 2014, tv: 742638, mkt: 465084, tix: 110637, lic: 54230, oth: 615196, total: 1987785 },
  { year: 2015, tv: 258496, mkt: 157244, tix: 0, lic: 50499, oth: 78135, total: 544374 },
  { year: 2016, tv: 95612, mkt: 114574, tix: 0, lic: 204485, oth: 87025, total: 501696 },
  { year: 2017, tv: 228645, mkt: 245277, tix: 22368, lic: 160211, oth: 77701, total: 734202 },
  { year: 2018, tv: 2543968, mkt: 1143312, tix: 689143, lic: 184573, oth: 79958, total: 4640954 },
  { year: 2019, tv: 342602, mkt: 164848, tix: 7931, lic: 159527, oth: 90766, total: 765674 },
  { year: 2020, tv: 1724, mkt: 74450, tix: 0, lic: 158881, oth: 31486, total: 266541 },
  { year: 2021, tv: 123119, mkt: 131387, tix: 12172, lic: 180202, oth: 319608, total: 766488 },
  { year: 2022, tv: 2958352, mkt: 1424524, tix: 929016, lic: 270397, oth: 186924, total: 5769213 },
  { year: 2023, tv: 267220, mkt: 455916, tix: 80157, lic: 181177, oth: 185179, total: 1169649 },
  { year: 2024, tv: 39141, mkt: 303856, tix: 0, lic: 47731, oth: 91938, total: 482666 },
  { year: 2025, tv: 1044451, mkt: 964975, tix: 410496, lic: 97380, oth: 144102, total: 2661404 },
  { year: 2026, tv: 3925000, mkt: 1786000, tix: 3017000, lic: 111000, oth: 72000, total: 8911000, forecast: true },
];

const valueByCategory = {
  LIC: 'lic',
  MKT: 'mkt',
  OTH: 'oth',
  TIX: 'tix',
  TV: 'tv',
};

const csvRows = [
  [
    'year',
    'name',
    'code',
    'region',
    'value',
    'color',
    'totalValue',
    'forecast',
  ],
];

for (const annualRow of annualRowsTUsd) {
  for (const category of categories) {
    const valueKey = valueByCategory[category.code];

    csvRows.push([
      annualRow.year,
      category.name,
      category.code,
      category.region,
      Math.round(annualRow[valueKey] * 1000),
      category.color,
      Math.round(annualRow.total * 1000),
      annualRow.forecast ? 'true' : 'false',
    ]);
  }
}

const csv = `${csvRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
const generatedTs = `export const fifaRevenueSourcesCsv = ${JSON.stringify(csv)};\n`;
const metadataJson = `${JSON.stringify({ sources, unit: 'USD', generatedFromUnit: 'TUSD' }, null, 2)}\n`;

await mkdir(dataDir, { recursive: true });
await mkdir(generatedDir, { recursive: true });
await writeFile(path.join(dataDir, 'fifa_revenue_sources_annual.csv'), csv);
await writeFile(path.join(dataDir, 'sources.json'), metadataJson);
await writeFile(path.join(generatedDir, 'fifaRevenueSourcesCsv.ts'), generatedTs);

console.log(`Wrote ${csvRows.length - 1} rows to data/fifa-revenue-sources/fifa_revenue_sources_annual.csv`);
console.log('Wrote src/projects/fifa-revenue-sources/generated/fifaRevenueSourcesCsv.ts');

function csvEscape(value) {
  const text = String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
