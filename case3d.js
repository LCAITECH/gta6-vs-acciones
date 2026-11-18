// Gabinete 3D liviano (CSS 3D, sin Three.js): se carga solo al abrir Armar PC.
// respeta prefers-reduced-motion; si no hay transforms 3D, se muestra el hero 2D.

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function supports3d() {
  const el = document.createElement("div");
  el.style.transformStyle = "preserve-3d";
  return el.style.transformStyle === "preserve-3d";
}

export function renderCaseShell(root) {
  if (!root) return;
  if (!supports3d()) {
    root.innerHTML = `<div class="case3d-fallback"><img src="assets/desafio-pc-640.jpg" width="640" height="360" alt="PC gamer neón (imagen del desafío)" loading="lazy"><p class="muted">Tu navegador no arma el gabinete 3D; te dejamos la imagen del desafío.</p></div>`;
    return;
  }
  root.innerHTML = `
    <div class="case3d-scene" id="case3d-scene" tabindex="0" role="img" aria-label="Gabinete gamer 3D. Arrastrá para girar.">
      <div class="case3d-rig" id="case3d-rig">
        <div class="case3d-box">
          <div class="case3d-face case3d-front"></div>
          <div class="case3d-face case3d-back"></div>
          <div class="case3d-face case3d-left"></div>
          <div class="case3d-face case3d-right"></div>
          <div class="case3d-face case3d-top"></div>
          <div class="case3d-face case3d-bottom"></div>
          <div class="case3d-part case3d-mobo" data-part="mobo" hidden></div>
          <div class="case3d-part case3d-cpu" data-part="cpu" hidden><span>CPU</span></div>
          <div class="case3d-part case3d-ram" data-part="ram" hidden><span class="case3d-ram-label">RAM</span></div>
          <div class="case3d-part case3d-ram case3d-ram-b" data-part="ram2" hidden></div>
          <div class="case3d-part case3d-gpu" data-part="gpu" hidden><span class="case3d-gpu-label">GPU</span></div>
        </div>
      </div>
    </div>
    <p class="fine-inline" id="case3d-hint">${reduced() ? "Vista fija (pediste menos movimiento)." : "Arrastrá para girar el gabinete."}</p>`;
  bindCase(root);
}

let bound = false;
let yaw = -28;
let pitch = 16;
let dragging = false;
let lastX = 0;
let lastY = 0;
let tracked = false;

function applyRot() {
  const rig = document.getElementById("case3d-rig");
  if (!rig) return;
  pitch = Math.max(-22, Math.min(28, pitch));
  rig.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
}

function bindCase(root) {
  if (bound) {
    applyRot();
    return;
  }
  bound = true;
  const scene = root.querySelector("#case3d-scene");
  if (!scene) return;
  applyRot();
  if (reduced()) return;

  const down = (x, y) => { dragging = true; lastX = x; lastY = y; scene.classList.add("dragging"); };
  const move = (x, y) => {
    if (!dragging) return;
    yaw += (x - lastX) * 0.5;
    pitch -= (y - lastY) * 0.4;
    lastX = x; lastY = y;
    applyRot();
    if (!tracked) {
      tracked = true;
      const g = window.__gta;
      if (g && g.track) g.track("case3d_interact");
    }
  };
  const up = () => { dragging = false; scene.classList.remove("dragging"); };

  scene.addEventListener("pointerdown", (e) => { scene.setPointerCapture(e.pointerId); down(e.clientX, e.clientY); });
  scene.addEventListener("pointermove", (e) => move(e.clientX, e.clientY));
  scene.addEventListener("pointerup", up);
  scene.addEventListener("pointercancel", up);
  scene.addEventListener("lostpointercapture", up);
}

export function syncCase(parts) {
  const root = document.getElementById("case3d");
  if (!root) return;
  const set = (name, on, label) => {
    root.querySelectorAll(`[data-part="${name}"]`).forEach((el) => {
      const show = !!on;
      const was = !el.hidden;
      el.hidden = !show;
      el.classList.toggle("in", show);
      if (show && !was && !reduced()) {
        el.classList.remove("pop");
        void el.offsetWidth;
        el.classList.add("pop");
      }
      if (label) {
        const tag = el.querySelector("span");
        if (tag) tag.textContent = label;
      }
    });
  };
  set("mobo", parts.mobo, "Mother");
  set("cpu", parts.cpu, parts.cpuLabel || "CPU");
  set("ram", parts.ram, parts.ramLabel || "RAM");
  set("ram2", parts.ram && parts.ramQty > 1);
  set("gpu", parts.gpu, parts.gpuLabel || "GPU");
}
