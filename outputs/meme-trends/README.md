# US Meme Trends Research Draft

Scope: monthly US meme candidates from 2016-06 through 2026-05 for a 10-year vertical data video.

Files:

- `data/meme-trends/us_meme_monthly_candidates.csv`: first-pass monthly candidate list.
- `outputs/meme-trends/us_meme_monthly_google_trends_validation.csv`: candidate list with Google Trends validation fields.
- `data/meme-trends/us_2025_meme_candidates_for_video.csv`: 2025-only monthly candidate set for the proposed video layout.
- `outputs/meme-trends/us_2025_meme_trends_for_video.csv`: 2025-only video dataset with KYM vote share, video search query, and placeholder Google Trends fields.

Method:

- 2020-10 onward primarily follows Know Your Meme "Meme of the Month" winner pages and poll archive.
- 2016-06 through 2020-09 uses meme calendar / annual-review style community records plus known US search/culture spikes, and should be treated as a lower-confidence draft until manually reviewed.
- Google Trends validation was run with `geo=US`, timeframe `2016-06-01 2026-05-31`, comparing each candidate query against the anchor term `Harambe`.
- `trend_selected_month_score` is the candidate query's monthly max score in the selected month.
- `trend_peak_month` is the month where that exact query peaked in the same Trends request.
- `trend_validation` values:
  - `peak_matches_month`: selected month matches Google Trends peak month.
  - `near_peak`: selected month is at least 70% of the query peak, or at least 50 on the Trends scale.
  - `month_mismatch`: Google Trends peak is a different month.
  - `insufficient_search_volume`: Trends returned 0 across the period, usually because the query is too niche or phrased differently from public search behavior.

Current validation count:

- `peak_matches_month`: 49
- `near_peak`: 1
- `month_mismatch`: 37
- `insufficient_search_volume`: 33

Important caveats:

- Google Trends values are relative 0-100 indices, not absolute search volume.
- A low or zero Trends value does not mean the meme was absent from Reddit, TikTok, X, Discord, or image-board communities; it means that exact Google query did not have enough measured search volume.
- Some meme names are ambiguous or changed over time. Before rendering, re-query low-volume rows with alternate spellings and platform-specific terms.
- For the final video dataset, prefer a combined score: community source confidence + Google Trends peak alignment + search score, rather than Google Trends alone.

2025 video dataset note:

- The 2025-only file is ready for a layout where the monthly rank-1 meme drives the upper hero video while the remaining candidates feed the lower bar chart.
- The latest Google Trends batch for 2025-only candidate comparisons hit a 429 rate limit, so rows in `outputs/meme-trends/us_2025_meme_trends_for_video.csv` currently have `google_trends_status=rate_limited_not_verified`.
- Until a successful Trends retry, use `kym_vote_share` or `final_score_70kym_30trends` as a KYM-vote-based draft score, not as a verified Google Trends score.
