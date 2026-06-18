#!/usr/bin/env python3
"""Collect yearly global market-cap leaders from CompaniesMarketCap.

The script builds a working dataset for a market-cap ranking race:
- current company slugs are collected from CompaniesMarketCap ranking pages
- each company's "End of year Market Cap" history is parsed
- 1996-2025 are sorted by end-of-year market cap
- 2026 uses the latest current market cap from the ranking CSV/page

This is a research scraper, not an exchange-grade data feed.
"""

from __future__ import annotations

import argparse
import csv
import html
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE_URL = "https://companiesmarketcap.com"
OUTPUT_DIR = Path(__file__).resolve().parent
CACHE_DIR = OUTPUT_DIR / ".cmc_cache"
START_YEAR = 1996
END_YEAR = 2026

HISTORICAL_SEED_SLUGS = [
    # Known large historical constituents that may be delisted/acquired
    # and therefore absent from today's global ranking CSV.
    "ntt-docomo",
    "vodafone",
    "nokia",
    "ericsson",
    "deutsche-telekom",
    "telefonica",
    "orange",
    "bt-group",
    "lucent",
    "lucent-technologies",
    "nortel-networks",
    "aol-time-warner",
    "time-warner",
    "worldcom",
    "mci-worldcom",
    "bell-south",
    "bellsouth",
    "sbc-communications",
    "bank-one",
    "pharmacia",
    "wyeth",
    "gillette",
    "merrill-lynch",
    "abn-amro",
    "royal-dutch-shell",
    "gazprom",
    "aig",
    "american-international-group",
    "ubs",
    "lloyds-banking-group",
    "natwest-group",
    "barclays",
    "bbva",
    "bnp-paribas",
    "sanofi",
    "glaxosmithkline",
    "altria",
    "diageo",
]

@dataclass
class Company:
    slug: str
    name: str = ""
    symbol: str = ""
    country: str = ""
    current_rank: int | None = None
    current_market_cap_usd: int | None = None
    history: dict[int, int] = field(default_factory=dict)


def cache_path_for(path_or_url: str) -> Path:
    key = path_or_url
    if key.startswith(BASE_URL):
        key = key[len(BASE_URL) :]
    key = key.strip("/") or "index"
    key = re.sub(r"[^A-Za-z0-9._-]+", "__", key)
    return CACHE_DIR / f"{key}.html"


def fetch_text(path_or_url: str, pause: float, retries: int = 1) -> str | None:
    CACHE_DIR.mkdir(exist_ok=True)
    cache_path = cache_path_for(path_or_url)
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8", errors="replace")

    url = path_or_url if path_or_url.startswith("http") else f"{BASE_URL}{path_or_url}"
    req = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0 Safari/537.36"
            )
        },
    )
    for attempt in range(retries + 1):
        try:
            with urlopen(req, timeout=20) as response:
                body = response.read()
            text = body.decode("utf-8", errors="replace")
            cache_path.write_text(text, encoding="utf-8")
            if pause:
                time.sleep(pause)
            return text
        except (HTTPError, URLError, TimeoutError) as exc:
            if attempt >= retries:
                print(f"warn: failed {url}: {exc}", file=sys.stderr)
                return None
            time.sleep(1 + attempt)
    return None


