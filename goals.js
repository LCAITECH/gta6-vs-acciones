// Sistema de metas del Desafío Gordo Compu: plazo a la meta (aportes y supuesto TTWO) + escenarios.
const $ = (id) => document.getElementById(id);
const G = () => window.__gta;
const MAX_M = 24;
const DOWN_CAP = 50; // a share can't fall more than 100%; we cap bear scenarios at −50%.
const DISCLAIMER = "No es asesoramiento financiero: puede salir bien o mal. La plata que no estás dispuesto a perder, dejala afuera. Los plazos y el supuesto de TTWO o de BTC son una simulación hipotética, no un pronóstico ni una recomendación de compra. El bitcoin es más volátil y puede caer mucho.";
let metaAsset = "ttwo";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ars(n) { return `ARS ${Math.round(n).toLocaleString("es-AR")}`; }
function usd(n) {
  const fmt = G()?.fmtAR;
  const v = Number(n) || 0;
  return fmt ? `US$ ${fmt.format(v)}` : `US$ ${v.toFixed(2)}`;
}
function num(id) { return Math.max(0, Number($(id)?.value) || 0); }

function builder() { return window.__gtaBuilder; }

function addMonths(iso, months) {
  const [y, mo, d] = (iso || "2026-11-18").split("-").map(Number);
  const dt = new Date(y, (mo || 1) - 1 + months, d || 1);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fmtDate(iso) {
  const g = G();
  if (g?.dmy) return g.dmy(iso);
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function cashMonths(initial, monthly, goal) {
  if (goal <= 0) return 0;
  if (initial >= goal - 1e-9) return 0;
  if (monthly <= 0) return null;
  const m = Math.ceil((goal - initial) / monthly - 1e-12);
  return m <= MAX_M ? m : null;
}

// Same interpolation idea as the projection simulator: linear path from live to target over 24 months.
function ttwoMonths(initial, monthly, goal, live, target) {
  if (goal <= 0) return 0;
  if (!(live > 0)) return cashMonths(initial, monthly, goal);
  let shares = initial / live;
  if (shares * live >= goal - 1e-9) return 0;
  for (let k = 1; k <= MAX_M; k++) {
    const p = Math.max(0.01, live + ((target - live) * k) / MAX_M);
    shares += monthly / p;
    if (shares * p >= goal - 1e-9) return k;
  }
  return null;
}

function mixMonths(initial, monthly, goal, liveT, targetT, liveB, targetB) {
  if (goal <= 0) return 0;
  if (!(liveT > 0) || !(liveB > 0)) {
    if (liveT > 0) return ttwoMonths(initial, monthly, goal, liveT, targetT);
    if (liveB > 0) return ttwoMonths(initial, monthly, goal, liveB, targetB);
    return cashMonths(initial, monthly, goal);
  }
  let sT = (initial / 2) / liveT;
  let sB = (initial / 2) / liveB;
  if (sT * liveT + sB * liveB >= goal - 1e-9) return 0;
  for (let k = 1; k <= MAX_M; k++) {
    const pT = Math.max(0.01, liveT + ((targetT - liveT) * k) / MAX_M);
    const pB = Math.max(0.01, liveB + ((targetB - liveB) * k) / MAX_M);
    sT += (monthly / 2) / pT;
    sB += (monthly / 2) / pB;
    if (sT * pT + sB * pB >= goal - 1e-9) return k;
  }
  return null;
}

function cashValueAt(initial, monthly, k) {
  return initial + monthly * k;
}

function investedValueAt(initial, monthly, live, target, k) {
  if (!(live > 0)) return cashValueAt(initial, monthly, k);
  let shares = initial / live;
  for (let i = 1; i <= k; i++) {
    const p = Math.max(0.01, live + ((target - live) * i) / MAX_M);
    shares += monthly / p;
  }
  const pEnd = k === 0 ? live : Math.max(0.01, live + ((target - live) * k) / MAX_M);
  return shares * pEnd;
}

function mixValueAt(initial, monthly, liveT, targetT, liveB, targetB, k) {
  if (!(liveT > 0) || !(liveB > 0)) {
    if (liveT > 0) return investedValueAt(initial, monthly, liveT, targetT, k);
    if (liveB > 0) return investedValueAt(initial, monthly, liveB, targetB, k);
    return cashValueAt(initial, monthly, k);
  }
  let sT = (initial / 2) / liveT;
  let sB = (initial / 2) / liveB;
  for (let i = 1; i <= k; i++) {
    const pT = Math.max(0.01, liveT + ((targetT - liveT) * i) / MAX_M);
    const pB = Math.max(0.01, liveB + ((targetB - liveB) * i) / MAX_M);
    sT += (monthly / 2) / pT;
    sB += (monthly / 2) / pB;
  }
  const pT = k === 0 ? liveT : Math.max(0.01, liveT + ((targetT - liveT) * k) / MAX_M);
  const pB = k === 0 ? liveB : Math.max(0.01, liveB + ((targetB - liveB) * k) / MAX_M);
  return sT * pT + sB * pB;
}

function assumeValueAt(initial, monthly, liveT, targetT, liveB, targetB, k) {
  if (metaAsset === "btc") return investedValueAt(initial, monthly, liveB, targetB, k);
  if (metaAsset === "half") return mixValueAt(initial, monthly, liveT, targetT, liveB, targetB, k);
  return investedValueAt(initial, monthly, liveT, targetT, k);
}

function usd0(n) {
  return `US$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
}

function mepStamp() {
  return G()?.mepStamp?.() || "MEP";
}

function assumeName(long) {
  if (metaAsset === "btc") return long ? "Con el supuesto de BTC" : "Con BTC";
  if (metaAsset === "half") return long ? "Con el supuesto (mitad y mitad)" : "Mitad y mitad";
  return long ? "Con el supuesto de TTWO" : "Con TTWO";
}

function scenarioDeltas(pct) {
  const up = Math.abs(pct) || 20;
  const down = Math.min(up, DOWN_CAP);
  return { up, down };
}

function moneyLines(value, put, goalUsd, mep, reachedMonth) {
  const gain = value - put;
  const gainPct = put > 0 ? (gain / put) * 100 : 0;
  const reach = goalUsd > 0 ? (value / goalUsd) * 100 : 0;
  const missing = Math.max(0, goalUsd - value);
  const arsBit = mep ? ` ≈ ${ars(value * mep)}` : "";
  const when = reachedMonth === null ? "A 24 meses" : (reachedMonth === 0 ? "Hoy" : "En ese momento");
  const sign = gain >= 0 ? "+" : "−";
  const gainLbl = gain >= 0 ? "Ganancia" : "Pérdida";
  const gainTxt = `${gainLbl} ${usd(Math.abs(gain))} (${sign}${Math.abs(gainPct).toLocaleString("es-AR", { maximumFractionDigits: 0 })}%)`;
  const metaTxt = reachedMonth === null
    ? `${Math.round(reach)}% de la meta · faltan ${usd(missing)}`
    : `${Math.round(Math.min(100, reach))}% de la meta`;
  return `<p class="m-money">${when}: <strong>${usd(value)}</strong>${arsBit}</p><p class="m-money">${gainTxt} · ${metaTxt}</p>`;
}

function scenCell(months, value, goalUsd, start, ttwoOnly) {
  if (ttwoOnly) return "—";
  if (months === null) {
    const reach = goalUsd > 0 ? (value / goalUsd) * 100 : 0;
    const missing = Math.max(0, goalUsd - value);
    return `${usd0(value)} · ${Math.round(reach)}% · faltan ${usd0(missing)}`;
  }
  return `${reachLabel(months, start)} · ${usd0(value)}`;
}

function reachLabel(m, start) {
  if (m === null) return "no llega en 24 meses";
  if (m === 0) return "ya la alcanzás";
  const when = fmtDate(addMonths(start, m));
  return `${m} mes${m === 1 ? "" : "es"} · ${when}`;
}

function livePrice() {
  const b = builder();
  if (b?.ttwo) {
    const p = b.ttwo();
    if (p) return p;
  }
  const g = G();
  if (g?.latestQuote && typeof g.latestQuote.price === "number") return g.latestQuote.price;
  const q = g?.quotes;
  return q && q.length ? q[q.length - 1].close : 0;
}
function liveBtc() {
  const g = G();
  if (g?.latestBtc && typeof g.latestBtc.price === "number") return g.latestBtc.price;
  const q = g?.btcQuotes;
  return q && q.length ? q[q.length - 1].close : 0;
}
function assumeMonths(initial, monthly, goal, liveT, targetT, liveB, targetB) {
  if (metaAsset === "btc") return ttwoMonths(initial, monthly, goal, liveB, targetB);
  if (metaAsset === "half") return mixMonths(initial, monthly, goal, liveT, targetT, liveB, targetB);
  return ttwoMonths(initial, monthly, goal, liveT, targetT);
}
function syncMetaAssetUi() {
  const half = metaAsset === "half";
  const btcOnly = metaAsset === "btc";
  const label = $("m-ttwo-label");
  if (label) {
    const val = $("m-ttwo-val");
    const name = btcOnly ? "BTC" : "TTWO";
    label.childNodes[0].textContent = `Supuesto de ${name}: `;
    if (val && val.parentNode !== label) label.appendChild(val);
  }
  if ($("m-btc-block")) $("m-btc-block").hidden = !half;
  document.querySelectorAll("#m-asset [data-asset]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.asset === metaAsset ? "true" : "false");
  });
}

function presetTotal(id) {
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

function currentGoal() {
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

function fillItems() {
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

function itemInfo(g) {
  const box = $("m-item-info");
  if (!box) return;
  if (!g) { box.textContent = "Elegí un ítem del catálogo verificado."; return; }
  if (g.error) { box.innerHTML = `<span class="danger-line">${esc(g.error)}</span>`; return; }
  const usdBit = g.usdN != null ? `${usd(g.usdN)} (${mepStamp()})` : "sin cotización MEP";
  const link = g.url ? `<a href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">${esc(g.store || "ficha")}</a>` : esc(g.store || "");
  const stale = g.stale ? " · último verificado" : "";
  box.innerHTML = `<strong>${esc(g.label)}</strong> · ${ars(g.arsN)} · ${usdBit}. ${link} <span class="tag">${esc(g.date)}${stale}</span>${g.note ? `<br>${esc(g.note)}` : ""}`;
}

function renderGoals() {
  const drop = Number($("m-drop")?.value || 0);
  const ttwoPct = Number($("m-ttwo")?.value || 0);
  const btcPct = Number($("m-btc")?.value || 0);
  syncMetaAssetUi();
  if ($("m-drop-val")) $("m-drop-val").textContent = `${drop}%`;
  if ($("m-ttwo-val")) {
    $("m-ttwo-val").textContent = `${ttwoPct > 0 ? "+" : ttwoPct < 0 ? "−" : ""}${Math.abs(ttwoPct)}%`;
  }
  if ($("m-btc-val")) {
    $("m-btc-val").textContent = `${btcPct > 0 ? "+" : btcPct < 0 ? "−" : ""}${Math.abs(btcPct)}%`;
  }
  document.querySelectorAll("#m-drop-chips [data-drop]").forEach((b) => {
    b.setAttribute("aria-pressed", Number(b.dataset.drop) === drop ? "true" : "false");
  });
  const goal = currentGoal();
  itemInfo(goal);
  const out = $("m-out");
  if (!out) return;
  if (!goal || goal.error || !goal.arsN) {
    out.innerHTML = `<p class="muted">${goal?.error ? esc(goal.error) : "Elegí un objetivo del catálogo para calcular el plazo."}</p>`;
    return;
  }
  if (goal.usdN == null) {
    out.innerHTML = `<p class="muted">Falta la cotización MEP para pasar el precio a dólares.</p>`;
    return;
  }
  const initial = num("m-initial");
  const monthly = num("m-monthly");
  const start = $("m-start")?.value || "2026-11-18";
  const live = livePrice();
  const liveB = liveBtc();
  const target = live * (1 + (metaAsset === "btc" ? btcPct : ttwoPct) / 100);
  const targetT = live * (1 + ttwoPct / 100);
  const targetB = liveB * (1 + (metaAsset === "btc" ? ttwoPct : btcPct) / 100);
  const base = goal.usdN;
  const dropped = base * (1 - drop / 100);

  const tgtB = metaAsset === "btc" ? (liveB * (1 + ttwoPct / 100)) : targetB;
  const cash = cashMonths(initial, monthly, base);
  const withT = assumeMonths(initial, monthly, base, live, targetT, liveB, tgtB);
  const cashK = cash === null ? MAX_M : cash;
  const assumeK = withT === null ? MAX_M : withT;
  const cashVal = cashValueAt(initial, monthly, cashK);
  const cashPut = cashVal;
  const assumeVal = assumeValueAt(initial, monthly, live, targetT, liveB, tgtB, assumeK);
  const assumePut = cashValueAt(initial, monthly, assumeK);
  const pctNow = base > 0 ? Math.max(0, Math.min(100, (initial / base) * 100)) : 0;
  const reached = cash === 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const win = reached
    ? `<div class="m-win${reduced ? " static" : ""}" role="status"><strong>Llegaste a la meta, te la podés comprar</strong></div>`
    : "";

  const bar = `<div class="m-progress"><div class="m-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pctNow)}"><div style="width:${pctNow}%"></div></div><p class="muted">Llevás ${usd(initial)} de ${usd(base)} (${Math.round(pctNow)}%).</p></div>`;

  const ttwoD = scenarioDeltas(ttwoPct);
  const btcD = scenarioDeltas(metaAsset === "half" ? btcPct : ttwoPct);
  const curT = metaAsset === "btc" ? live : targetT;
  const curB = tgtB;

  function rowBoth(label, init, mon, goalUsd, tT, tB) {
    const c = cashMonths(init, mon, goalUsd);
    const a = assumeMonths(init, mon, goalUsd, live, tT, liveB, tB);
    return {
      k: label,
      cash: c,
      ttwo: a,
      cashVal: cashValueAt(init, mon, c === null ? MAX_M : c),
      ttwoVal: assumeValueAt(init, mon, live, tT, liveB, tB, a === null ? MAX_M : a),
    };
  }
  function rowAssume(label, init, mon, goalUsd, tT, tB) {
    const a = assumeMonths(init, mon, goalUsd, live, tT, liveB, tB);
    return {
      k: label,
      cash: null,
      ttwo: a,
      ttwoOnly: true,
      ttwoVal: assumeValueAt(init, mon, live, tT, liveB, tB, a === null ? MAX_M : a),
    };
  }

  const rows = [
    rowBoth("Aporte mensual ×2", initial, monthly * 2, base, curT, curB),
    rowBoth("Aporte mensual ×3", initial, monthly * 3, base, curT, curB),
    rowBoth(`Precio del componente −${drop}% (${usd(dropped)})`, initial, monthly, dropped, curT, curB),
  ];
  if (metaAsset === "half") {
    rows.push(
      rowAssume(`TTWO +${ttwoD.up}%`, initial, monthly, base, live * (1 + ttwoD.up / 100), liveB),
      rowAssume(`TTWO −${ttwoD.down}%`, initial, monthly, base, live * (1 - ttwoD.down / 100), liveB),
      rowAssume(`BTC +${btcD.up}%`, initial, monthly, base, live, liveB * (1 + btcD.up / 100)),
      rowAssume(`BTC −${btcD.down}%`, initial, monthly, base, live, liveB * (1 - btcD.down / 100)),
    );
  } else if (metaAsset === "btc") {
    rows.push(
      rowAssume(`BTC +${btcD.up}%`, initial, monthly, base, curT, liveB * (1 + btcD.up / 100)),
      rowAssume(`BTC −${btcD.down}%`, initial, monthly, base, curT, liveB * (1 - btcD.down / 100)),
    );
  } else {
    rows.push(
      rowAssume(`TTWO +${ttwoD.up}%`, initial, monthly, base, live * (1 + ttwoD.up / 100), curB),
      rowAssume(`TTWO −${ttwoD.down}%`, initial, monthly, base, live * (1 - ttwoD.down / 100), curB),
    );
  }
  const assumeCol = assumeName(false);

  const scen = rows.map((r) => `<tr>
      <th scope="row">${esc(r.k)}</th>
      <td data-label="Solo aportes">${scenCell(r.cash, r.cashVal, r.k.startsWith("Precio") ? dropped : base, start, r.ttwoOnly)}</td>
      <td data-label="${esc(assumeCol)}">${scenCell(r.ttwo, r.ttwoVal, r.k.startsWith("Precio") ? dropped : base, start, false)}</td>
    </tr>`).join("");

  let ttwoNote = "Sin precio del activo: solo se muestran los aportes.";
  if (metaAsset === "half" && live && liveB) {
    ttwoNote = `Supuesto mitad y mitad: TTWO ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(live)} a ${usd(targetT)}) y BTC ${btcPct >= 0 ? "+" : "−"}${Math.abs(btcPct)}% (de ${usd(liveB)} a ${usd(targetB)}) a 24 meses.`;
  } else if (metaAsset === "btc" && liveB) {
    const tgt = liveB * (1 + ttwoPct / 100);
    ttwoNote = `Supuesto de BTC: ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(liveB)} a ${usd(tgt)} a 24 meses).`;
  } else if (live) {
    ttwoNote = `Supuesto de TTWO: ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(live)} a ${usd(targetT)} a 24 meses).`;
  }

  out.innerHTML = `
    ${win}
    <div class="m-head">
      <div class="k">Meta</div>
      <div class="v">${usd(base)}</div>
      <div class="s">${ars(goal.arsN)} (${mepStamp()}) · ${esc(goal.label)}</div>
    </div>
    ${bar}
    <div class="m-reach">
      <div class="m-cell"><span>Solo con aportes</span><strong class="${cash === null ? "down" : "up"}">${reachLabel(cash, start)}</strong>${moneyLines(cashVal, cashPut, base, goal.mep, cash)}</div>
      <div class="m-cell"><span>${assumeName(true)}</span><strong class="${withT === null ? "down" : "up"}">${reachLabel(withT, start)}</strong>${moneyLines(assumeVal, assumePut, base, goal.mep, withT)}</div>
    </div>
    <p class="fine-inline">${esc(ttwoNote)} Tope de la cuenta: 24 meses. El bitcoin puede caer mucho.</p>
    <h4 class="cmp-list-title">Escenarios</h4>
    <div class="table-wrap"><table class="m-scen">
      <thead><tr><th>Escenario</th><th>Solo aportes</th><th>${esc(assumeCol)}</th></tr></thead>
      <tbody>${scen}</tbody>
    </table></div>`;
}

function useArmado() {
  const type = $("m-type");
  if (type) type.value = "pc";
  fillItems();
  const item = $("m-item");
  if (item && [...item.options].some((o) => o.value === "armado" && !o.disabled)) item.value = "armado";
  renderGoals();
  const tab = document.querySelector('.d-subtabs [data-pane="metas"]');
  if (tab) tab.click();
}

function bind() {
  $("m-type")?.addEventListener("change", () => { fillItems(); renderGoals(); });
  $("m-item")?.addEventListener("change", renderGoals);
  ["m-initial", "m-monthly", "m-start"].forEach((id) => $(id)?.addEventListener("input", renderGoals));
  $("m-drop")?.addEventListener("input", renderGoals);
  $("m-ttwo")?.addEventListener("input", renderGoals);
  $("m-btc")?.addEventListener("input", renderGoals);
  $("m-asset")?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-asset]");
    if (!b) return;
    metaAsset = b.dataset.asset;
    renderGoals();
  });
  $("m-drop-chips")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-drop]");
    if (!b) return;
    $("m-drop").value = b.dataset.drop;
    renderGoals();
  });
  $("m-form")?.addEventListener("submit", (e) => e.preventDefault());
}

function init() {
  if (!$("m-form")) return;
  const start = () => {
    const b = builder();
    if (!b?.hw) return setTimeout(start, 50);
    if ($("m-disclaimer")) $("m-disclaimer").textContent = DISCLAIMER;
    // If the projection simulator already has a TTWO variation, inherit it once.
    const sim = $("s-slider");
    if (sim && $("m-ttwo") && $("m-ttwo").value === "0" && Number(sim.value) !== 0) {
      $("m-ttwo").value = sim.value;
    }
    fillItems();
    bind();
    renderGoals();
    const api = builder();
    if (api) {
      api.onBuildChange = () => {
        if ($("m-type")?.value === "pc") fillItems();
        if (!$("m-out")) return;
        if ($("m-type")?.value === "pc" && $("m-item")?.value === "armado") renderGoals();
      };
      api.useArmadoAsMetas = useArmado;
    }
    G()?.listeners?.push(renderGoals);
  };
  start();
}

window.__gtaRenderMetas = renderGoals;
window.__gtaUseArmadoAsMetas = useArmado;
init();
