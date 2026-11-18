#!/usr/bin/env python3
"""Refresh the bundled TTWO daily-close snapshot (build time only).

This script is meant to be run locally by the maintainer. The website itself
does not call Yahoo or Nasdaq from the browser.

Sources and terms: see data/ttwo-daily.json and FUENTES.md.
"""
from __future__ import annotations

import json
import ssl
import sys
import urllib.request
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ttwo-daily.json"
YAHOO = (
    "https://query1.finance.yahoo.com/v8/finance/chart/TTWO"
    "?interval=1d&range=2y&events=div%7Csplit"
)
NASDAQ = (
    "https://api.nasdaq.com/api/quote/TTWO/historical"
    "?assetclass=stocks&fromdate={fromdate}&todate={todate}"
)
UA = "Mozilla/5.0 (compatible; LCAITECH-gta6-vs-acciones/1.0; educational snapshot)"
NY = ZoneInfo("America/New_York")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return resp.read()


def from_yahoo() -> dict[str, dict]:
    raw = json.loads(fetch(YAHOO))
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
    today = date.today()
    start = date(today.year - 1, today.month, today.day)
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


def main() -> int:
    yahoo = from_yahoo()
    nasdaq = {}
    try:
        nasdaq = from_nasdaq()
    except Exception as exc:
        print("Nasdaq cross-check skipped:", exc, file=sys.stderr)

    mismatches = []
    for d, rec in nasdaq.items():
        if d in yahoo and abs(yahoo[d]["close"] - rec["close"]) > 0.02:
            mismatches.append((d, yahoo[d]["close"], rec["close"]))
            yahoo[d]["close"] = rec["close"]  # prefer official Nasdaq close on conflict
    if mismatches:
        print("close mismatches (Yahoo vs Nasdaq), prefer Nasdaq:", mismatches[:10])

    rows = [yahoo[k] for k in sorted(yahoo)]
    today = date.today().isoformat()
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
            "chart API, cross-checked against Nasdaq historical quotes. Bundled at "
            "build time for an educational calculator. Not a live data feed and not for trading."
        ),
        "sources": [
            {
                "name": "Yahoo Finance chart",
                "url": "https://finance.yahoo.com/quote/TTWO/history/",
                "role": "build-time daily closes",
            },
            {
                "name": "Nasdaq historical quotes",
                "url": "https://www.nasdaq.com/market-activity/stocks/ttwo/historical",
                "role": "cross-check of official closes",
            },
            {
                "name": "Take-Two IR Historical Price Lookup",
                "url": "https://taketwointeractivesoftwareinc.gcs-web.com/historical-price-lookup/",
                "role": "issuer IR reference",
            },
        ],
        "termsNote": (
            "Yahoo and Nasdaq terms generally restrict redistribution of market data as a product. "
            "This file is a dated illustrative snapshot for a static educational page, with attribution. "
            "The site does not call these APIs from the browser."
        ),
        "quotes": rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {OUT} ({len(rows)} sessions, last {rows[-1]['date']} {rows[-1]['close']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
