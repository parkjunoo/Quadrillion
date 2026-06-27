# Topic Project Instructions

Every child folder under `src/projects/` represents one video topic or reusable topic template.

- Keep topic-specific UI, data config, generated TypeScript data, and local helper logic inside that topic folder.
- Import shared frame constants and Shorts safe-area values from `src/shared/video.ts`.
- Before adding new repeated frame chrome, headers, footers, metric cards, event cards, or news feeds, check the shared templates in `src/shared/dataVideoFrame.tsx` and `src/shared/priceNewsVideoFrame.tsx`.
- For new data/race Shorts, default to the finalized `FootballMarketValues` slot by using `createDefaultDataShortsFrameGeometry()` from `src/shared/dataVideoFrame.tsx`. Keep the title, left-padded year/timeline rail, chart body, channel tag, and right-aligned source in that slot unless the user explicitly requests a different layout.
- Do not place rendered videos, stills, workbooks, or research files in `src/projects/`.
- Match supporting folders by topic name: `data/<topic>/`, `outputs/<topic>/`, `out/<topic>/`, and `public/projects/<topic>/`.
- Register new Remotion compositions from `src/Root.tsx` and add package scripts that write render results to `out/<topic>/`.
- Prefer copying an existing topic pattern into a new folder over overwriting an existing published topic unless the user explicitly asks to retheme that topic.
- `src/projects/title-intro/` contains the canonical standalone intro for the football market value race. Render it with `yarn render:intro` to `out/title-intro/title-intro.mp4`.
- Do not add the legacy shared `ShortsIntro` overlay back to `src/projects/football-market-values/FootballMarketValueVideo.tsx`; that body composition should start directly on the race and use the standalone `TitleIntro` when an intro is needed.
