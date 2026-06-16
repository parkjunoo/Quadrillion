# Agent Notes for Quadrillion

This repository is a Remotion-based vertical data video project. Future agents should treat it as a video-generation codebase, not a normal web app.

## Project Purpose

Quadrillion creates 1080x1920 short-form chart videos for YouTube Shorts, Reels, TikTok, and similar vertical platforms.

The current Remotion compositions are:

- `QuadrillionShort`: a CSV-driven ranking race video.
- `BitcoinHistory`: a Bitcoin daily candlestick history video with event callouts.

## Core Stack

- Remotion renders React components into video frames.
- React 19 is used for the visual composition layer.
- Recharts is used for the ranking race coordinate system.
- TradingView Lightweight Charts is used for candlestick charts.
- TypeScript strict mode is enabled.
- Yarn 4 is the package manager, with `nodeLinker: node-modules`.

## Commands

Use these commands from the repository root:

```bash
yarn dev
yarn typecheck
yarn poster
yarn render
yarn poster:race
yarn render:race
yarn poster:bitcoin
yarn render:bitcoin
```

Run `yarn typecheck` after code changes. For docs-only changes, typecheck is optional.

## Important Files

- `src/index.ts`: Remotion entrypoint.
- `src/Root.tsx`: registers Remotion compositions.
- `src/script.ts`: shared video constants and ranking race CSV/config.
- `src/chartRace.ts`: CSV parsing, snapshot building, frame-by-frame ranking interpolation.
- `src/ShortsVideo.tsx`: ranking race video UI.
- `src/bitcoinHistoryData.ts`: Bitcoin sample candles/events and config.
- `src/BitcoinHistoryVideo.tsx`: candlestick video UI, playback schedule, event overlays.
- `README.md`: human-facing project documentation.

## Required Data Format: Ranking Race

Ranking race videos need repeated observations for each item over time. The current implementation expects CSV text in `chartVideoConfig.csv`.

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

- `year`: numeric time point. The current UI labels this as a year.
- `name`: full display name shown beside the bar.
- `code`: stable item ID and short badge label.
- `region`: grouping metadata. It is parsed and preserved even if not always displayed.
- `value`: numeric value used for ranking and bar length.
- `color`: hex color for the row/bar.

Good use cases:

- countries by investment
- companies by revenue
- channels by subscribers
- coins by market cap
- products by sales

When changing the ranking race topic, update `chartVideoConfig` in `src/script.ts`.

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

The current Bitcoin data is generated from modeled anchor prices in `src/bitcoinHistoryData.ts`. It is prototype data, not production market data. For real publishing, replace it with verified daily BTC CSV/API data and preserve the OHLC shape.

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
- `detail`: one-sentence explanation for the toast.
- `tone`: one of `bullish`, `bearish`, or `neutral`.

Events are used by `BitcoinHistoryVideo.tsx` to pause playback, show toast text, and display an open-to-close overlay.

## Data Accuracy Rules

- Current ranking race data is sample prototype data.
- Current Bitcoin candles are modeled sample data, not exchange-grade candles.
- For public videos, verify source, unit, date range, and calculation method before rendering.
- Put the source in the config so it appears in the video footer when relevant.
- Do not present modeled data as real historical or financial data.

## Editing Guidance

- Keep changes scoped to the requested composition or data pipeline.
- Prefer the existing Remotion frame-driven style over adding runtime state.
- Keep video constants explicit, especially dimensions, FPS, duration, and chart geometry.
- Use the shared Shorts safe-area constants in `src/script.ts`; top-anchored UI should account for `SHORTS_PLATFORM_TOP_CLEARANCE` so YouTube Shorts controls do not cover the composition.
- Preserve 1080x1920 vertical layout unless the user asks for a different format.
- Generated render outputs belong in `out/`, which is gitignored.
- Avoid committing generated videos or stills unless the user explicitly asks.
