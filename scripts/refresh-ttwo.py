#!/usr/bin/env python3
"""Refresh TTWO daily closes and the near-live quote snapshot.

Run locally or from GitHub Actions. The website never calls Yahoo/Nasdaq
in the browser (CORS + terms). This script writes static JSON for Pages.

Usage:
  python3 scripts/refresh-ttwo.py           # history + quote
  python3 scripts/refresh-ttwo.py --quote   # quote only (and append today's close if official)
"""
from __future__ import annotations

import argparse
import json
import ssl
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "data" / "ttwo-daily.json"
LATEST = ROOT / "data" / "ttwo-latest.json"
YAHOO_HISTORY = (
    "https://query1.finance.yahoo.com/v8/finance/chart/TTWO"
    "?interval=1d&range=2y&events=div%7Csplit"
)
YAHOO_QUOTE = (
    "https://query1.finance.yahoo.com/v8/finance/chart/TTWO"
    "?interval=1m&range=1d&includePrePost=true"
)
NASDAQ = (
    "https://api.nasdaq.com/api/quote/TTWO/historical"
    "?assetclass=stocks&fromdate={fromdate}&todate={todate}"
)
UA = "Mozilla/5.0 (compatible; LCAITECH-gta6-vs-acciones/1.1; educational snapshot)"
NY = ZoneInfo("America/New_York")
ART = ZoneInfo("America/Buenos_Aires")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return resp.read()


def fmt_art(dt: datetime) -> str:
    local = dt.astimezone(ART)
    return local.strftime("%d/%m/%Y %H:%M")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def market_state(meta: dict, now_ts: int) -> str:
    periods = (meta.get("currentTradingPeriod") or {})
    for name in ("pre", "regular", "post"):
        block = periods.get(name) or {}
        start, end = block.get("start"), block.get("end")
        if start is not None and end is not None and start <= now_ts < end:
            return {"pre": "PRE", "regular": "REGULAR", "post": "POST"}[name]
    return "CLOSED"


def from_yahoo_history() -> dict[str, dict]:
    raw = json.loads(fetch(YAHOO_HISTORY))
    result = raw["chart"]["result"][0]
    ts = result["timestamp"]
    closes = result["indicators"]["quote"][0]["close"]
    adj = result["indicators"].get("adjclose", [{}])[0].get("adjclose")
    rows = {}
    for i, t in enumerate(ts):
        c = closes[i]
        if c is None:
            continue
        d = datetime.fromtimestamp(t, tz=NY).date().isoformat()
        rec = {"date": d, "close": round(float(c), 2)}
        if adj and adj[i] is not None:
            rec["adjClose"] = round(float(adj[i]), 2)
        rows[d] = rec
    return rows


def from_nasdaq() -> dict[str, dict]:
    today = datetime.now(NY).date()
    try:
        start = today.replace(year=today.year - 1)
    except ValueError:
        start = today.replace(year=today.year - 1, day=28)
    url = NASDAQ.format(fromdate=start.isoformat(), todate=today.isoformat())
    raw = json.loads(fetch(url))
    table = (raw.get("data") or {}).get("tradesTable") or {}
    out = {}
    for r in table.get("rows") or []:
        m, d, y = r["date"].split("/")
        iso = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
        close = round(float(r["close"].replace("$", "").replace(",", "")), 2)
        out[iso] = {"date": iso, "close": close}
    return out


def write_daily(rows: list[dict], today: str) -> None:
    payload = {
        "symbol": "TTWO",
        "name": "Take-Two Interactive Software, Inc.",
        "currency": "USD",
        "exchange": "NASDAQ",
        "snapshotDate": today,
        "snapshotTimezone": "America/Buenos_Aires",
        "lastCloseDate": rows[-1]["date"],
        "lastClose": rows[-1]["close"],
        "firstDate": rows[0]["date"],
        "source": (
            f"Snapshot of daily official closes compiled {today} from Yahoo Finance "
            "chart API, cross-checked against Nasdaq historical quotes when available. "
            "Bundled at build time / GitHub Actions. Not a live data feed and not for trading."
        ),
        "sources": [
            {"name": "Yahoo Finance chart", "url": "https://finance.yahoo.com/quote/TTWO/history/", "role": "daily closes"},
            {"name": "Nasdaq historical quotes", "url": "https://www.nasdaq.com/market-activity/stocks/ttwo/historical", "role": "cross-check"},
            {"name": "Take-Two IR Historical Price Lookup", "url": "https://taketwointeractivesoftwareinc.gcs-web.com/historical-price-lookup/", "role": "issuer IR reference"},
        ],
        "termsNote": (
            "Yahoo and Nasdaq terms generally restrict redistribution of market data as a product. "
            "This file is a dated illustrative snapshot for a static educational page, with attribution. "
            "The site does not call these APIs from the browser."
        ),
        "quotes": rows,
    }
    DAILY.parent.mkdir(parents=True, exist_ok=True)
    DAILY.write_text(json.dumps(payload, indent=2) + "\n")


