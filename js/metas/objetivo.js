// Objetivo elegido en Metas: arma el ítem (preset, armado o catálogo) con su precio en ARS y USD.
import { $, builder } from "./acceso.js";
export function presetTotal(id) {
  const b = builder();
  const p = (b?.hw?.presets || []).find((x) => x.id === id);
  if (!p || !b) return 0;
  return Object.values(p.parts).reduce((s, pid) => s + (b.byId[pid]?.price || 0), 0);
}
function presetParts(id) {
  const b = builder();
  const p = (b?.hw?.presets || []).find((x) => x.id === id);
  if (!p || !b) return [];
  return Object.values(p.parts).map((pid) => b.byId[pid]).filter(Boolean);
}

export function currentGoal() {
  const b = builder();
  if (!b?.hw) return null;
  const type = $("m-type")?.value || "pc";
  const key = $("m-item")?.value || "";
  let label = "";
  let arsN = 0;
  let store = "";
  let url = "";
  let date = "";
  let note = "";
  let stale = false;
  if (type === "pc") {
    if (key === "armado") {
      const errs = b.compatErrors?.() || [];
      arsN = b.buildTotal?.() || 0;
      label = "Tu armado";
      note = errs.length ? errs.join(" ") : (b.selectedParts?.() || []).map((p) => p.label).join(" · ");
      const parts = b.selectedParts?.() || [];
      store = "varios (Venex)";
      date = b.hw.updatedAtArt || "";
      if (parts[0]) url = parts[0].url;
      stale = parts.some((p) => p.status === "stale");
      if (errs.length) return { type, key, label, arsN: 0, error: errs.join(" ") };
    } else if (key.startsWith("preset:")) {
      const id = key.slice(7);
      const p = (b.hw.presets || []).find((x) => x.id === id);
      arsN = presetTotal(id);
      label = p?.label || id;
      note = presetParts(id).map((x) => x.label).join(" · ");
      store = "Venex";
      date = b.hw.updatedAtArt || "";
      const first = presetParts(id)[0];
      if (first) url = first.url;
    }
  } else {
    const it = b.byId[key];
    if (!it) return null;
    label = it.label;
    arsN = it.price || 0;
    store = it.store || "";
    url = it.url || "";
    date = it.fetchedAtArt || "";
    note = it.product || "";
    stale = it.status === "stale";
  }
  const mep = b.mep?.();
  const usdN = mep && arsN ? arsN / mep : null;
  return { type, key, label, arsN, usdN, mep, store, url, date, note, stale };
}
