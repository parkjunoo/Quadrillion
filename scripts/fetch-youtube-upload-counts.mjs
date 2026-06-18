import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const DEFAULT_ROSTER_FILE = path.resolve('data/youtube-subscriber-race/youtube_creator_roster.csv');
const DATA_DIR = path.resolve('data/youtube-subscriber-race');
const OUTPUT_DIR = path.resolve('outputs/youtube-subscriber-race');
const DEFAULT_START_YEAR = 2005;
const DEFAULT_END_YEAR = new Date().getUTCFullYear();

const main = async () => {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || process.env.YT_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing API key. Run with YOUTUBE_API_KEY=... node scripts/fetch-youtube-upload-counts.mjs',
    );
  }

  const rosterFile = path.resolve(getArgValue('--roster') ?? DEFAULT_ROSTER_FILE);
  const includeAlt = hasFlag('--include-alt');
  const includeAll = hasFlag('--all');
  const startYear = Number(getArgValue('--start-year') ?? DEFAULT_START_YEAR);
  const endYear = Number(getArgValue('--end-year') ?? DEFAULT_END_YEAR);
  const maxPages = Number(getArgValue('--max-pages') ?? Number.POSITIVE_INFINITY);
  const rosterRows = await readCsv(rosterFile);
  const channels = rosterRows.filter((row) =>
    includeAll || row.include_by_default === 'yes' || (includeAlt && row.slot === 'alt')
  );

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const channelSummaries = [];
  const uploadItems = [];
  const uploadYears = [];
  const raceRows = [];

  for (const [index, channel] of channels.entries()) {
    console.log(`${index + 1}/${channels.length} ${channel.display_name} ${channel.handle}`);

    const resolvedChannel = await fetchChannelByHandle(apiKey, channel.handle);
    const uploadsPlaylistId = resolvedChannel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error(`No uploads playlist found for ${channel.display_name} (${channel.handle})`);
    }

    const videos = await fetchUploadsPlaylist({
      apiKey,
      playlistId: uploadsPlaylistId,
      maxPages,
    });
    const yearly = summarizeByYear(videos, startYear, endYear);
    const currentVideoCount = Number(resolvedChannel.statistics?.videoCount ?? videos.length);

    channelSummaries.push({
      code: channel.code,
      name: channel.display_name,
      handle: channel.handle,
      channel_id: resolvedChannel.id,
      uploads_playlist_id: uploadsPlaylistId,
      current_video_count: currentVideoCount,
      fetched_public_uploads: videos.length,
      first_public_upload: videos.at(-1)?.published_at ?? '',
      latest_public_upload: videos[0]?.published_at ?? '',
      source: 'YouTube Data API channels.list + playlistItems.list',
      fetched_at: new Date().toISOString(),
      notes: videos.length === currentVideoCount
        ? 'Fetched public upload playlist count matches channel statistics.videoCount'
        : 'Fetched playlist count may differ from statistics.videoCount because deleted/private/unlisted/channel-section changes can affect public listing',
    });

    for (const video of videos) {
      uploadItems.push({
        code: channel.code,
        name: channel.display_name,
        handle: channel.handle,
        channel_id: resolvedChannel.id,
        video_id: video.video_id,
        published_at: video.published_at,
        year: video.year,
        title: video.title,
        source: 'YouTube Data API playlistItems.list',
      });
    }

    for (const row of yearly) {
      uploadYears.push({
        code: channel.code,
        name: channel.display_name,
        handle: channel.handle,
        region: channel.region,
        year: row.year,
        uploads_in_year: row.uploads_in_year,
        cumulative_public_uploads: row.cumulative_public_uploads,
        current_video_count: currentVideoCount,
        source: 'YouTube Data API playlistItems.list',
        confidence: row.year === endYear ? 'partial_year_observed' : 'observed_public_uploads',
        notes: row.year === endYear
          ? 'Current calendar year is incomplete'
          : 'Counted public uploads by videoPublishedAt year',
      });

      raceRows.push({
        year: row.year,
        date: row.year === endYear ? todayDate() : `${row.year}-12-31`,
        month: row.year === endYear ? new Date().getUTCMonth() + 1 : 12,
        quarter: row.year === endYear ? quarterOfMonth(new Date().getUTCMonth() + 1) : 4,
        name: channel.display_name,
        code: channel.code,
        region: channel.region,
        value: row.cumulative_public_uploads,
        color: channel.color,
        source: 'YouTube Data API playlistItems.list',
        confidence: row.year === endYear ? 'partial_year_observed' : 'observed_public_uploads',
        notes: 'Cumulative public upload count by videoPublishedAt year',
        include_by_default: channel.include_by_default,
      });
    }
  }

  await writeCsv(
    path.join(DATA_DIR, 'youtube_video_uploads_by_year.csv'),
    uploadYears,
    [
      'code',
      'name',
      'handle',
      'region',
      'year',
      'uploads_in_year',
      'cumulative_public_uploads',
      'current_video_count',
      'source',
      'confidence',
      'notes',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'youtube_video_count_annual_race.csv'),
    raceRows,
    [
      'year',
      'date',
      'month',
      'quarter',
      'name',
      'code',
      'region',
      'value',
      'color',
      'source',
      'confidence',
      'notes',
      'include_by_default',
    ],
  );
  await writeCsv(
    path.join(DATA_DIR, 'youtube_video_count_channel_summary.csv'),
    channelSummaries,
    [
      'code',
      'name',
      'handle',
      'channel_id',
      'uploads_playlist_id',
      'current_video_count',
      'fetched_public_uploads',
      'first_public_upload',
      'latest_public_upload',
      'source',
      'fetched_at',
      'notes',
    ],
  );
  await writeCsv(
    path.join(OUTPUT_DIR, 'youtube_video_upload_items.csv'),
    uploadItems,
    [
      'code',
      'name',
      'handle',
      'channel_id',
      'video_id',
      'published_at',
      'year',
      'title',
      'source',
    ],
  );

  console.log(`Wrote ${uploadYears.length} yearly upload rows`);
  console.log(`Wrote ${raceRows.length} cumulative race rows`);
  console.log(`Wrote ${uploadItems.length} raw upload item rows`);
};

