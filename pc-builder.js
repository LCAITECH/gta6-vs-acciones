// Comparador placa vs consola, armador de PC y sub-pestañas del Desafío Gordo Compu.
import { renderCaseShell, syncCase } from "./case3d.js";

const $ = (id) => document.getElementById(id);
const G = () => window.__gta;
const HW_URL = "data/hardware-prices.json";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ars(n) { return `ARS ${Math.round(n).toLocaleString("es-AR")}`; }
function usd(n) {
  const fmt = G()?.fmtAR;
  return fmt ? `US$ ${fmt.format(n)}` : `US$ ${n.toFixed(2)}`;
}

let hw = null;
let byId = {};
let caseReady = false;
let compareTracked = false;
const state = { gpu: "gpu-rtx-5060-8", console: "con-xbox-s", preset: null };
const build = { cpu: "cpu-r5-5500", mobo: "mobo-a520", ram: "ram-ddr4-16-3200", gpu: "gpu-rx-7600-8", psu: "psu-550", ssd: "ssd-500", case: "case-n5" };

function mep() {
  const g = G();
  if (g && typeof g.fxVenta === "function") {
    const v = g.fxVenta("bolsa");
    if (v) return v;
  }
  return null;
}
function ttwo() {
  const g = G();
  if (g?.latestQuote && typeof g.latestQuote.price === "number") return g.latestQuote.price;
  const q = g?.quotes;
  return q && q.length ? q[q.length - 1].close : null;
}
function toUsd(arsAmount) {
  const r = mep();
  return r ? arsAmount / r : null;
}
function sharesOf(arsAmount) {
  const u = toUsd(arsAmount);
  const p = ttwo();
  return u && p ? u / p : null;
}

