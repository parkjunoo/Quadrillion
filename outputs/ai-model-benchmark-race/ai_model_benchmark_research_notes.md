# AI Model Benchmark Race Research Notes

Generated on 2026-06-27 JST.

## Recommended chart axis

Use `data/ai-model-benchmark-race/mmlu_pro_major_models.csv` for the main Shorts race if you want one consistent modern benchmark. It uses Artificial Analysis' MMLU-Pro evaluations and includes release dates, model names, organizations, and scores.

Use `data/ai-model-benchmark-race/mmlu_reported_historical_key_models.csv` only as an early-history supplement for GPT-3/Gopher/Chinchilla/PaLM/GPT-4-era context. Those rows are reported MMLU scores from multiple papers and are less comparable than the Artificial Analysis MMLU-Pro file.

## Files

- `mmlu_pro_artificial_analysis_all.csv`: all parsed MMLU-Pro rows with scores from Artificial Analysis.
- `mmlu_pro_major_models.csv`: curated major frontier/open model release points for a clean bar chart race.
- `mmlu_reported_historical_key_models.csv`: earlier MMLU history, useful for intro/context but not perfectly apples-to-apples.

## Source links

- Artificial Analysis MMLU-Pro leaderboard: https://artificialanalysis.ai/evaluations/mmlu-pro
- Epoch AI Benchmarking Hub: https://epoch.ai/benchmarks
- Epoch data download: https://epoch.ai/benchmarks/use-this-data
- xAI Grok announcement: https://x.ai/news/grok
- xAI Grok-1.5 announcement: https://x.ai/news/grok-1.5

## Caveats

MMLU, MMLU-Pro, and CoT/shot variants must not be mixed under one unlabeled axis. If a video uses both files, visually separate them or add an on-screen label like `Benchmark changes from MMLU to MMLU-Pro`.
