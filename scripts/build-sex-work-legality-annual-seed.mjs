import { mkdir, readFile, writeFile } from 'node:fs/promises';

const CURRENT_PATH = 'data/sex-work-legality/current_status_seed_2026.csv';
const EVENTS_PATH = 'data/sex-work-legality/law_change_events_2000_onward.csv';
const OUTPUT_PATH = 'data/sex-work-legality/annual_status_seed_2000_2026.csv';
const START_YEAR = 2000;
const END_YEAR = 2026;

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (quoted) {
      if (char === '"' && nextChar === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }

      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...body] = rows.filter((csvRow) => csvRow.some(Boolean));
  return body.map((csvRow) =>
    Object.fromEntries(headers.map((header, index) => [header, csvRow[index] ?? ''])),
  );
};

const csvEscape = (value) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const currentRows = parseCsv(await readFile(CURRENT_PATH, 'utf8'));
const eventRows = parseCsv(await readFile(EVENTS_PATH, 'utf8'));

const eventsByIso3 = eventRows.reduce((accumulator, event) => {
  if (Number(event.year) > END_YEAR) {
    return accumulator;
  }

  const events = accumulator.get(event.iso3) ?? [];
  events.push(event);
  accumulator.set(event.iso3, events);
  return accumulator;
}, new Map());

for (const events of eventsByIso3.values()) {
  events.sort((a, b) => a.date.localeCompare(b.date));
}

const annualRows = [];

for (const current of currentRows) {
  const events = eventsByIso3.get(current.iso3) ?? [];

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    let bucket = current.video_bucket;
    let basis = 'current_snapshot_backfill';
    let activeEvent = '';

    if (events.length > 0) {
      bucket = events[0].before_bucket;
      basis = 'event_timeline';

      for (const event of events) {
        if (Number(event.year) <= year) {
          bucket = event.jurisdiction === 'National' ? event.after_bucket : 'regional_varies';
          activeEvent = event.change_type;
        }
      }
    }

    annualRows.push({
      year,
      country: current.country,
      iso3: current.iso3,
      videoBucket: bucket,
      currentSnapshotBucket: current.video_bucket,
      basis,
      activeEvent,
      reviewStatus:
        basis === 'event_timeline'
          ? 'event_adjusted_seed_needs_country_review'
          : 'backfilled_from_2026_snapshot_needs_review',
    });
  }
}

const header = [
  'year',
  'country',
  'iso3',
  'video_bucket',
  'current_snapshot_bucket',
  'basis',
  'active_event',
  'review_status',
];

const csv = [
  header.join(','),
  ...annualRows.map((row) =>
    [
      row.year,
      row.country,
      row.iso3,
      row.videoBucket,
      row.currentSnapshotBucket,
      row.basis,
      row.activeEvent,
      row.reviewStatus,
    ]
      .map(csvEscape)
      .join(','),
  ),
].join('\n');

await mkdir('data/sex-work-legality', { recursive: true });
await writeFile(OUTPUT_PATH, `${csv}\n`);

console.log(`Wrote ${annualRows.length} rows to ${OUTPUT_PATH}`);