def write_quote(meta: dict) -> dict:
    now = now_utc()
    now_ts = int(time.time())
    price = round(float(meta["regularMarketPrice"]), 2)
    prev = meta.get("previousClose") or meta.get("chartPreviousClose")
    prev = round(float(prev), 2) if prev is not None else None
    change = round(price - prev, 2) if prev is not None else None
    change_pct = round((change / prev) * 100, 2) if prev and change is not None else None
    if change_pct is None and meta.get("regularMarketChangePercent") is not None:
        change_pct = round(float(meta["regularMarketChangePercent"]), 2)
    quote_ts = meta.get("regularMarketTime") or now_ts
    quote_dt = datetime.fromtimestamp(int(quote_ts), tz=timezone.utc)
    state = market_state(meta, now_ts)
    payload = {
        "symbol": "TTWO",
        "name": "Take-Two Interactive Software, Inc.",
        "currency": "USD",
        "exchange": "NASDAQ",
        "price": price,
        "previousClose": prev,
        "change": change,
        "changePercent": change_pct,
        "marketState": state,
        "isIntraday": state in {"REGULAR", "PRE", "POST"},
        "quoteTimeUtc": quote_dt.astimezone(timezone.utc).isoformat(),
        "quoteTimeArt": fmt_art(quote_dt),
        "asOfDate": quote_dt.astimezone(NY).date().isoformat(),
        "updatedAtUtc": now.isoformat(),
        "updatedAtArt": fmt_art(now),
        "dayHigh": round(float(meta["regularMarketDayHigh"]), 2) if meta.get("regularMarketDayHigh") else None,
        "dayLow": round(float(meta["regularMarketDayLow"]), 2) if meta.get("regularMarketDayLow") else None,
        "source": "Yahoo Finance, fetched server-side and saved as a static snapshot (GitHub Actions or local refresh). Not a live WebSocket feed.",
        "sourceUrl": "https://finance.yahoo.com/quote/TTWO/",
        "termsNote": "Educational snapshot with attribution. The browser never calls Yahoo directly.",
    }
    LATEST.parent.mkdir(parents=True, exist_ok=True)
    LATEST.write_text(json.dumps(payload, indent=2) + "\n")
    return payload


def refresh_history() -> list[dict]:
    yahoo = from_yahoo_history()
    try:
        nasdaq = from_nasdaq()
    except Exception as exc:
        print("Nasdaq cross-check skipped:", exc, file=sys.stderr)
        nasdaq = {}
    mismatches = []
    for d, rec in nasdaq.items():
        if d in yahoo and abs(yahoo[d]["close"] - rec["close"]) > 0.02:
            mismatches.append((d, yahoo[d]["close"], rec["close"]))
            yahoo[d]["close"] = rec["close"]
    if mismatches:
        print("close mismatches (prefer Nasdaq):", mismatches[:10])
    rows = [yahoo[k] for k in sorted(yahoo)]
    today = datetime.now(ART).date().isoformat()
    write_daily(rows, today)
    print(f"Wrote {DAILY} ({len(rows)} sessions, last {rows[-1]['date']} {rows[-1]['close']})")
    return rows


def refresh_quote() -> dict:
    raw = json.loads(fetch(YAHOO_QUOTE))
    meta = raw["chart"]["result"][0]["meta"]
    payload = write_quote(meta)
    print(
        f"Wrote {LATEST} price={payload['price']} change={payload['changePercent']}% "
        f"state={payload['marketState']} updated={payload['updatedAtArt']}"
    )
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quote", action="store_true", help="Refresh the latest quote only")
    parser.add_argument("--history", action="store_true", help="Refresh daily history only")
    args = parser.parse_args()
    do_quote = args.quote or not args.history
    do_history = args.history or not args.quote
    if do_history:
        refresh_history()
    if do_quote:
        refresh_quote()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
