// Controles de Metas: llena el selector de ítems, el cuadro de info y el estado del selector de activo.
import { $, builder } from "./acceso.js";
import { estado } from "./estado.js";
import { ars, esc, mepStamp, usd } from "./formato.js";
import { presetTotal } from "./objetivo.js";
export function syncMetaAssetUi() {
  const half = estado.asset === "half";
  const btcOnly = estado.asset === "btc";
  const label = $("m-ttwo-label");
  if (label) {
    const val = $("m-ttwo-val");
    const name = btcOnly ? "BTC" : "TTWO";
    label.childNodes[0].textContent = `Supuesto de ${name}: `;
    if (val && val.parentNode !== label) label.appendChild(val);
  }
  if ($("m-btc-block")) $("m-btc-block").hidden = !half;
  document.querySelectorAll("#m-asset [data-asset]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.asset === estado.asset ? "true" : "false");
  });
}

export function fillItems() {
  const b = builder();
  const sel = $("m-item");
  if (!sel || !b?.hw) return;
  const type = $("m-type").value;
  const prev = sel.value;
  const opts = [];
  if (type === "pc") {
    for (const p of b.hw.presets || []) {
      const tot = presetTotal(p.id);
      opts.push(`<option value="preset:${esc(p.id)}">${esc(p.label)} · ${ars(tot)}</option>`);
    }
    const arm = b.buildTotal?.() || 0;
    const bad = (b.compatErrors?.() || []).length;
    opts.push(`<option value="armado"${bad || !arm ? " disabled" : ""}>Tu armado${arm && !bad ? ` · ${ars(arm)}` : " (armalo en Armar PC)"}</option>`);
  } else {
    const list = (b.itemsOf?.(type) || []).slice().sort((a, c) => (a.price || 0) - (c.price || 0));
    for (const it of list) {
      const tag = it.status === "stale" ? " · último verificado" : "";
      opts.push(`<option value="${esc(it.id)}">${esc(it.label)} · ${ars(it.price)}${tag}</option>`);
    }
  }
  sel.innerHTML = opts.join("") || `<option value="">Sin precios verificados</option>`;
  if (prev && [...sel.options].some((o) => o.value === prev && !o.disabled)) sel.value = prev;
  else if (type === "pc") sel.value = "preset:basico";
}

export function itemInfo(g) {
  const box = $("m-item-info");
  if (!box) return;
  if (!g) { box.textContent = "Elegí un ítem del catálogo verificado."; return; }
  if (g.error) { box.innerHTML = `<span class="danger-line">${esc(g.error)}</span>`; return; }
  const usdBit = g.usdN != null ? `${usd(g.usdN)} (${mepStamp()})` : "sin cotización MEP";
  const link = g.url ? `<a href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">${esc(g.store || "ficha")}</a>` : esc(g.store || "");
  const stale = g.stale ? " · último verificado" : "";
  box.innerHTML = `<strong>${esc(g.label)}</strong> · ${ars(g.arsN)} · ${usdBit}. ${link} <span class="tag">${esc(g.date)}${stale}</span>${g.note ? `<br>${esc(g.note)}` : ""}`;
}
