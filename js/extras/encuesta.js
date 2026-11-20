// Encuesta «PC o consola»: botones, resultados en vivo y voto.
import { G } from "./acceso.js";
const API = "https://gta6-analytics.lcaitech.workers.dev";

// ================= ENCUESTA =================
const POLL = "pc-o-consola";
const POLL_OPTS = [
  ["consola", "Ya compré consola para esto exclusivo"],
  ["pc", "Espero el de PC"],
  ["acciones", "Compro acciones de Take-Two mientras jaja"],
  ["ambas", "Ambas cosas"],
  ["tengo-todo", "Tengo consola y PC lista"],
];
function pollRoots() { return [...document.querySelectorAll("[data-poll-root]")]; }
function setPollStatus(msg) {
  document.querySelectorAll(".poll-status").forEach((el) => { el.textContent = msg; });
}
export function renderPollButtons() {
  const voted = localStorage.getItem("gta6-poll-" + POLL);
  const html = POLL_OPTS.map(([k, l]) => `<button type="button" class="poll-btn${voted === k ? " chosen" : ""}" data-opt="${k}"${voted ? " disabled" : ""}>${l}</button>`).join("");
  pollRoots().forEach((root) => {
    const opts = root.querySelector(".poll-options");
    if (opts) opts.innerHTML = html;
  });
}
let pollFirstPaint = true;
function renderPollResults(d) {
  const voted = localStorage.getItem("gta6-poll-" + POLL);
  const total = d.total || 0;
  const rows = POLL_OPTS.map(([k, l]) => {
    const n = (d.counts && d.counts[k]) || 0; const pct = total ? Math.round((n / total) * 100) : 0;
    return `<div class="poll-row${voted === k ? " mine" : ""}"><div class="poll-label"><span>${l}${voted === k ? " · tu voto" : ""}</span><span>${pct}% (${n})</span></div><div class="poll-bar"><div data-pct="${pct}" style="width:${pollFirstPaint ? 0 : pct}%"></div></div></div>`;
  }).join("") + `<p class="muted">${total} voto${total === 1 ? "" : "s"} en total. Un voto por navegador; no guardamos datos personales.</p>`;
  pollRoots().forEach((root) => {
    const box = root.querySelector(".poll-results");
    if (!box) return;
    box.innerHTML = rows;
    box.hidden = false;
  });
  const grow = () => document.querySelectorAll(".poll-bar div[data-pct]").forEach((el) => { el.style.width = el.dataset.pct + "%"; });
  if (pollFirstPaint) {
    pollFirstPaint = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (motion) grow();
    else requestAnimationFrame(() => requestAnimationFrame(grow));
  }
}
async function loadPollResults() {
  try {
    const res = await fetch(`${API}/poll/results?poll=${POLL}`, { cache: "no-store" });
    if (res.ok) renderPollResults(await res.json());
  } catch { /* offline */ }
}
export function startPollLive() {
  loadPollResults();
  if (startPollLive.timer) return;
  startPollLive.timer = setInterval(() => {
    if (document.visibilityState === "visible") loadPollResults();
  }, 30000);
}
export async function vote(opt) {
  if (localStorage.getItem("gta6-poll-" + POLL)) return;
  setPollStatus("Enviando…");
  try {
    const res = await fetch(`${API}/poll`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ poll: POLL, option: opt }) });
    if (!res.ok) throw new Error(res.status);
    localStorage.setItem("gta6-poll-" + POLL, opt);
    G().track("poll_vote");
    setPollStatus("¡Gracias por votar!");
    renderPollButtons();
    renderPollResults(await res.json());
  } catch (e) {
    setPollStatus("No se pudo registrar el voto. Probá de nuevo en un rato.");
  }
}