def strip_tags(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    return html.unescape(value).strip()


def parse_rank_page(page_html: str) -> list[Company]:
    rows = re.findall(r"<tr>(.*?)</tr>", page_html, flags=re.S)
    companies: list[Company] = []
    for row in rows:
        rank_match = re.search(r'class="rank-td[^"]*"[^>]*data-sort="(\d+)"', row)
        href_match = re.search(r'href="/([^"/]+)/marketcap/"', row)
        name_match = re.search(r'<div class="company-name">(.*?)</div>', row, flags=re.S)
        symbol_match = re.search(r'<div class="company-code">.*?</span>(.*?)</div>', row, flags=re.S)
        mcap_match = re.search(r'class="td-right" data-sort="(\d+)"', row)
        country_match = re.search(r'<span class="responsive-hidden">(.*?)</span>', row, flags=re.S)
        if not (rank_match and href_match and name_match and symbol_match):
            continue
        companies.append(
            Company(
                slug=href_match.group(1),
                name=strip_tags(name_match.group(1)),
                symbol=strip_tags(symbol_match.group(1)),
                country=strip_tags(country_match.group(1)) if country_match else "",
                current_rank=int(rank_match.group(1)),
                current_market_cap_usd=int(mcap_match.group(1)) if mcap_match else None,
            )
        )
    return companies


def collect_current_companies(max_rank: int, pause: float) -> dict[str, Company]:
    companies: dict[str, Company] = {}
    page = 1
    while True:
        path = "/" if page == 1 else f"/page/{page}/"
        page_html = fetch_text(path, pause=pause)
        if not page_html:
            break
        page_companies = parse_rank_page(page_html)
        if not page_companies:
            break
        for company in page_companies:
            if company.current_rank and company.current_rank <= max_rank:
                companies[company.slug] = company
        if page_companies[-1].current_rank and page_companies[-1].current_rank >= max_rank:
            break
        page += 1
    return companies


def parse_company_page(slug: str, page_html: str) -> Company | None:
    title_match = re.search(r"<title>(.*?)\s+- Market capitalization", page_html, flags=re.S)
    name_match = re.search(r'<div class="company-name[^"]*">(.*?)<button', page_html, flags=re.S)
    symbol_match = re.search(r'<div class="company-code">(.*?)</div>', page_html, flags=re.S)
    country_match = re.search(
        r'<div class="line1"><a href="/[^"]+">.*?<span class="responsive-hidden">\s*([^<]+)</span></a></div><div class="line2">Country</div>',
        page_html,
        flags=re.S,
    )
    title_name = strip_tags(title_match.group(1)) if title_match else ""
    name = strip_tags(name_match.group(1)) if name_match else title_name
    symbol = strip_tags(symbol_match.group(1)) if symbol_match else ""
    country = strip_tags(country_match.group(1)) if country_match else ""
    history: dict[int, int] = {}

    rows = re.findall(
        r"<tr><td>(20\d{2}|19\d{2})</td><td>\$([0-9,.]+)\s*([TBM])</td>",
        page_html,
        flags=re.S,
    )
    for year_text, value_text, unit in rows:
        year = int(year_text)
        value = float(value_text.replace(",", ""))
        multiplier = {"T": 1_000_000_000_000, "B": 1_000_000_000, "M": 1_000_000}[unit]
        history[year] = int(round(value * multiplier))
    if not history:
        return None

    return Company(slug=slug, name=name, symbol=symbol, country=country, history=history)


def collect_histories(companies: dict[str, Company], pause: float) -> tuple[dict[str, Company], list[str]]:
    missing: list[str] = []
    for index, slug in enumerate(sorted(companies), start=1):
        if index % 25 == 0:
            print(f"history: {index}/{len(companies)}", file=sys.stderr)
        page_html = fetch_text(f"/{slug}/marketcap/", pause=pause)
        if not page_html:
            missing.append(slug)
            continue
        parsed = parse_company_page(slug, page_html)
        if not parsed:
            missing.append(slug)
            continue
        existing = companies[slug]
        existing.history = parsed.history
        if parsed.name and not existing.name:
            existing.name = parsed.name
        if parsed.symbol and not existing.symbol:
            existing.symbol = parsed.symbol
        if parsed.country and not existing.country:
            existing.country = parsed.country
    return companies, missing


def write_outputs(companies: dict[str, Company], missing: list[str]) -> None:
    rows: list[dict[str, str | int]] = []
    for year in range(START_YEAR, END_YEAR + 1):
        scored: list[tuple[int, Company]] = []
        for company in companies.values():
            if year == END_YEAR and company.current_market_cap_usd is not None:
                value = company.current_market_cap_usd
            else:
                value = company.history.get(year)
            if value:
                scored.append((value, company))
        scored.sort(key=lambda item: item[0], reverse=True)
        for rank, (value, company) in enumerate(scored[:40], start=1):
            rows.append(
                {
                    "year": year,
                    "rank": rank,
                    "name": company.name,
                    "symbol": company.symbol,
                    "country": company.country,
                    "slug": company.slug,
                    "market_cap_usd": value,
                    "market_cap_usd_b": round(value / 1_000_000_000, 3),
                    "basis": "latest_current" if year == END_YEAR else "end_of_year",
                    "source": f"{BASE_URL}/{company.slug}/marketcap/",
                }
            )

    output_csv = OUTPUT_DIR / "global_top40_market_cap_by_year_cmc.csv"
    with output_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    race_csv = OUTPUT_DIR / "global_top40_market_cap_race_cmc.csv"
    with race_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["year", "name", "code", "region", "value", "color", "rank", "source"],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "year": row["year"],
                    "name": row["name"],
                    "code": row["symbol"],
                    "region": row["country"],
                    "value": row["market_cap_usd_b"],
                    "color": "",
                    "rank": row["rank"],
                    "source": row["source"],
                }
            )

    coverage_csv = OUTPUT_DIR / "companiesmarketcap_collection_coverage.csv"
    with coverage_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value"])
        writer.writerow(["companies_considered", len(companies)])
        writer.writerow(["companies_with_history", sum(1 for company in companies.values() if company.history)])
        writer.writerow(["missing_history_pages", len(missing)])
        writer.writerow(["missing_slugs", " ".join(missing)])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-rank", type=int, default=600)
    parser.add_argument("--pause", type=float, default=0.08)
    args = parser.parse_args()

    companies = collect_current_companies(args.max_rank, pause=args.pause)
    for slug in HISTORICAL_SEED_SLUGS:
        companies.setdefault(slug, Company(slug=slug))
    print(f"companies to inspect: {len(companies)}", file=sys.stderr)
    companies, missing = collect_histories(companies, pause=args.pause)
    write_outputs(companies, missing)
    print("done", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