function parseArt(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s*[~ ]\s*(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [ , dd, mm, yyyy, hh = "12", mi = "00"] = m;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00-03:00`);
}
function ago(art, utc) {
  let t = utc ? Date.parse(utc) : NaN;
  if (!Number.isFinite(t)) {
    const d = parseArt(art);
    t = d ? d.getTime() : NaN;
  }
  if (!Number.isFinite(t)) return art ? `el ${art}` : "en una fecha no indicada";
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 90) return "hace un momento";
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 36) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}

function compareAmount(it) {
  if (!it) return 0;
  if (typeof it.comparePrice === "number") return it.comparePrice;
  if (typeof it.cashPrice === "number") return it.cashPrice;
  return it.price || 0;
}

function itemsOf(kind) {
  return (hw?.items || []).filter((x) => x.kind === kind);
}

function cheapestOfGroup() {
  const map = new Map();
  for (const it of itemsOf("gpu")) {
    const cur = map.get(it.group);
    if (!cur || compareAmount(it) < compareAmount(cur)) map.set(it.group, it);
  }
  return [...map.values()].sort((a, b) => compareAmount(a) - compareAmount(b));
}

function fillSelect(sel, list, emptyLabel) {
  const cur = sel.value;
  const opts = [];
  if (emptyLabel != null) opts.push(`<option value="">${esc(emptyLabel)}</option>`);
  for (const it of list) {
    const tag = it.status === "stale" ? " · último verificado" : "";
    opts.push(`<option value="${esc(it.id)}">${esc(it.label)} · ${ars(compareAmount(it))}${tag}</option>`);
  }
  sel.innerHTML = opts.join("");
  if (cur && [...sel.options].some((o) => o.value === cur)) sel.value = cur;
}

function compatErrors() {
  const cpu = byId[build.cpu];
  const mobo = byId[build.mobo];
  const ram = byId[build.ram];
  const errs = [];
  if (cpu && mobo && cpu.socket && mobo.socket && cpu.socket !== mobo.socket) {
    errs.push(`La mother (${mobo.socket}) no calza con el micro (${cpu.socket}).`);
  }
  if (ram && mobo && ram.ramType && mobo.ramType && ram.ramType !== mobo.ramType) {
    errs.push(`La memoria es ${ram.ramType} y la mother admite ${mobo.ramType}.`);
  }
  return errs;
}

function selectedParts() {
  return ["cpu", "mobo", "ram", "gpu", "psu", "ssd", "case"]
    .map((k) => byId[build[k]])
    .filter(Boolean);
}

function buildTotal() {
  return selectedParts().reduce((s, it) => s + (it.price || 0), 0);
}

function applyPreset(id, silent) {
  const p = (hw.presets || []).find((x) => x.id === id);
  if (!p) return;
  Object.assign(build, p.parts);
  state.preset = id;
  document.querySelectorAll("#d-presets [data-preset]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.preset === id ? "true" : "false");
  });
  syncBuildSelects();
  renderBuild();
  if (!silent) {
    const g = G();
    if (g?.track) g.track("build_pc");
  }
}

function syncBuildSelects() {
  const cpu = byId[build.cpu];
  const ram = byId[build.ram];
  const cpus = itemsOf("cpu");
  const rams = itemsOf("ram");
  let mobos = itemsOf("mobo");
  if (cpu?.socket) mobos = mobos.filter((m) => !m.socket || m.socket === cpu.socket);
  if (ram?.ramType) mobos = mobos.filter((m) => !m.ramType || m.ramType === ram.ramType);
  fillSelect($("b-cpu"), cpus);
  fillSelect($("b-ram"), rams);
  fillSelect($("b-mobo"), mobos, "Elegí una mother compatible");
  fillSelect($("b-gpu"), cheapestOfGroup().concat(
    itemsOf("gpu").filter((g) => !cheapestOfGroup().some((c) => c.id === g.id))
      .sort((a, b) => a.price - b.price)
  ).filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i));
  fillSelect($("b-psu"), itemsOf("psu"), "Sin fuente");
  fillSelect($("b-ssd"), itemsOf("ssd"), "Sin disco");
  fillSelect($("b-case"), itemsOf("case"), "Sin gabinete");
  for (const [id, key] of [["b-cpu", "cpu"], ["b-mobo", "mobo"], ["b-ram", "ram"], ["b-gpu", "gpu"], ["b-psu", "psu"], ["b-ssd", "ssd"], ["b-case", "case"]]) {
    const el = $(id);
    if (el && build[key] && [...el.options].some((o) => o.value === build[key])) el.value = build[key];
    else if (el && !build[key]) el.value = "";
  }
  // If filtered mobos dropped the current one, keep the value as a disabled hint via renderBuild errors.
  if (build.mobo && $("b-mobo") && ![...$("b-mobo").options].some((o) => o.value === build.mobo)) {
    const m = byId[build.mobo];
    if (m) {
      const o = document.createElement("option");
      o.value = m.id;
      o.textContent = `${m.label} · no compatible`;
      $("b-mobo").appendChild(o);
      $("b-mobo").value = m.id;
    }
  }
}

function renderBuild() {
  const errs = compatErrors();
  const parts = selectedParts();
  const total = buildTotal();
  const u = toUsd(total);
  const sh = sharesOf(total);
  const p = ttwo();
  const r = mep();
  const box = $("b-out");
  if (!box) return;
  const rows = parts.map((it) => {
    const stale = it.status === "stale" ? " · último verificado" : "";
    const qty = it.qty && it.qty > 1 ? ` ×${it.qty}` : "";
    return `<tr>
      <th scope="row">${esc(it.label)}${qty}</th>
      <td data-label="Precio" class="n">${ars(it.price)}${stale}</td>
      <td data-label="Tienda"><a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.store)}</a><span class="tag">${esc(it.fetchedAtArt || "")}</span></td>
    </tr>`;
  }).join("");
  const warn = errs.length
    ? `<p class="danger-line" role="alert">${errs.map(esc).join(" ")}</p>`
    : `<p class="muted">Socket y tipo de RAM compatibles.</p>`;
  box.innerHTML = `
    ${warn}
    <div class="table-wrap"><table class="build-table">
      <thead><tr><th>Componente</th><th class="n">ARS</th><th>Fuente</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th>Total</th><td class="n">${ars(total)}</td><td>${u != null ? `${usd(u)} al MEP${r ? ` (${r.toLocaleString("es-AR")})` : ""}` : "sin cotización MEP"}</td></tr></tfoot>
    </table></div>
    <p class="muted">${sh != null ? `Equivalen a <strong>${sh.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</strong> acciones de TTWO a ${usd(p)}.` : "Falta el precio de TTWO para pasar el total a acciones."}</p>`;
  const btn = $("b-use-goal");
  if (btn) btn.disabled = !parts.length || !!errs.length || !total;
  if (caseReady) {
    const ram = byId[build.ram];
    const gpu = byId[build.gpu];
    const cpu = byId[build.cpu];
    syncCase({
      mobo: !!byId[build.mobo],
      cpu: !!cpu,
      cpuLabel: cpu ? cpu.label : "CPU",
      ram: !!ram,
      ramLabel: ram ? (ram.ramType || "RAM") : "RAM",
      ramQty: ram?.qty || 1,
      gpu: !!gpu,
      gpuLabel: gpu ? gpu.label : "GPU",
    });
  }
}

function useAsGoal() {
  const errs = compatErrors();
  const total = buildTotal();
  if (errs.length || !total) return;
  const names = selectedParts().map((p) => p.label).join(" + ");
  const label = `Tu armado · ${ars(total)} (${(hw && hw.updatedAtArt) || "hoy"})`;
  if (typeof window.__gtaSetBuildGoal === "function") {
    window.__gtaSetBuildGoal(label, total, "ARS", names);
  }
  const g = G();
  if (g?.track) g.track("build_pc");
  const tab = document.querySelector('.d-subtabs [data-pane="meta"]');
  if (tab) tab.click();
}

function metrics(it) {
  const arsN = compareAmount(it);
  const u = toUsd(arsN);
  const sh = sharesOf(arsN);
  return { arsN, u, sh };
}

function renderCompare() {
  const stamp = $("cmp-stamp");
  if (stamp && hw) {
    const staleN = (hw.items || []).filter((x) => x.status === "stale").length;
    stamp.innerHTML = `Actualizado ${ago(hw.updatedAtArt, hw.updatedAtUtc)} <span class="tag">${esc(hw.updatedAtArt)} hora Argentina</span>${staleN ? ` · ${staleN} ficha${staleN === 1 ? "" : "s"} con el último valor verificado` : ""}.`;
  }
  const gpus = cheapestOfGroup();
  const consoles = itemsOf("console");
  const gpuSel = $("cmp-gpu");
  const conSel = $("cmp-console");
  if (gpuSel && !gpuSel.dataset.ready) {
    fillSelect(gpuSel, gpus);
    fillSelect(conSel, consoles);
    if ([...gpuSel.options].some((o) => o.value === state.gpu)) gpuSel.value = state.gpu;
    if ([...conSel.options].some((o) => o.value === state.console)) conSel.value = state.console;
    gpuSel.dataset.ready = "1";
    conSel.dataset.ready = "1";
  }
  state.gpu = gpuSel?.value || state.gpu;
  state.console = conSel?.value || state.console;
  const gpu = byId[state.gpu];
  const con = byId[state.console];
  const cards = $("cmp-cards");
  if (cards && gpu && con) {
    cards.innerHTML = [gpu, con].map((it, i) => {
      const m = metrics(it);
      const how = it.compareHow ? ` (${it.compareHow})` : "";
      const stale = it.status === "stale" ? `<span class="tag">último verificado ${esc(it.fetchedAtArt || "")}</span>` : `<span class="tag">${esc(it.fetchedAtArt || "")}</span>`;
      return `<article class="cmp-card ${i === 0 ? "gpu" : "console"}">
        <h4>${esc(it.label)}</h4>
        <p class="cmp-product">${esc(it.product)}</p>
        <p class="cmp-price">${ars(m.arsN)}<em>${how}</em></p>
        <ul>
          <li>${m.u != null ? usd(m.u) + " al dólar MEP" : "sin cotización MEP"}</li>
          <li>${m.sh != null ? `${m.sh.toLocaleString("es-AR", { maximumFractionDigits: 2 })} acciones TTWO` : "sin precio de TTWO"}</li>
        </ul>
        <p class="muted"><a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.store)}</a> ${stale}</p>
        ${it.note ? `<p class="fine-inline">${esc(it.note)}</p>` : ""}
      </article>`;
    }).join("");
    const gm = metrics(gpu);
    const cm = metrics(con);
    const diff = gm.arsN - cm.arsN;
    const cheaper = diff < 0 ? "la placa" : diff > 0 ? "la consola" : "salen lo mismo";
    $("cmp-delta").innerHTML = diff === 0
      ? `Saldrían lo mismo: ${ars(gm.arsN)}.`
      : `La diferencia es <strong>${ars(Math.abs(diff))}</strong> (${Math.abs(diff / Math.max(cm.arsN, 1) * 100).toFixed(0)}%). Hoy sale menos ${cheaper}.`;
  }
  const table = $("cmp-table");
  if (table) {
    const p = ttwo();
    const rows = [...gpus, ...consoles].map((it) => {
      const m = metrics(it);
      const stale = it.status === "stale" ? " último verificado" : "";
      return `<tr>
        <th scope="row">${esc(it.label)}<span class="tag">${esc(it.store)}${stale}</span></th>
        <td data-label="Precio" class="n">${ars(m.arsN)}${it.compareHow ? `<span class="tag">${esc(it.compareHow)}</span>` : ""}</td>
        <td data-label="MEP" class="n">${m.u != null ? usd(m.u) : "—"}</td>
        <td data-label="Acciones" class="n">${m.sh != null ? m.sh.toLocaleString("es-AR", { maximumFractionDigits: 2 }) : "—"}</td>
        <td data-label="Ficha"><a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">ver</a> · ${esc(it.fetchedAtArt || "")}</td>
      </tr>`;
    }).join("");
    table.innerHTML = `
      <div class="table-wrap"><table class="cmp-grid">
        <thead><tr><th>Producto</th><th class="n">ARS</th><th class="n">USD (MEP)</th><th class="n">Acciones TTWO${p ? ` a ${usd(p)}` : ""}</th><th>Fuente</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }
}

