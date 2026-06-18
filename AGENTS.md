# Agent Notes for Quadrillion

This repository is a Remotion-based vertical data video project. Treat it as a video-generation codebase, not a normal web app.

## Project Purpose

Quadrillion creates 1080x1920 short-form chart videos for YouTube Shorts, Reels, TikTok, and similar vertical platforms.

The current Remotion compositions are:

- `QuadrillionShort`: a CSV-driven FIFA men ranking race video.
- `BitcoinHistory`: a Bitcoin 3-day candlestick history video with event callouts.
- `NasdaqHistory`: a NASDAQ Composite monthly candlestick history video with event cards.

## Core Stack

- Remotion renders React components into video frames.
- React 19 is used for the visual composition layer.
- SVG is used directly for the ranking race line chart.
- TradingView Lightweight Charts is used for candlestick charts.
- TypeScript strict mode is enabled.
- Yarn 4 is the package manager, with `nodeLinker: node-modules`.

## Commands

Use these commands from the repository root:

```bash
yarn dev
yarn typecheck
yarn data:fifa
yarn poster
yarn render
yarn poster:race
yarn render:race
yarn poster:bitcoin
yarn render:bitcoin
yarn render:bitcoin:4k
yarn poster:nasdaq
yarn render:nasdaq
```

Run `yarn typecheck` after code changes. For docs-only changes, typecheck is optional.

## Topic Project Layout

Keep each video topic in its own project folder.

- Source code: `src/projects/<topic>/`
- Topic data: `data/<topic>/`
- Analysis outputs, workbooks, previews: `outputs/<topic>/`
- Rendered stills/videos: `out/<topic>/`
- Static topic assets: `public/projects/<topic>/...`

Shared video constants, frame geometry, and Shorts safe-area values belong in `src/shared/`.

Current topic folders:

- `src/projects/fifa-ranking-race/`
- `src/projects/bitcoin-history/`
- `src/projects/nasdaq-history/`

When adding a new video, create a topic folder and keep its config/data/UI local to that folder. Register the composition in `src/Root.tsx`, import shared frame constants from `src/shared/video.ts`, and add render scripts that write to `out/<topic>/`.

## Shared Video Templates

Use the existing shared templates before creating new per-topic frame chrome, headers, footers, metric cards, or news feeds.

- `src/shared/dataVideoFrame.tsx`: shared vertical data-video frame layout for dark data/race videos. It provides stage/background, header, timeline rail, chart frame, chart-top bar, channel tag, footer, and `createDataVideoFrameGeometry`. The `GlobalMarketCap` composition uses this template. Prefer the centered `76px / 76px` side inset when a new full-width frame should align with the current market-cap template.
- `src/shared/priceNewsVideoFrame.tsx`: shared price/news layout for candlestick and market-history videos. It provides the stage, header, date readout, chart shell, metric card, event news card, and bottom news feed. The `NasdaqHistory` composition uses this template. Reuse `priceNewsTemplate` for shared row height, card size, chart scale width, and feed gaps instead of hard-coding new padding values in topic files.
- Keep topic-specific chart engines, data transforms, event scheduling, and custom overlays inside `src/projects/<topic>/`. If a visual shell pattern is reusable across videos, extend the shared template rather than copying the layout into a topic component.

## Important Files

- `src/index.ts`: Remotion entrypoint.
- `src/Root.tsx`: registers Remotion compositions.
- `src/shared/video.ts`: shared 1080x1920, FPS, aspect ratio, and Shorts safe-area constants.
- `src/shared/dataVideoFrame.tsx`: shared data-video frame layout used by market/race-style videos.
- `src/shared/priceNewsVideoFrame.tsx`: shared price/news frame, metric card, event card, and news feed layout for candlestick history videos.
- `src/projects/fifa-ranking-race/config.ts`: ranking race title, units, duration, source, events, and CSV binding.
- `src/projects/fifa-ranking-race/chartRace.ts`: CSV parsing, snapshot building, frame-by-frame ranking interpolation.
- `src/projects/fifa-ranking-race/ShortsVideo.tsx`: ranking race video UI.
- `src/projects/bitcoin-history/data.ts`: Bitcoin candles, event data, and config.
- `src/projects/bitcoin-history/BitcoinHistoryVideo.tsx`: Bitcoin candlestick video UI, playback schedule, event overlays.
- `src/projects/nasdaq-history/data.ts`: Nasdaq candles/events/config.
- `src/projects/nasdaq-history/NasdaqHistoryVideo.tsx`: Nasdaq candlestick video UI and news cards.
- `README.md`: human-facing project documentation.