const fetchChannelByHandle = async (apiKey, handle) => {
  const query = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    forHandle: handle,
    key: apiKey,
  });
  const response = await fetchJson(`${YOUTUBE_API_BASE}/channels?${query}`);
  const channel = response.items?.[0];

  if (!channel) {
    throw new Error(`Channel not found for handle ${handle}`);
  }

  return channel;
};

const fetchUploadsPlaylist = async ({ apiKey, playlistId, maxPages }) => {
  const videos = [];
  let pageToken = '';
  let page = 0;

  do {
    page += 1;
    const query = new URLSearchParams({
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: '50',
      key: apiKey,
    });

    if (pageToken) {
      query.set('pageToken', pageToken);
    }

    const response = await fetchJson(`${YOUTUBE_API_BASE}/playlistItems?${query}`);

    for (const item of response.items ?? []) {
      const publishedAt = item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? '';

      if (!publishedAt) {
        continue;
      }

      videos.push({
        video_id: item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? '',
        title: item.snippet?.title ?? '',
        published_at: publishedAt,
        year: new Date(publishedAt).getUTCFullYear(),
      });
    }

    pageToken = response.nextPageToken ?? '';
  } while (pageToken && page < maxPages);

  return videos.toSorted((a, b) => b.published_at.localeCompare(a.published_at));
};

const summarizeByYear = (videos, startYear, endYear) => {
  const countByYear = new Map();

  for (const video of videos) {
    countByYear.set(video.year, (countByYear.get(video.year) ?? 0) + 1);
  }

  let cumulative = 0;
  const rows = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const uploadsInYear = countByYear.get(year) ?? 0;
    cumulative += uploadsInYear;
    rows.push({
      year,
      uploads_in_year: uploadsInYear,
      cumulative_public_uploads: cumulative,
    });
  }

  return rows;
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${text}`);
  }

  return JSON.parse(text);
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

const writeCsv = async (filePath, rows, headers) => {
  const body = rows.map((row) => headers.map((header) => csvValue(row[header])).join(','));
  await writeFile(filePath, `${headers.join(',')}\n${body.join('\n')}\n`);
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

const getArgValue = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const hasFlag = (name) => process.argv.includes(name);

const todayDate = () => new Date().toISOString().slice(0, 10);

const quarterOfMonth = (month) => Math.floor((month - 1) / 3) + 1;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
