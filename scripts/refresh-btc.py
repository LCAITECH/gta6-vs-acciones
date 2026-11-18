#!/usr/bin/env python3
"""Refresh BTC/USD daily closes and a latest quote snapshot from Bitstamp.

The website never calls Bitstamp in the browser. This script writes static
JSON for GitHub Pages (same pattern as TTWO).

Coinbase Exchange public candles were considered and rejected: Coinbase
Market Data Terms of Use prohibit redistributing or displaying that market
data (or derived charts) to third parties without prior written consent.
CoinGecko and Binance are not used (licensing path closed).

Usage:
  python3 scripts/refresh-btc.py
  python3 scripts/refresh-btc.py --quote
  python3 scripts/refresh-btc.py --history
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
DAILY = ROOT / "data" / "btc-daily.json"
LATEST = ROOT / "data" / "btc-latest.json"
BASE = "https://www.bitstamp.net/api/v2"
UA = "Mozilla/5.0 (compatible; LCAITECH-gta6-vs-acciones/1.1; educational snapshot; +https://gta6.lcaitech.com)"
ART = ZoneInfo("America/Buenos_Aires")
SLEEP = 0.5
PAGES = 3  # 3 × 1000 daily candles ≈ 8 years


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return resp.read()


def fmt_art(dt: datetime) -> str:
    return dt.astimezone(ART).strftime("%d/%m/%Y %H:%M")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def ohlc_page(end: int | None = None) -> list[dict]:
    url = f"{BASE}/ohlc/btcusd/?step=86400&limit=1000&exclude_current_candle=true"
    if end is not None:
        url += f"&end={int(end)}"
    raw = json.loads(fetch(url))
    rows = ((raw.get("data") or {}).get("ohlc")) or []
    out = []
    for r in rows:
        ts = int(r["timestamp"])
        day = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        close = round(float(r["close"]), 2)
        out.append({"date": day, "close": close, "ts": ts})
    return out


def refresh_history() -> list[dict]:
    by_date: dict[str, dict] = {}
    end = None
    for i in range(PAGES):
        page = ohlc_page(end)
        if not page:
            break
        for rec in page:
            by_date[rec["date"]] = rec
        oldest = min(rec["ts"] for rec in page)
        end = oldest - 1
        if i < PAGES - 1:
            time.sleep(SLEEP)
    rows = []
    for d in sorted(by_date):
        rec = {k: v for k, v in by_date[d].items() if k != "ts"}
        rows.append(rec)
    today = datetime.now(ART).date().isoformat()
    payload = {
        "symbol": "BTC-USD",
        "name": "Bitcoin",
        "currency": "USD",
        "exchange": "Bitstamp",
        "pair": "BTC/USD",
        "snapshotDate": today,
        "snapshotTimezone": "America/Buenos_Aires",
        "lastCloseDate": rows[-1]["date"] if rows else None,
        "lastClose": rows[-1]["close"] if rows else None,
        "firstDate": rows[0]["date"] if rows else None,
        "source": (
            f"Snapshot of daily BTC/USD closes compiled {today} from the Bitstamp "
            "public OHLC API (step=86400). Bundled at build time / GitHub Actions. "
            "Not a live data feed and not for trading."
        ),
        "sources": [
            {
                "name": "Bitstamp public OHLC",
                "url": "https://www.bitstamp.net/api/",
                "role": "daily BTC/USD candles",
            },
            {
                "name": "Bitstamp ticker",
                "url": "https://www.bitstamp.net/api/v2/ticker/btcusd/",
                "role": "latest snapshot",
            },
        ],
        "termsNote": (
            "Educational dated snapshot with attribution. The browser never calls Bitstamp. "
            "Commercial redistribution of Bitstamp exchange data may require a Data License "
            "Agreement (partners@bitstamp.net). Coinbase was not used: its Market Data Terms "
            "of Use forbid displaying or redistributing that market data to third parties "
            "without prior written consent. CoinGecko and Binance are not used."
        ),
        "quotes": rows,
    }
    DAILY.parent.mkdir(parents=True, exist_ok=True)
    DAILY.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {DAILY} ({len(rows)} days, {rows[0]['date']} → {rows[-1]['date']} {rows[-1]['close']})")
    return rows


def refresh_quote(history: list[dict] | None = None) -> dict:
    raw = json.loads(fetch(f"{BASE}/ticker/btcusd/"))
    now = now_utc()
    price = round(float(raw["last"]), 2)
    ts = int(raw.get("timestamp") or time.time())
    quote_dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    prev = None
    if history:
        last = history[-1]
        # If the last completed daily close is a previous day, that's previousClose.
        as_of = quote_dt.date().isoformat()
        if last["date"] < as_of:
            prev = last["close"]
        elif len(history) >= 2:
            prev = history[-2]["close"]
        else:
            prev = last["close"]
    elif raw.get("open"):
        prev = round(float(raw["open"]), 2)
    change = round(price - prev, 2) if prev is not None else None
    change_pct = round((change / prev) * 100, 2) if prev and change is not None else None
    payload = {
        "symbol": "BTC-USD",
        "name": "Bitcoin",
        "currency": "USD",
        "exchange": "Bitstamp",
        "pair": "BTC/USD",
        "price": price,
        "previousClose": prev,
        "change": change,
        "changePercent": change_pct,
        "marketState": "24/7",
        "isIntraday": True,
        "quoteTimeUtc": quote_dt.isoformat(),
        "quoteTimeArt": fmt_art(quote_dt),
        "asOfDate": quote_dt.astimezone(ART).date().isoformat(),
        "updatedAtUtc": now.isoformat(),
        "updatedAtArt": fmt_art(now),
        "dayHigh": round(float(raw["high"]), 2) if raw.get("high") else None,
        "dayLow": round(float(raw["low"]), 2) if raw.get("low") else None,
        "source": (
            "Bitstamp public ticker, fetched server-side and saved as a static snapshot "
            "(GitHub Actions or local refresh). Not a live WebSocket feed."
        ),
        "sourceUrl": "https://www.bitstamp.net/market/tradeview/",
        "apiUrl": "https://www.bitstamp.net/api/v2/ticker/btcusd/",
        "termsNote": (
            "Educational snapshot with attribution. The browser never calls Bitstamp. "
            "Commercial redistribution of Bitstamp data may require their Data License Agreement."
        ),
    }
    LATEST.parent.mkdir(parents=True, exist_ok=True)
    LATEST.write_text(json.dumps(payload, indent=2) + "\n")
    print(
        f"Wrote {LATEST} price={payload['price']} change={payload['changePercent']}% "
        f"updated={payload['updatedAtArt']}"
    )
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quote", action="store_true")
    parser.add_argument("--history", action="store_true")
    args = parser.parse_args()
    do_quote = args.quote or not args.history
    do_history = args.history or not args.quote
    history = None
    if do_history:
        history = refresh_history()
    elif DAILY.exists():
        history = json.loads(DAILY.read_text()).get("quotes")
    if do_quote:
        refresh_quote(history)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
