# Country Stock Market Capitalization

Source: World Bank WDI `CM.MKT.LCAP.CD`, sourced from the World Federation of Exchanges.

Definition: end-of-year market capitalization of listed domestic companies in current US dollars.

Generated with:

```bash
yarn data:country-stock-market-cap
```

Files:

- `country_stock_market_cap_annual_wdi.csv`: full country-year panel for 1975-2025. Missing source observations are kept as blank values.
- `country_stock_market_cap_observed_wdi.csv`: observed rows only, ranked within each year by `value_usd`.
- `country_stock_market_cap_top40_video.csv`: top 40 observed countries/economies per year for race videos. `value` is in USD trillions.
- `country_stock_market_cap_coverage.csv`: country coverage and totals by year.
- `country_stock_market_cap.meta.json`: source, generation metadata, method, and caveats.
- `../../src/projects/country-stock-market-cap/generated/countryStockMarketCapEntries.ts`: generated Remotion data used by the country stock-market-cap race video.

Caveats:

- Values are current US dollars, not inflation-adjusted.
- No interpolation, forward fill, or manual correction is applied.
- The country filter follows World Bank economy metadata, so economies such as Hong Kong SAR can appear separately.
