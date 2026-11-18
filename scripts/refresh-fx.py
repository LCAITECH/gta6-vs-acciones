#!/usr/bin/env python3
"""Refresh Argentine dollar rates into data/fx-ar.json (server-side only).

Source: DolarApi (https://dolarapi.com). Its data-use page allows keeping a
local copy and publishing work based on it, with the citation
"DolarApi https://dolarapi.com", and suggests at most one query every 3 hours
per series. We make a single request to /v1/dolares per run.
"""
from __future__ import annotations

import json
import ssl
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "fx-ar.json"
URL = "https://dolarapi.com/v1/dolares"
UA = "Mozilla/5.0 (compatible; LCAITECH-gta6-vs-acciones/1.2)"
ART = ZoneInfo("America/Buenos_Aires")
KEEP = {
    "oficial": "Oficial (BNA)",
    "tarjeta": "Tarjeta (oficial + 30%)",
    "blue": "Blue",
    "bolsa": "MEP (bolsa)",
    "contadoconliqui": "CCL",
    "cripto": "Cripto (USDT/USDC)",
    "mayorista": "Mayorista",
}


def fmt_art(dt: datetime) -> str:
    return dt.astimezone(ART).strftime("%d/%m/%Y %H:%M")


def main() -> int:
    req = urllib.request.Request(URL, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=30) as resp:
        rows = json.loads(resp.read())
    rates = {}
    for r in rows:
        casa = r.get("casa")
        if casa not in KEEP:
            continue
        ts = r.get("fechaActualizacion")
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00")) if ts else None
        rates[casa] = {
            "label": KEEP[casa],
            "compra": r.get("compra"),
            "venta": r.get("venta"),
            "updatedAtUtc": dt.isoformat() if dt else None,
            "updatedAtArt": fmt_art(dt) if dt else None,
        }
    now = datetime.now(timezone.utc)
    payload = {
        "updatedAtUtc": now.isoformat(),
        "updatedAtArt": fmt_art(now),
        "source": "DolarApi https://dolarapi.com",
        "sourceUrl": "https://dolarapi.com/docs/uso",
        "note": "Valores informativos. Cripto = cotización de referencia de DolarApi para USDT/USDC; tu exchange puede cobrar otro precio.",
        "rates": rates,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print("Wrote", OUT, {k: v["venta"] for k, v in rates.items()})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
