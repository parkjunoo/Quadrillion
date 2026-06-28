import { aiModelBenchmarkCsv } from './generated/mmluProMajorModelsCsv';

export type AiModelBenchmarkVideoConfig = {
  csv: string;
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  postRaceHoldSeconds: number;
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
  topN: number;
  valueColumnLabel: string;
  zoomOutSeconds: number;
};

export const aiModelBenchmarkVideoConfig: AiModelBenchmarkVideoConfig = {
  csv: aiModelBenchmarkCsv,
  durationInSeconds: 38,
  endHoldSeconds: 2,
  fps: 60,
  postRaceHoldSeconds: 1,
  source: 'Source: Artificial Analysis historical seed + Vals AI MMLU-Pro overall, updated 2026-06-17',
  startHoldSeconds: 1,
  subtitle: 'MMLU-Pro score by model release month - through Jun 2026',
  title: 'AI Model Benchmark Race',
  titleHook: 'Who Takes The Lead?',
  topN: 7,
  valueColumnLabel: 'MMLU-PRO SCORE',
  zoomOutSeconds: 1,
} as const;
