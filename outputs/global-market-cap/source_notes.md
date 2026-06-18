# Global Market Cap Top 40 Data Notes

Generated on 2026-06-17.

## Files

- `global_top40_market_cap_by_year_cmc.csv`
  - Raw annual top 40 table.
  - Columns include year, rank, name, symbol, country, market cap in USD, market cap in USD billions, basis, and source URL.
- `global_top40_market_cap_race_cmc.csv`
  - Remotion ranking-race shaped table.
  - `value` is market cap in USD billions.
- `companiesmarketcap_collection_coverage.csv`
  - Collection coverage and missing seed slugs.
- `collect_companiesmarketcap.py`
  - Re-runnable scraper/parser.

## Basis

- 1996-2025: CompaniesMarketCap company-level "End of year Market Cap" tables.
- 2026: latest current CompaniesMarketCap global ranking snapshot at collection time.
- Scope: CompaniesMarketCap global ranking entries, including SpaceX. Note that SpaceX is a private-company valuation rather than a public listed-company market cap.

## Coverage

- Current top 600 CompaniesMarketCap slugs were collected.
- Additional historical seed slugs were added for large older companies and delisted/acquired names.
- 616 companies had parsed end-of-year history.
- Missing seed slugs remain in `companiesmarketcap_collection_coverage.csv`.

## Verification Notes

- This is a video research dataset, not exchange-grade or investment data.
- SpaceX should be labeled carefully in the video because its value is a private-company valuation, not a stock-market capitalization from public shares.
- Market cap rankings are highly sensitive to snapshot date. The 1996-2000 rankings here use end-of-year values, so they will differ from Financial Times snapshot-date tables.
- Before publishing, cross-check the opening years, especially 1996-2005, against Financial Times Global 500 / Wikipedia-derived historical tables for missing acquired or bankrupt companies.
