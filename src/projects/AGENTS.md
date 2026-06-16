# Topic Project Instructions

Every child folder under `src/projects/` represents one video topic or reusable topic template.

- Keep topic-specific UI, data config, generated TypeScript data, and local helper logic inside that topic folder.
- Import shared frame constants and Shorts safe-area values from `src/shared/video.ts`.
- Do not place rendered videos, stills, workbooks, or research files in `src/projects/`.
- Match supporting folders by topic name: `data/<topic>/`, `outputs/<topic>/`, `out/<topic>/`, and `public/projects/<topic>/`.
- Register new Remotion compositions from `src/Root.tsx` and add package scripts that write render results to `out/<topic>/`.
- Prefer copying an existing topic pattern into a new folder over overwriting an existing published topic unless the user explicitly asks to retheme that topic.
