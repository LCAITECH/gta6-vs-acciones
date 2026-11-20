// Links para compartir y estado de las secciones extra en la URL.
import { $ } from "./acceso.js";
export const INITIAL_QS = new URLSearchParams(location.search);

const SITE = "https://gta6.lcaitech.com/";

// ================= SHARE + URL STATE =================
export function setShare(prefix, text, anchor, longText) {
  const url = SITE + location.search + anchor;
  $(`${prefix}-share-x`).href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  $(`${prefix}-share-wa`).href = `https://wa.me/?text=${encodeURIComponent((longText || text) + " " + url)}`;
  $(`${prefix}-share-copy`).dataset.url = url;
}

const XKEYS = {
  "j-console": "jc", "j-console-price": "jp", "j-game": "jg", "j-game-format": "jf", "j-upgrade": "ju", "j-upgrade-price": "jup", "j-upgrade-ccy": "juc",
  "j-memb": "jm", "j-memb-plan": "jmp", "j-memb-months": "jmm", "j-tv": "jt", "j-other": "jo",
  "w-mode": "wm", "d-goal": "pg", "d-goal-amount": "pa", "d-goal-ccy": "pc", "d-lump": "pl", "d-monthly": "pmo", "d-start": "pd", "w-pcdate": "wd",
};
let XDEF = null;
const val = (el) => (el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value);
export function extraState(q) {
  if (!XDEF) return;
  Object.entries(XKEYS).forEach(([id, k]) => {
    const el = $(id); if (!el) return;
    if (id === "j-console-price" && !el.dataset.edited) return;
    if (id === "j-upgrade-price" && !el.dataset.edited) return;
    const v = val(el);
    if (v !== XDEF[id]) q.set(k, v);
  });
}
export function restoreExtras() {
  Object.entries(XKEYS).forEach(([id, k]) => {
    const el = $(id); if (!el || !INITIAL_QS.has(k)) return;
    const v = INITIAL_QS.get(k).slice(0, 32);
    if (el.type === "checkbox") el.checked = v === "1";
    else if (el.tagName === "SELECT") { if ([...el.options].some((o) => o.value === v)) el.value = v; }
    else el.value = v;
    if (id === "j-console-price" || id === "j-upgrade-price") el.dataset.edited = "1";
  });
}

export function capturarDefaults() {
  XDEF = Object.fromEntries(Object.keys(XKEYS).map((id) => [id, val($(id))]));
}
