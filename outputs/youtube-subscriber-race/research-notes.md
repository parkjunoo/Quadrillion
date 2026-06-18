# YouTube Subscriber Race Research Notes

Snapshot date: 2026-06-17

## Current Baseline

SocialBlade's global subscriber top list and individual profile pages do not always share the same cache timestamp. For production, use the individual profile/API value as the current endpoint, then preserve the page URL and collection date.

The user's proposed list is not the same as SocialBlade's all/global Top 10. As of this snapshot, SocialBlade's all/global top list includes MrBeast, T-Series, Cocomelon, YouTube Movies, SET India, Vlad and Niki, Stokes Twins, Kids Diana Show, KimPro KIMPRO, and Like Nastya. The curated creator race keeps the user's named channels and uses Vlad and Niki as the default slash-choice, with Like Nastya kept as an alternate.

## Recommended Data Window

Use monthly or year-end snapshots from 2016 through 2026. Monthly data will render more smoothly, but the final CSV can still expose `year` for the existing ranking-race parser.

Suggested final rows:

```csv
year,date,month,quarter,name,code,region,value,color,source,confidence,notes
2026,2026-06-17,6,2,MrBeast,MRB,United States,502000000,#00A7FF,SocialBlade profile,observed_rounded,Public subscriber counts are rounded
```

## Source Stack

1. Current values: YouTube Data API `channels.list` with `part=snippet,statistics` and `forHandle` or resolved channel IDs.
2. Recent 14-day public check: SocialBlade profile pages. These expose rounded public subscriber counts, views, videos, and recent daily rows.
3. Recent 1-3 years: SocialBlade Business API if paid access is acceptable. SocialBlade says its API provides historical/statistical profile data and up to 3 years of daily historical performance data for YouTube creators.
4. Long history: TubeCensus for Wayback-derived longitudinal subscriber counts, especially 2016-2023.
5. Fallback long history: Internet Archive CDX API directly. Query all known channel URL forms, fetch one month-end capture per channel, and parse YouTube's embedded subscriber text where available.
6. Cross-check anchors: public milestone announcements, YouTube Creator Awards dates, news articles, Wikipedia page histories, and creator posts. Use these as constraints, not as exact monthly counts.
7. Recent growth context: ViewStats top lists and gained-subscriber filters are useful for validating velocity, but treat dynamic pages as a manual/provider source unless an export/API is available.

## Collection Algorithm

1. Resolve every channel to a canonical channel ID with the YouTube Data API.
2. Store a daily current snapshot going forward: `date,channel_id,handle,subscriber_count,view_count,video_count,source`.
3. Pull provider history where licensed: SocialBlade API, ViewStats export/API, ChannelCrawler, or similar.
4. Pull TubeCensus/Wayback history for 2016-2023.
5. Normalize to month-end rows. If no exact month-end snapshot exists, choose the nearest observation within 14 days and mark it `observed_nearest`.
6. Fill short gaps only with monotonic linear interpolation and mark them `interpolated`.
7. Use milestone/news dates as validation: if interpolation crosses 100M before the public 100M milestone, inspect the surrounding source rows.
8. Export the video-ready CSV with `value` as raw subscribers and `confidence` preserved for audit.

## Confidence Labels

- `current_api`: direct YouTube Data API value, rounded by public API policy.
- `observed_rounded`: observed on SocialBlade, ViewStats, YouTube page, or provider profile.
- `observed_wayback`: extracted from archived YouTube/SocialBlade page.
- `observed_nearest`: nearest snapshot used for a month-end/year-end point.
- `milestone_anchor`: event/news/milestone point used as a constraint.
- `interpolated`: calculated between known observations; do not present as exact.

## Production Notes

Add a footer such as: "Subscribers are public rounded counts; historical values are reconstructed from provider and archive snapshots."

For the video story, useful event cards include PewDiePie vs T-Series, MrBeast passing PewDiePie, MrBeast passing T-Series, MrBeast 300M/400M/500M, KimPro passing 100M, Alan's Universe passing 100M, and major Shorts-era growth bursts.

## Draft Annual Dataset Added

Created `data/youtube-subscriber-race/youtube_subscribers_annual_2016_2026_draft.csv` as a video-production draft, not a publication-grade historical dataset.

The file mixes three kinds of values:

- `observed_rounded`: direct current/profile numbers from SocialBlade or public profile text.
- `milestone_anchor`: public milestone dates such as 50M, 100M, 200M, 300M, or creator award years.
- `estimated_between_anchors`: year-end values interpolated between public milestones.

Before final rendering, replace `estimated_between_anchors` values with TubeCensus, SocialBlade Business API, ChannelCrawler, ViewStats export, or Wayback-derived observations where possible.

## Collection Pass v0.2

This pass collected a complete annual 2016-2026 subscriber trend table for the curated race roster. The default race uses 10 channels and keeps `Like Nastya` as an alternate row set because the user's slash-choice was "Like Nastya / Vlad and Niki"; filter `include_by_default=yes` for the default race.

The 2026 rows are current rounded public counts checked from SocialBlade profile/top-list pages on 2026-06-17. Earlier rows are reconstructed from public milestones, creator award dates, public profile text, news articles, and monotonic interpolation between those anchors. The most uncertain rows are marked `estimated_between_anchors`; they are good enough for rough bar-chart-race motion, but should not be narrated as exact year-end subscriber totals.

Key public anchors used:

- MrBeast: 100M on 2022-07-28, 200M on 2023-10-15, 300M on 2024-07-10, 400M on 2025-06-01, current SocialBlade profile around 502M.
- T-Series: 50M on 2018-09-10, 100M on 2019-05-29, 200M around 2021-11/12, current SocialBlade profile around 312M.
- PewDiePie: 50M on 2016-12-08, 100M on 2019-08-25, then mostly flat around 110M.
- Vlad and Niki: channel launch in 2018, 100M on 2023-08-13, public profile text around 147M in 2025, current SocialBlade profile around 150M.
- Stokes Twins: joint channel launch in 2017, about 4M within two years, 100M on 2024-11-30, about 128-129M in mid/late 2025, current SocialBlade profile around 140M.
- KimPro KIMPRO: first video in 2022, 100M in April 2025, current SocialBlade profile around 133M.
- Alan's Universe: channel launch in 2020, profile references about 57M in 2024, 100M on 2026-03-12, current SocialBlade profile around 101M.
- A4: 2016 viral growth from about 200K to 1M, public profile text around 49.7M in Dec 2023, current SocialBlade profile around 92.6M.
- Mark Rober: public creator profile/news anchors plus 2024 MrBeast-event shirt reference around 50M, current SocialBlade profile around 78.5M.
- Dude Perfect: mature large-channel estimates around the 50M custom-award era, current SocialBlade profile around 62.3M.
- Like Nastya: 100K/1M/10M/50M/100M creator award anchors, about 120M in Oct 2024 profile text, current SocialBlade profile around 132M.

For a higher-confidence production pass, the next upgrade should be provider/API replacement in this order: SocialBlade Business API for 2023-2026 daily/monthly rows, TubeCensus/Wayback for 2016-2023, then YouTube Data API daily collection going forward.

## Channel Start / Event Detail Pass

Added two detail files for story and source audit:

- `data/youtube-subscriber-race/youtube_channel_start_details.csv`: one row per channel with channel-created date, brand/joint-channel start date, first upload/public-video period, content category, breakthrough context, and source URLs.
- `data/youtube-subscriber-race/youtube_channel_event_timeline.csv`: event-level timeline rows for channel starts, first uploads, subscriber milestones, rank changes, breakout moments, and current rounded counts.

Important caveats:

- Some channels have separate "account created" and "brand started" dates. Stokes Twins is the clearest example: SocialBlade/profile history has an older created-on date, while the public creator story points to the joint channel starting on 2017-03-11.
- Like Nastya also needs careful handling because family-channel start references and current handle/profile metadata may not describe the exact same canonical channel URL. The detail file uses the Wikipedia family-channel start as the story start and flags it as medium confidence.
- KIMPRO's Wikipedia page has maintenance warnings. The start/first-upload/100M facts are useful anchors, but they deserve second-source confirmation before being narrated as definitive.
- Alan's Universe has strong public career references, but the exact channel-created date is from the SocialBlade profile snapshot rather than the Wikipedia prose.

For production narration, prefer exact wording like "started posting", "channel launched", or "joint channel began" instead of using a single universal phrase for every creator.

## Yearly Video Upload Count Plan

Yes, yearly video counts can be collected more cleanly than historical subscriber counts if a YouTube Data API key is available.

Added `scripts/fetch-youtube-upload-counts.mjs` for this. It uses:

1. `channels.list(part=snippet,statistics,contentDetails&forHandle=...)` to resolve each handle, read the current `statistics.videoCount`, and get `contentDetails.relatedPlaylists.uploads`.
2. `playlistItems.list(part=snippet,contentDetails&playlistId=...&maxResults=50)` to page through the uploads playlist and read each video's `contentDetails.videoPublishedAt`.
3. Year grouping by `videoPublishedAt` to produce both yearly uploads and cumulative public upload counts.

Expected outputs after running with an API key:

- `data/youtube-subscriber-race/youtube_video_uploads_by_year.csv`: one row per channel-year with `uploads_in_year` and `cumulative_public_uploads`.
- `data/youtube-subscriber-race/youtube_video_count_annual_race.csv`: race-ready cumulative public video count rows using the same `year,date,month,quarter,name,code,region,value,color` shape.
- `data/youtube-subscriber-race/youtube_video_count_channel_summary.csv`: current API `videoCount`, fetched public upload count, first/latest public upload dates, and audit notes.
- `outputs/youtube-subscriber-race/youtube_video_upload_items.csv`: raw public upload items with `video_id`, `published_at`, `year`, and title.

Command:

```bash
YOUTUBE_API_KEY=YOUR_API_KEY node scripts/fetch-youtube-upload-counts.mjs
```

Useful options:

```bash
YOUTUBE_API_KEY=YOUR_API_KEY node scripts/fetch-youtube-upload-counts.mjs --include-alt
YOUTUBE_API_KEY=YOUR_API_KEY node scripts/fetch-youtube-upload-counts.mjs --all
YOUTUBE_API_KEY=YOUR_API_KEY node scripts/fetch-youtube-upload-counts.mjs --start-year 2005 --end-year 2026
YOUTUBE_API_KEY=YOUR_API_KEY node scripts/fetch-youtube-upload-counts.mjs --max-pages 2
```

Caveat: this counts videos currently visible in the uploads playlist. Private, deleted, removed, merged, or otherwise unavailable uploads may not be recoverable from the public API, so `statistics.videoCount` can differ from the playlist item count. For a video, this is still a much stronger source than estimating yearly upload counts from third-party profile pages.