function showPane(name) {
  document.querySelectorAll(".d-subtabs [data-pane]").forEach((b) => {
    b.setAttribute("aria-selected", b.dataset.pane === name ? "true" : "false");
  });
  document.querySelectorAll(".d-pane").forEach((p) => {
    p.hidden = p.dataset.pane !== name;
  });
  if (name === "comparar") {
    renderCompare();
    if (!compareTracked) {
      compareTracked = true;
      G()?.track?.("compare_view");
    }
  }
  if (name === "armar") {
    if (!caseReady) {
      renderCaseShell($("case3d"));
      caseReady = true;
    }
    renderBuild();
  }
}

async function loadHw() {
  const res = await fetch(HW_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("hardware-prices");
  hw = await res.json();
  byId = Object.fromEntries((hw.items || []).map((it) => [it.id, it]));
}

function bind() {
  $("d-subtabs")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pane]");
    if (b) showPane(b.dataset.pane);
  });
  $("cmp-gpu")?.addEventListener("change", renderCompare);
  $("cmp-console")?.addEventListener("change", renderCompare);
  $("d-presets")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]");
    if (b) applyPreset(b.dataset.preset);
  });
  ["b-cpu", "b-mobo", "b-ram", "b-gpu", "b-psu", "b-ssd", "b-case"].forEach((id) => {
    $(id)?.addEventListener("change", () => {
      const key = id.slice(2);
      build[key] = $(id).value;
      state.preset = null;
      document.querySelectorAll("#d-presets [data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
      if (id === "b-cpu" || id === "b-ram") syncBuildSelects();
      renderBuild();
    });
  });
  $("b-use-goal")?.addEventListener("click", useAsGoal);
  $("b-form")?.addEventListener("submit", (e) => e.preventDefault());
}

async function init() {
  if (!$("desafio")) return;
  try {
    await loadHw();
  } catch (e) {
    const el = $("cmp-stamp");
    if (el) el.textContent = "No se pudo cargar el catálogo de precios verificados.";
    return;
  }
  bind();
  syncBuildSelects();
  document.querySelectorAll("#d-presets [data-preset]").forEach((b) => {
    const p = (hw.presets || []).find((x) => x.id === b.dataset.preset);
    if (p) b.textContent = p.label;
  });
  // Default preset básico so the 3D case and totals have a starting point.
  applyPreset("basico", true);
  renderCompare();
  const wait = () => (G()?.latestQuote || G()?.quotes?.length ? (renderCompare(), renderBuild()) : setTimeout(wait, 200));
  wait();
  G()?.listeners?.push(() => { renderCompare(); renderBuild(); });
  window.addEventListener("gta:view", (e) => {
    if (e.detail === "desafio" && !document.querySelector('.d-pane[data-pane="comparar"]').hidden) {
      if (!compareTracked) { compareTracked = true; G()?.track?.("compare_view"); }
    }
  });
}

init();
