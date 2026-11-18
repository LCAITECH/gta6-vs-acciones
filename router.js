// Hash routing between views: #calculadora, #jodita, #desafio, #encuesta, #fuentes.
// Any other hash (e.g. #pago, #esperar) opens the view that contains that element and scrolls to it.
const VIEWS = ["calculadora", "jodita", "conviene", "ttwo", "desafio", "encuesta", "fuentes"];
let current = null;

function viewFor(hash) {
  const id = decodeURIComponent((hash || "").replace(/^#/, ""));
  if (!id) return { view: "calculadora", el: null };
  if (VIEWS.includes(id)) return { view: id, el: null };
  const el = document.getElementById(id);
  const v = el && el.closest(".view");
  return v ? { view: v.dataset.view, el } : { view: "calculadora", el: null };
}

function track(name) {
  const g = window.__gta;
  if (g && g.track) g.track(name);
  else setTimeout(() => track(name), 300);
}

function show(hash, initial) {
  const { view, el } = viewFor(hash);
  const changed = view !== current;
  document.querySelectorAll(".view").forEach((v) => {
    const on = v.dataset.view === view;
    v.hidden = !on;
    if (on && changed && !initial) { v.classList.remove("view-in"); void v.offsetWidth; v.classList.add("view-in"); }
  });
  document.querySelectorAll("[data-tab]").forEach((a) => {
    if (a.dataset.tab === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const titles = { calculadora: "Calculadora", jodita: "La jodita", conviene: "¿Me conviene?", ttwo: "TTWO", desafio: "Desafío PC", encuesta: "Encuesta", fuentes: "Fuentes" };
  document.title = `${titles[view]} · GTA 6 vs. acciones de Take-Two — LCA ITECH`;
  if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  else if (changed && !initial) {
    const tabs = document.querySelector(".tabs");
    const top = tabs ? tabs.getBoundingClientRect().top + window.scrollY - 8 : 0;
    window.scrollTo({ top: Math.min(window.scrollY, top), behavior: "auto" });
  }
  const tab = document.querySelector(`[data-tab="${view}"]`);
  if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  if (changed) { current = view; track("view_" + view); window.dispatchEvent(new CustomEvent("gta:view", { detail: view })); }
}

window.addEventListener("hashchange", () => show(location.hash, false));
show(location.hash, true);
