import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROSTER_FILE = path.resolve('data/youtube-subscriber-race/youtube_creator_roster.csv');
const AVATAR_DIR = path.resolve('public/projects/youtube-subscriber-race/avatars');

const main = async () => {
  const rows = (await readCsv(ROSTER_FILE)).filter((row) => row.include_by_default === 'yes');

  await mkdir(AVATAR_DIR, { recursive: true });

  for (const row of rows) {
    const channelUrl = `https://www.youtube.com/${row.handle}`;
    console.log(`Fetching ${row.code} ${channelUrl}`);

    const html = await fetchText(channelUrl);
    const avatarUrl = firstAvatarUrl(html);

    if (!avatarUrl) {
      console.warn(`No avatar URL found for ${row.display_name} (${row.handle})`);
      continue;
    }

    const imageResponse = await fetch(avatarUrl, {
      headers: { 'user-agent': userAgent },
    });

    if (!imageResponse.ok) {
      console.warn(`Avatar download failed for ${row.display_name}: ${imageResponse.status}`);
      continue;
    }

    const outputPath = path.join(AVATAR_DIR, `${row.code.toLowerCase()}.jpg`);
    await writeFile(outputPath, Buffer.from(await imageResponse.arrayBuffer()));
    console.log(`Wrote ${outputPath}`);
  }
};

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} ${url}`);
  }

  return response.text();
};

const firstAvatarUrl = (html) => {
  const matches = [...html.matchAll(/https:\/\/yt3\.googleusercontent\.com\/[^"\\]+/g)];
  const url = matches[0]?.[0];

  if (!url) {
    return '';
  }

  return url
    .replace(/\\u0026/g, '&')
    .replace(/=s\d+-c-k-c0x00ffffff-no-rj(?:-mo)?/, '=s176-c-k-c0x00ffffff-no-rj');
};

const readCsv = async (filePath) => parseCsv(await readFile(filePath, 'utf8'));

const parseCsv = (csv) => {
  const [headerLine, ...bodyLines] = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine);

  return bodyLines.map((line) => {
    const columns = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? '']));
  });
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
