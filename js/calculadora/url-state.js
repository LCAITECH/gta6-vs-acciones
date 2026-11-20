// Estado de la calculadora en la URL (guardar y restaurar).
import { ASSET_SHORT, fijarActivo } from "./activo.js";
import { $ } from "./base.js";
import { estado } from "./estado.js";
const STATE_IDS = ["edition","store","custom-amount","custom-ccy","purchase-date","dlc","dlc-ccy","gtaplus-months","courtesy-month","iva","percepcion","iibb","fx-buy","fx-now","display-ccy","fund-rate","memb-on","memb-plan","memb-months"];

// Compact keys for shared links; long keys still accepted (old links).
const SHORT = { edition: "e", store: "s", "custom-amount": "a", "custom-ccy": "c", "purchase-date": "d", dlc: "dl", "dlc-ccy": "dc", "gtaplus-months": "g", "courtesy-month": "cm", iva: "i", percepcion: "p", iibb: "ib", "fx-buy": "fb", "fx-now": "fn", "display-ccy": "v", "fund-rate": "f", "memb-on": "mo", "memb-plan": "mp", "memb-months": "mm" };
const VAL_SHORT = { edition: { standard: "s", ultimate: "u", "xbox-upgrade": "x" }, store: { ps: "ps", xbox: "xb", official: "of" } };
const MODE_SHORT = { official: "o", custom: "c", missing: "n" };
let DEFAULTS = null;
function fieldValue(el) { return el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value; }
function captureDefaults() {
  DEFAULTS = {};
  STATE_IDS.forEach((id) => { const el = $(id); if (el) DEFAULTS[id] = fieldValue(el); });
}

export function saveStateToUrl() {
  if (!DEFAULTS) captureDefaults();
  const q = new URLSearchParams();
  STATE_IDS.forEach((id) => {
    const el = $(id);
    if (!el) return;
    if ((id === "custom-amount" || id === "custom-ccy") && estado.amountMode !== "custom") return;
    const v = fieldValue(el);
    if (v === DEFAULTS[id] && id !== "edition" && id !== "store") return;
    if ((id === "edition" || id === "store") && v === DEFAULTS[id]) return;
    q.set(SHORT[id], (VAL_SHORT[id] && VAL_SHORT[id][v]) || v);
  });
  if (!estado.binanceIva) q.set("bi", "0");
  if (!estado.gpIva) q.set("gi", "0");
  if (estado.asset !== "both") q.set("as", ASSET_SHORT[estado.asset]);
  if (window.__gtaExtraState) window.__gtaExtraState(q);
  if (estado.amountMode === "custom") q.set("m", "c");
  const qs = q.toString();
  history.replaceState(null, "", `${location.pathname}${qs ? "?" + qs : ""}${location.hash}`);
}

export let urlAmountMode = null;
export function loadStateFromUrl() {
  captureDefaults();
  const q = new URLSearchParams(location.search);
  const legacyCustom = q.get("edition") === "custom";
  if (![...q.keys()].length) return;
  STATE_IDS.forEach((id) => {
    const el = $(id);
    if (!el) return;
    let v = q.has(SHORT[id]) ? q.get(SHORT[id]) : q.get(id);
    if (v == null) return;
    if (VAL_SHORT[id]) {
      const back = Object.entries(VAL_SHORT[id]).find(([, s]) => s === v);
      if (back) v = back[0];
    }
    if (id === "edition" && v === "custom") v = "ultimate";
    if (el.type === "checkbox") el.checked = v === "1";
    else if (el.tagName === "SELECT") { if ([...el.options].some((o) => o.value === v)) el.value = v; }
    else el.value = v.slice(0, 32);
  });
  const as = q.get("as");
  if (as === "t") fijarActivo("ttwo");
  else if (as === "b") fijarActivo("btc");
  else if (as === "2") fijarActivo("both");
  if (q.get("gi") === "0") estado.gpIva = false;
  const bi = q.get("bi") ?? q.get("binance-iva");
  if (bi != null) estado.binanceIva = bi === "1";
  const m = q.get("m");
  const mode = m ? Object.keys(MODE_SHORT).find((k) => MODE_SHORT[k] === m) : q.get("amount-mode");
  urlAmountMode = mode || (legacyCustom ? "custom" : null);
}
