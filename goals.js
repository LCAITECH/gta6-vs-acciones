// Sistema de metas del Desafío Gordo Compu: plazo a la meta (aportes y supuesto TTWO) + escenarios.
const $ = (id) => document.getElementById(id);
const G = () => window.__gta;
const MAX_M = 24;
const DISCLAIMER = "No es asesoramiento financiero: puede salir bien o mal. La plata que no estás dispuesto a perder, dejala afuera. Los plazos y el supuesto de TTWO son una simulación hipotética, no un pronóstico ni una recomendación de compra.";

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
  const usdBit = g.usdN != null ? `${usd(g.usdN)} al MEP${g.mep ? ` (${g.mep.toLocaleString("es-AR")})` : ""}` : "sin cotización MEP";
  const link = g.url ? `<a href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">${esc(g.store || "ficha")}</a>` : esc(g.store || "");
  const stale = g.stale ? " · último verificado" : "";
  box.innerHTML = `<strong>${esc(g.label)}</strong> · ${ars(g.arsN)} · ${usdBit}. ${link} <span class="tag">${esc(g.date)}${stale}</span>${g.note ? `<br>${esc(g.note)}` : ""}`;
}

function renderGoals() {
  const drop = Number($("m-drop")?.value || 0);
  const ttwoPct = Number($("m-ttwo")?.value || 0);
  if ($("m-drop-val")) $("m-drop-val").textContent = `${drop}%`;
  if ($("m-ttwo-val")) {
    $("m-ttwo-val").textContent = `${ttwoPct > 0 ? "+" : ttwoPct < 0 ? "−" : ""}${Math.abs(ttwoPct)}%`;
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
  const target = live * (1 + ttwoPct / 100);
  const base = goal.usdN;
  const dropped = base * (1 - drop / 100);

  const cash = cashMonths(initial, monthly, base);
  const withT = ttwoMonths(initial, monthly, base, live, target);
  const pctNow = base > 0 ? Math.max(0, Math.min(100, (initial / base) * 100)) : 0;
  const reached = cash === 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const win = reached
    ? `<div class="m-win${reduced ? " static" : ""}" role="status"><strong>Llegaste a la meta, te la podés comprar</strong></div>`
    : "";

  const bar = `<div class="m-progress"><div class="m-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pctNow)}"><div style="width:${pctNow}%"></div></div><p class="muted">Llevás ${usd(initial)} de ${usd(base)} (${Math.round(pctNow)}%).</p></div>`;

  const ttwoX = Math.abs(ttwoPct) || 20;
  const rows = [
    { k: "Aporte mensual ×2", cash: cashMonths(initial, monthly * 2, base), ttwo: ttwoMonths(initial, monthly * 2, base, live, target) },
    { k: "Aporte mensual ×3", cash: cashMonths(initial, monthly * 3, base), ttwo: ttwoMonths(initial, monthly * 3, base, live, target) },
    { k: `Precio del componente −${drop}% (${usd(dropped)})`, cash: cashMonths(initial, monthly, dropped), ttwo: ttwoMonths(initial, monthly, dropped, live, target) },
    { k: `TTWO +${ttwoX}%`, cash: null, ttwo: ttwoMonths(initial, monthly, base, live, live * (1 + ttwoX / 100)), ttwoOnly: true },
    { k: `TTWO −${ttwoX}%`, cash: null, ttwo: ttwoMonths(initial, monthly, base, live, live * (1 - ttwoX / 100)), ttwoOnly: true },
  ];

  const scen = rows.map((r) => `<tr>
      <th scope="row">${esc(r.k)}</th>
      <td data-label="Solo aportes">${r.ttwoOnly ? "—" : reachLabel(r.cash, start)}</td>
      <td data-label="Con TTWO">${reachLabel(r.ttwo, start)}</td>
    </tr>`).join("");

  const ttwoNote = live
    ? `Supuesto de TTWO: ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(live)} a ${usd(target)} a 24 meses).`
    : "Sin precio de TTWO: solo se muestran los aportes.";

  out.innerHTML = `
    ${win}
    <div class="m-head">
      <div class="k">Meta</div>
      <div class="v">${usd(base)}</div>
      <div class="s">${ars(goal.arsN)} · ${esc(goal.label)}</div>
    </div>
    ${bar}
    <div class="m-reach">
      <div class="m-cell"><span>Solo con aportes</span><strong class="${cash === null ? "down" : "up"}">${reachLabel(cash, start)}</strong></div>
      <div class="m-cell"><span>Con el supuesto de TTWO</span><strong class="${withT === null ? "down" : "up"}">${reachLabel(withT, start)}</strong></div>
    </div>
    <p class="fine-inline">${esc(ttwoNote)} Tope de la cuenta: 24 meses.</p>
    <h4 class="cmp-list-title">Escenarios</h4>
    <div class="table-wrap"><table class="m-scen">
      <thead><tr><th>Escenario</th><th>Solo aportes</th><th>Con TTWO</th></tr></thead>
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