## Required Data Format: Ranking Race

Ranking race videos need repeated observations for each item over time. The current FIFA implementation expects CSV text in `chartVideoConfig.csv` from `src/projects/fifa-ranking-race/config.ts`.

Required CSV headers:

```csv
year,name,code,region,value,color
```

Example:

```csv
year,name,code,region,value,color
2026,United States,USA,North America,610,#48C7FF
2026,China,CHN,Asia,675,#FF6B57
2026,India,IND,Asia,238,#F25CFF
```

Field meanings:

- `year`: numeric time point.
- `name`: full display name shown beside the line/bar.
- `code`: stable item ID and short badge label.
- `region`: grouping metadata.
- `value`: numeric value used for ranking and position.
- `color`: hex color for the row/line.

Optional fields currently used by the FIFA project include `date`, `quarter`, `month`, `rank`, `flag`, and `worldCupWins`.

Good use cases:

- countries by investment
- companies by revenue
- channels by subscribers
- coins by market cap
- products by sales

When changing the FIFA ranking race topic, update `chartVideoConfig` in `src/projects/fifa-ranking-race/config.ts`. When creating a new ranking race topic, copy the project pattern into a new `src/projects/<topic>/` folder rather than overwriting the FIFA project unless asked.

## Required Data Format: Candlestick History

Candlestick videos need OHLC time series data.

Expected shape:

```ts
{
  time: "2024-01-10",
  open: 46500,
  high: 48900,
  low: 44800,
  close: 47600
}
```

Field meanings:

- `time`: date string in `YYYY-MM-DD` format.
- `open`: opening price.
- `high`: highest price.
- `low`: lowest price.
- `close`: closing price.

Bitcoin extends the shape with `openUsd`, `highUsd`, `lowUsd`, and `closeUsd` so USD values are preserved while the displayed chart uses KRW.

## Optional Data Format: Events

Event callouts can be attached to time-series videos.

Expected shape:

```ts
{
  date: "2024-01-10",
  title: "Spot ETF approval",
  detail: "US spot Bitcoin ETFs are approved.",
  tone: "bullish"
}
```

Field meanings:

- `date`: event date in `YYYY-MM-DD` format.
- `title`: short headline.
- `detail`: one-sentence explanation for the toast/card.
- `tone`: one of `bullish`, `bearish`, or `neutral`.

## Data Accuracy Rules

- Current FIFA ranking race data is based on FIFA/Coca-Cola men ranking releases and local generated CSV snapshots.
- Current Bitcoin candles are generated from the BTC analysis workbook in `outputs/bitcoin-history/btc-element-analysis/`.
- Current Nasdaq candles are generated from `data/nasdaq-history/nasdaq_monthly_prices.csv`.
- For public videos, verify source, unit, date range, and calculation method before rendering.
- Put the source in the config so it appears in the video footer when relevant.
- Do not present modeled, partial, or locally transformed data as exchange-grade or publication-ready without verification.
- Financial market videos are information visualizations, not financial advice.

## Editing Guidance

- Keep changes scoped to the requested composition, topic folder, or data pipeline.
- Prefer the existing Remotion frame-driven style over adding runtime state.
- Keep video constants explicit, especially dimensions, FPS, duration, and chart geometry.
- Use the shared Shorts safe-area constants in `src/shared/video.ts`; top-anchored UI should account for `SHORTS_PLATFORM_TOP_CLEARANCE`.
- Preserve 1080x1920 vertical layout unless the user asks for a different format.
- Generated render outputs belong in `out/<topic>/`, which is gitignored.
- Analysis workbooks and preview images belong in `outputs/<topic>/`.
- Avoid committing generated videos or stills unless the user explicitly asks.
