import { mkdir, writeFile } from 'node:fs/promises';

const SOURCE_URL =
  'https://worldpopulationreview.com/country-rankings/countries-where-prostitution-is-legal';
const OUTPUT_PATH = 'data/sex-work-legality/current_status_seed_2026.csv';
const ACCESSED_DATE = '2026-06-23';

const html = await fetch(SOURCE_URL).then((response) => {
  if (!response.ok) {
    throw new Error(`Failed to fetch WPR current status page: ${response.status}`);
  }

  return response.text();
});

const rowPattern =
  /\[0,\{&quot;country&quot;:\[0,&quot;([^&]+)&quot;\].*?&quot;cca3&quot;:\[0,&quot;([^&]+)&quot;\].*?&quot;countriesWhereProstitutionIsLegal_legality&quot;:\[0,&quot;([^&]*)&quot;\].*?&quot;countriesWhereProstitutionIsLegal_model&quot;:\[0,&quot;([^&]*)&quot;\]/g;

const decodeHtml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&nbsp;', ' ');

const toVideoBucket = ({ legality, model }) => {
  const normalizedModel = model.toLowerCase();

  if (normalizedModel.includes('neo-abolitionism') || normalizedModel.includes('neo-abolition')) {
    return 'buyer_criminalized';
  }

  if (legality === 'Illegal/Legal') {
    return 'regional_varies';
  }

  if (legality === 'Limited Legality' && normalizedModel.includes('/')) {
    return 'regional_varies';
  }

  if (legality === 'Legal') {
    return 'legal_or_partly_legal';
  }

  if (legality === 'Limited Legality') {
    return 'legal_or_partly_legal';
  }

  return 'illegal';
};

const rowsByIso3 = new Map();

for (const match of html.matchAll(rowPattern)) {
  const row = {
    country: decodeHtml(match[1]),
    iso3: decodeHtml(match[2]),
    wprLegality: decodeHtml(match[3]),
    wprModel: decodeHtml(match[4]),
  };

  if (!rowsByIso3.has(row.iso3)) {
    rowsByIso3.set(row.iso3, {
      ...row,
      videoBucket:
        row.iso3 === 'GBR'
          ? 'regional_varies'
          : toVideoBucket({ legality: row.wprLegality, model: row.wprModel }),
      sourceUrl: SOURCE_URL,
      sourceAccessed: ACCESSED_DATE,
      confidence: 'secondary_current_snapshot',
    });
  }
}

const rows = [...rowsByIso3.values()].sort((a, b) =>
  a.country.localeCompare(b.country, 'en'),
);

if (rows.length < 100) {
  throw new Error(`Parsed too few country rows from WPR page: ${rows.length}`);
}

const csvEscape = (value) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const header = [
  'country',
  'iso3',
  'wpr_legality',
  'wpr_model',
  'video_bucket',
  'source_url',
  'source_accessed',
  'confidence',
];

const csv = [
  header.join(','),
  ...rows.map((row) =>
    [
      row.country,
      row.iso3,
      row.wprLegality,
      row.wprModel,
      row.videoBucket,
      row.sourceUrl,
      row.sourceAccessed,
      row.confidence,
    ]
      .map(csvEscape)
      .join(','),
  ),
].join('\n');

await mkdir('data/sex-work-legality', { recursive: true });
await writeFile(OUTPUT_PATH, `${csv}\n`);

const counts = rows.reduce((accumulator, row) => {
  accumulator[row.videoBucket] = (accumulator[row.videoBucket] ?? 0) + 1;
  return accumulator;
}, {});

console.log(`Wrote ${rows.length} rows to ${OUTPUT_PATH}`);
console.log(counts);
