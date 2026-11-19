#!/usr/bin/env python3
"""Refresh data/hardware-prices.json from public product pages.

Respects robots.txt. Identifies itself. If a fetch fails, keeps the last
verified price and marks the item stale. Does not invent prices or use
Mercado Libre (API disallows unauthenticated crawling).
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.robotparser
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "hardware-prices.json"
UA = "Mozilla/5.0 (compatible; LCAITECH-gta6-prices/1.0; +https://gta6.lcaitech.com)"
TIMEOUT = 25
SLEEP = 0.7
TZ = ZoneInfo("America/Buenos_Aires")

# Never hit these hosts (robots or TOS / previous 403-without-OAuth).
BLOCKED_HOSTS = {
    "api.mercadolibre.com",
    "www.mercadolibre.com.ar",
    "mercadolibre.com.ar",
    "listado.mercadolibre.com.ar",
}

# Query params that Venex robots.txt disallows on search listings.
VENEX_DISALLOW_QS = ("keywords", "sort", "order", "q")


def now_art() -> datetime:
    return datetime.now(TZ)


def fmt_art(dt: datetime) -> str:
    return dt.strftime("%d/%m/%Y %H:%M")


def robots_for(url: str, cache: dict) -> urllib.robotparser.RobotFileParser | None:
    host = urlparse(url).scheme + "://" + urlparse(url).netloc
    if host in cache:
        return cache[host]
    rp = urllib.robotparser.RobotFileParser()
    try:
        rp.set_url(host + "/robots.txt")
        req = Request(host + "/robots.txt", headers={"User-Agent": UA})
        with urlopen(req, timeout=TIMEOUT) as res:
            rp.parse(res.read().decode("utf-8", "replace").splitlines())
    except Exception as e:
        print(f"robots.txt fail {host}: {e}", file=sys.stderr)
        # Fail closed for unknown hosts: skip the fetch.
        cache[host] = None
        return None
    cache[host] = rp
    return rp


def allowed(url: str, robots_cache: dict) -> bool:
    p = urlparse(url)
    host = p.netloc.lower()
    if host in BLOCKED_HOSTS or host.endswith("mercadolibre.com.ar"):
        return False
    if host.endswith("venex.com.ar"):
        qs = p.query.lower()
        if any(k in qs for k in VENEX_DISALLOW_QS):
            return False
    rp = robots_for(url, robots_cache)
    if rp is None:
        # If we already know the store from a previous successful policy, still
        # skip when robots could not be read.
        return False
    try:
        return rp.can_fetch(UA, url)
    except Exception:
        return False


def fetch(url: str) -> tuple[int, str]:
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"})
    with urlopen(req, timeout=TIMEOUT) as res:
        raw = res.read()
        return res.status, raw.decode("utf-8", "replace")


def parse_price(html: str, store: str) -> int | None:
    # Common product meta / schema.
    patterns = [
        r'property=["\']product:price:amount["\']\s+content=["\']([0-9]+(?:\.[0-9]+)?)["\']',
        r'content=["\']([0-9]+(?:\.[0-9]+)?)["\']\s+property=["\']product:price:amount["\']',
        r'itemprop=["\']price["\'][^>]*content=["\']([0-9]+(?:[.,][0-9]+)?)["\']',
        r'"price"\s*:\s*"?([0-9]{4,})(?:\.0+)?"?',
        r'data-price=["\']([0-9]+(?:[.,][0-9]+)?)["\']',
    ]
    store_l = (store or "").lower()
    if "game sense" in store_l:
        patterns.insert(0, r'woocommerce-Price-amount[^>]*>\s*(?:<span[^>]*>[^<]*</span>\s*)?([0-9][0-9.\s]*)')
    found: list[int] = []
    for pat in patterns:
        for m in re.finditer(pat, html, re.I):
            raw = m.group(1)
            raw = raw.replace(" ", "").replace("\xa0", "")
            if "," in raw and "." in raw:
                raw = raw.replace(".", "").replace(",", ".")
            elif raw.count(".") > 1:
                raw = raw.replace(".", "")
            elif "," in raw and raw.count(",") == 1 and len(raw.split(",")[1]) == 2:
                raw = raw.replace(",", ".")
            elif "," in raw:
                raw = raw.replace(",", "")
            try:
                val = float(raw)
            except ValueError:
                continue
            # ARS hardware/console prices are in the thousands+.
            if val >= 1000:
                found.append(int(round(val)))
            elif 100 <= val < 1000 and "nvidia" in html.lower():
                # ignore USD MSRP-like leftovers
                continue
        if found:
            break
    return found[0] if found else None


def apply_qty(item: dict, unit_price: int) -> int:
    qty = int(item.get("qty") or 1)
    return unit_price * qty


def fmt_ars(n: int) -> str:
    return f"{int(n):,}".replace(",", ".")


def derive_discounts(item: dict) -> None:
    """Keep cash/transfer prices consistent with the list price.

    Stores like Game Sense publish "efectivo -20%" and "transferencia -10%" as a rule
    over the list price. The rule lives in the JSON (cashDiscountPct / transferDiscountPct)
    and the derived prices are recomputed whenever the list price moves, so the cash
    price (and the note shown to users) never go stale while the list price changes.
    """
    price = item.get("price")
    if not price:
        return
    cash_pct = item.get("cashDiscountPct")
    transfer_pct = item.get("transferDiscountPct")
    if cash_pct is not None:
        item["cashPrice"] = int(round(price * (1 - cash_pct / 100)))
        if item.get("compareHow") == "efectivo":
            item["comparePrice"] = item["cashPrice"]
    if transfer_pct is not None:
        item["transferPrice"] = int(round(price * (1 - transfer_pct / 100)))
    if cash_pct is not None:
        parts = [f"Lista ARS {fmt_ars(price)}", f"efectivo −{cash_pct:g}% = ARS {fmt_ars(item['cashPrice'])}"]
        if transfer_pct is not None:
            parts.append(f"transferencia −{transfer_pct:g}% = ARS {fmt_ars(item['transferPrice'])}")
        item["note"] = "; ".join(parts) + ". El comparador usa el efectivo."


def main() -> int:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    now = now_art()
    robots_cache: dict = {}
    ok = stale = skipped = 0
    for item in data.get("items", []):
        url = item.get("url") or ""
        if not url:
            skipped += 1
            continue
        store = item.get("store") or ""
        if not allowed(url, robots_cache):
            print(f"skip (robots/blocked): {item.get('id')} {url}", file=sys.stderr)
            # Keep last verified value.
            if item.get("status") != "stale":
                # Don't flip a previously-ok item to stale just because robots
                # couldn't be fetched this run unless we already tried the page.
                pass
            skipped += 1
            time.sleep(0.15)
            continue
        try:
            status, html = fetch(url)
            price = parse_price(html, store) if status and 200 <= status < 300 else None
            if price:
                item["price"] = apply_qty(item, price)
                if "comparePrice" in item and "cashPrice" not in item:
                    item["comparePrice"] = item["price"]
                derive_discounts(item)
                item["status"] = "ok"
                item["fetchedAtArt"] = fmt_art(now)
                item["fetchedAtUtc"] = now.astimezone(ZoneInfo("UTC")).isoformat()
                if "error" in item:
                    del item["error"]
                ok += 1
                print(f"ok {item['id']}: {item['price']}")
            else:
                item["status"] = "stale"
                item["error"] = f"no price parsed (HTTP {status})"
                stale += 1
                print(f"stale {item['id']}: no price (HTTP {status})", file=sys.stderr)
        except Exception as e:
            item["status"] = "stale"
            item["error"] = str(e)[:200]
            stale += 1
            print(f"stale {item['id']}: {e}", file=sys.stderr)
        time.sleep(SLEEP)

    data["updatedAtArt"] = fmt_art(now)
    data["updatedAtUtc"] = now.astimezone(ZoneInfo("UTC")).isoformat()
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"done ok={ok} stale={stale} skipped={skipped} at {data['updatedAtArt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
