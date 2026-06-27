# Online Game Concurrent Players Dataset

This folder contains a best-effort dataset for a vertical ranking race video about online game concurrent player records.

## Files

- `online_game_concurrent_players_annual.csv`: ranking-race compatible CSV with yearly concurrent-player observations.
- `online_game_peak_by_game_year.csv`: one peak row per `year + game`, keeping the highest value when a game has multiple records in the same year.
- `online_game_top10_by_year.csv`: per-year ranking file derived from `online_game_peak_by_game_year.csv`, capped at 10 rows per year.
- `online_game_all_time_top10.csv`: top 10 games/experiences by highest recorded peak in this dataset.
- `online_game_all_time_top10_excluding_roblox_experiences.csv`: top 10 after excluding rows where `platform_scope=Roblox experience`; platform-wide Roblox is still allowed when separately sourced.
- `online_game_yearly_coverage.csv`: candidate and top-row counts by year.

## CSV Format

The core columns follow the existing ranking-race format:

```csv
year,name,code,region,value,color
```

Extra columns keep the evidence and caveats close to each row:

- `date`: exact or best-known date for the observation. Steam rows use the first day of the peak month.
- `platform_scope`: Steam, Roblox experience, Epic Games ecosystem, PC MOBA, or similar.
- `metric_context`: whether the value is an annual peak, event peak, reported peak, or reported average online count.
- `source_type`: broad source bucket.
- `confidence`: relative confidence for video-production triage.
- `source_url`: row-level source.
- `notes`: short caveat.

## Methodology

## Metric Contract

`value` always means a peak concurrent-player/user count for that game, platform, or experience in that calendar year.

It must not be treated as cumulative users, registered accounts, copies sold, downloads, revenue, DAU, MAU, or total yearly play sessions.

Steam games use SteamCharts `Peak Players` rows and record the highest observed concurrent-player peak for each calendar year. These are the cleanest rows because SteamCharts and SteamDB track public Steam concurrency over time.

League of Legends, Fortnite, CrossFire, Dungeon Fighter Online, and Roblox rows are not continuous annual telemetry. They are official, company-reported, platform-reported, or semi-official/archived public claims. Treat these as dated record snapshots, not fully audited worldwide leaderboards.

Some League of Legends rows use `source_type=estimated_mid_peak_ccu` or `source_type=estimated_min_peak_ccu`. These are estimates, not official Riot annual disclosures. The 2016-2026 video rows use user-provided midpoint estimates from researched annual ranges. They are anchored to public LoL player-count milestones including 2012 5M peak CCU, 2014 7.5M peak CCU, 2016 100M monthly active players, 2019 8M regular peak CCU, and 2021 Riot ecosystem 180M monthly active players.

Platform-wide Roblox rows can also use `source_type=estimated_mid_peak_ccu`. The 2025 row uses a 47.3M midpoint from a 45.0M+ to 47.4M researched range. The 2026 YTD row uses a 36.0M midpoint from a 30.0M to 42.6M researched range; it is not an official Roblox peak disclosure.

Roblox experience rows are kept in the raw research files, but are excluded from the current video Top 10 so the chart does not mix Roblox sub-experiences with standalone games. The video only uses a Roblox row when the observation is platform-wide Roblox concurrency.

Fortnite event rows are especially large because they count live event participation. They should be labeled as event concurrency in the video unless the episode intentionally mixes event peaks with regular gameplay peaks.

Roblox experience rows can dwarf standalone games, especially the 2025-2026 UGC-event records. They are kept out of the current video ranking unless the episode intentionally compares Roblox experiences instead of platform/game-level products.

The top-10 files are generated from the raw observation CSV. If a game has multiple rows in the same year, only the highest `value` is kept before ranking. Earlier years can have fewer than 10 rows because the dataset only includes records with usable public evidence.

Current coverage:

- 2009-2011: early public records only. This is before SteamCharts has broad historical tables and most publishers did not report annual CCU.
- 2012-2026: at least 10 researched non-Roblox-experience candidates per year, so `online_game_top10_by_year.csv` has 10 rows for each of these years.
- 2026: year-to-date, using public data available as of 2026-06-21.

2026 rows are year-to-date values as of 2026-06-21, not final annual peaks. The 2026 audit added Subnautica 2 and Forza Horizon 6 because their launch/Steam peaks were high enough to enter the current video Top 10. Task Bar Hero-style idle/bot-marketplace charts and single-player-only launch records were intentionally excluded.

## Recommended Video Framing

For a clean public video, use one of these angles:

1. "Online Games by Reported Peak Concurrent Players" and keep the current video Top 10, which excludes Roblox experience rows.
2. "Steam Games by Peak Concurrent Players" and filter to `platform_scope=Steam`.
3. "Non-Steam Mega Peaks" and focus on League of Legends, Fortnite, CrossFire, and platform-wide Roblox with clear event labels.

Do not present this mixed dataset as a perfectly audited worldwide annual ranking. The better wording is "reported concurrent-player records by year".

## Key Sources

