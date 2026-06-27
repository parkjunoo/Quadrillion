# Sex Work Legality Data Seed

This folder is a research seed for a vertical map video showing how adult consensual
commercial sex work laws changed by country from 2000 onward.

## Important scope

This is not legal advice. The data is for information visualization and must be
verified before publishing. It excludes trafficking, coercion, minors, and sexual
exploitation crimes, which are illegal in jurisdictions that otherwise permit some
forms of adult sex work.

Country laws are often not binary. A country can allow selling and buying sex while
criminalizing brothels, public solicitation, advertising, third-party facilitation,
or work by migrants. Some countries also vary by state, province, territory, or
municipality.

## Video buckets

- `legal_or_partly_legal`: adult sale and purchase are generally not criminalized,
  or legal under regulation, though related activities may be illegal.
- `buyer_criminalized`: selling may not be criminalized, but purchasing sex is
  criminalized nationally or in the noted jurisdiction.
- `illegal`: the transaction or selling itself is criminalized in the source
  snapshot.
- `regional_varies`: national map color should indicate mixed state/province/local
  law rather than a single national rule.
- `illegal_or_unclear`: only used as an event baseline when the starting condition
  still needs source verification.

For a simple Shorts map, use green for `legal_or_partly_legal`, red for `illegal`
and `buyer_criminalized`, and yellow for `regional_varies`. For a more accurate
map, keep `buyer_criminalized` as its own color.

## Files

- `current_status_seed_2026.csv`: current country snapshot generated from World
  Population Review's 2026 table. Treat as a secondary source, not final authority.
  The generator maps mixed internal legal models and the United Kingdom's Northern
  Ireland split to `regional_varies`.
- `law_change_events_2000_onward.csv`: manually curated law-change events from
  2000 onward, with source URLs and confidence notes.
- `annual_status_seed_2000_2026.csv`: generated annual grid for map playback.
  It backfills from the 2026 snapshot and applies known law-change events. Treat
  every backfilled row as a draft until verified.

## Rebuild current snapshot

```bash
node scripts/fetch-sex-work-legality-current.mjs
node scripts/build-sex-work-legality-annual-seed.mjs
```

## Primary sources still needed before render

1. Replace secondary-source rows in `law_change_events_2000_onward.csv` with
   official statute/government sources where possible.
2. Decide whether the video headline means "adult sale and purchase are both
   legal" or "some adult sex work is legal but restricted".
3. Decide how to color countries with subnational law variation: Australia, Mexico,
   United States, Nigeria, and other federations.
4. Cross-check the source date of every country that will be highlighted in the
   voiceover or caption.

## Core sources used

- NSWP Global Mapping of Sex Work Laws: https://www.nswp.org/sex-work-laws-map
- IDS Sex Work Law Map archive: https://archive.ids.ac.uk/spl/sexworklaw/countries.html
- World Population Review 2026 table: https://worldpopulationreview.com/country-rankings/countries-where-prostitution-is-legal
- Canadian Parliament overview: https://lop.parl.ca/sites/PublicWebsite/default/en_CA/ResearchPublications/202221E