- SteamCharts: https://steamcharts.com/
- SteamDB Charts: https://steamdb.info/charts/
- Team Fortress 2 SteamCharts: https://steamcharts.com/app/440
- Warframe SteamCharts: https://steamcharts.com/app/230410
- Grand Theft Auto V Legacy SteamCharts: https://steamcharts.com/app/271590
- Rust SteamCharts: https://steamcharts.com/app/252490
- Destiny 2 SteamCharts: https://steamcharts.com/app/1085660
- Path of Exile SteamCharts: https://steamcharts.com/app/238960
- ARK: Survival Evolved SteamCharts: https://steamcharts.com/app/346110
- Rainbow Six Siege SteamCharts: https://steamcharts.com/app/359550
- Unturned SteamCharts: https://steamcharts.com/app/304930
- PAYDAY 2 SteamCharts: https://steamcharts.com/app/218620
- Rocket League SteamCharts: https://steamcharts.com/app/252950
- Among Us SteamCharts: https://steamcharts.com/app/945360
- Goose Goose Duck SteamCharts: https://steamcharts.com/app/1568590
- NARAKA: BLADEPOINT SteamCharts: https://steamcharts.com/app/1203220
- HELLDIVERS 2 SteamCharts: https://steamcharts.com/app/553850
- Once Human SteamCharts: https://steamcharts.com/app/2139460
- The First Descendant SteamCharts: https://steamcharts.com/app/2074920
- Call of Duty SteamCharts: https://steamcharts.com/app/1938090
- V Rising SteamCharts: https://steamcharts.com/app/1604030
- War Thunder SteamCharts: https://steamcharts.com/app/236390
- Garry's Mod SteamCharts: https://steamcharts.com/app/4000
- Left 4 Dead 2 SteamCharts: https://steamcharts.com/app/550
- DayZ SteamCharts: https://steamcharts.com/app/221100
- Counter-Strike SteamCharts: https://steamcharts.com/app/10
- Counter-Strike: Source SteamCharts: https://steamcharts.com/app/240
- Borderlands 2 SteamCharts: https://steamcharts.com/app/49520
- Terraria SteamCharts: https://steamcharts.com/app/105600
- Counter-Strike 2 / CS:GO SteamCharts: https://steamcharts.com/app/730
- Dota 2 SteamCharts: https://steamcharts.com/app/570
- PUBG SteamCharts: https://steamcharts.com/app/578080
- Apex Legends SteamCharts: https://steamcharts.com/app/1172470
- Lost Ark SteamCharts: https://steamcharts.com/app/1599340
- New World SteamCharts: https://steamcharts.com/app/1063730
- Palworld SteamCharts: https://steamcharts.com/app/1623730
- Marvel Rivals SteamCharts: https://steamcharts.com/app/2767030
- League of Legends public history summary: https://en.wikipedia.org/wiki/League_of_Legends
- League of Legends public player-count summary with 2012, 2014, 2016, 2019, and 2021 milestones: https://pt.wikipedia.org/wiki/League_of_Legends
- Dungeon Fighter Online public history summary: https://en.wikipedia.org/wiki/Dungeon_Fighter_Online
- Smilegate public history summary: https://en.wikipedia.org/wiki/Smilegate
- Battlefield 6 launch Steam peak: https://www.tomshardware.com/video-games/pc-gaming/battlefield-6-peaks-at-747-000-concurrent-players-newly-launched-game-ranks-among-the-top-three-most-played-on-steam-today
- ARC Raiders public history summary: https://en.wikipedia.org/wiki/ARC_Raiders
- Fortnite Zero Hour event report: https://www.pcgamer.com/games/third-person-shooter/fortnites-latest-live-event-drew-in-10-5-million-players-to-see-godzilla-hatsune-miku-homer-simpson-and-countless-other-characters-fight-a-giant-squid-man/
- Subnautica 2 launch CCU report: https://www.theverge.com/games/930562/subnautica-2-early-access-launch-steam-pc-epic-games-store-xbox
- Forza Horizon 6 Steam CCU report: https://www.pcgamer.com/games/racing/forza-horizon-6-speeds-into-steams-top-5-most-played-games-with-over-300k-concurrent-players/
- CrossFire profile: https://www.smilegate.com/en/business/game.do
- CrossFire television-series report with player scale: https://variety.com/2020/digital/news/crossfire-tv-series-sony-smilegate-1203504221/
- World of Tanks public history summary: https://en.wikipedia.org/wiki/World_of_Tanks
- Guild Wars 2 public history summary: https://en.wikipedia.org/wiki/Guild_Wars_2
- EVE Online public history summary: https://en.wikipedia.org/wiki/Eve_Online
- EVE Online 2009 PCU report: https://www.wired.com/2009/01/eve-online-tops
- Fortnite Battle Royale public history summary: https://en.wikipedia.org/wiki/Fortnite_Battle_Royale
- Travis Scott Astronomical event: https://www.epicgames.com/site/en-US/news/travis-scott-s-astronomical
- Fortnite Galactus event: https://thewaltdisneycompany.com/fortnites-nexus-war-with-galactus-event-draws-15-3-million-concurrent-players/
- Fortnite Big Bang event: https://www.theverge.com/2023/12/4/23987661/fortnite-big-bang-event-players-queue-issues
- Fortnite Remix Finale event: https://www.espn.com/gaming/story/_/id/42708537/fortnite-remix-finale-event-breaks-concurrent-player-record-snoop-dogg-eminem-ice-spice-juice-wrld
- Roblox peak player count list: https://roblox.fandom.com/wiki/List_of_games_by_peak_player_count
- Roblox peak concurrent users list: https://en.wikipedia.org/wiki/List_of_Roblox_games_by_peak_concurrent_users
- Roblox platform-wide 47.4M CCU report: https://www.gamesradar.com/games/simulation/roblox-is-reportedly-bigger-than-the-entirety-of-steam-with-a-whopping-47-4-million-concurrent-users-almost-exclusively-thanks-to-two-games-steal-a-brainrot-and-grow-a-garden/
