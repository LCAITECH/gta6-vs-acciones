// Vista "Lo oficial": tráileres oficiales de Rockstar Games incrustados desde YouTube, y links a su sitio.
// No alojamos ni copiamos nada de Rockstar: el video se pide a YouTube recién cuando la persona toca «Ver»
// (modo de privacidad ampliada, youtube-nocookie.com).
//
// IDs verificados el 19/11/2026 contra el canal oficial "Rockstar Games" (feed público de YouTube) y oEmbed
// (autor "Rockstar Games" y video incrustable). Cuando un título tiene varias subidas (variantes), se eligió la
// principal por vistas.
const TRAILERS = [
  { id: "rz1B4B2yBZY", label: "Tráiler de lanzamiento", date: "15/10/2026", title: "Grand Theft Auto VI Launch Trailer" },
  { id: "T95WGWkx7P0", label: "Ya disponible", date: "19/11/2026", title: "Grand Theft Auto VI Now Available" },
  { id: "tJbzMqJGH4k", label: "Mirada extendida", date: "28/08/2026", title: "Grand Theft Auto VI: An Extended Look" },
  { id: "VQRLujxTm3c", label: "Tráiler 2", date: "05/2025", title: "Grand Theft Auto VI Trailer 2" },
  { id: "QdBZY2fkU-0", label: "Tráiler 1", date: "12/2023", title: "Grand Theft Auto VI Trailer 1" },
];

const $ = (id) => document.getElementById(id);
const track = (name) => window.__gta?.track?.(name);

let current = 0;
let loaded = false; // ¿ya se pidió el video a YouTube?

function renderChips() {
  $("trailer-chips").innerHTML = TRAILERS
    .map((t, i) => `<button type="button" data-i="${i}" aria-pressed="${i === current ? "true" : "false"}">${t.label}</button>`)
    .join("");
}

function renderMeta() {
  const t = TRAILERS[current];
  $("video-meta").innerHTML = `${t.title} · ${t.date} · Rockstar Games en YouTube. ` +
    `<a href="https://www.youtube.com/watch?v=${t.id}" target="_blank" rel="noopener noreferrer">Si no carga, abrilo en YouTube</a>.`;
}

function renderFrame(autoplay) {
  const t = TRAILERS[current];
  const frame = $("video-frame");
  frame.textContent = "";
  if (!loaded) {
    // Fachada: todavía no se le pide nada a YouTube.
    const b = document.createElement("button");
    b.type = "button";
    b.className = "video-play";
    b.id = "video-play";
    b.textContent = `▶ Ver: ${t.label}`;
    frame.appendChild(b);
    return;
  }
  const f = document.createElement("iframe");
  f.src = `https://www.youtube-nocookie.com/embed/${t.id}?rel=0${autoplay ? "&autoplay=1" : ""}`;
  f.title = `${t.title} (Rockstar Games)`;
  f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
  f.referrerPolicy = "strict-origin-when-cross-origin";
  f.allowFullscreen = true;
  frame.appendChild(f);
}

function select(i) {
  if (i === current || !TRAILERS[i]) return;
  current = i;
  renderChips();
  renderMeta();
  renderFrame(true); // si ya estaba cargado, cambia de video; si no, solo actualiza la fachada
  if (loaded) track("trailer_play");
}

function init() {
  if (!$("video-frame")) return;
  renderChips();
  renderMeta();
  renderFrame(false);

  $("trailer-chips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) select(Number(b.dataset.i));
  });
  $("video-frame").addEventListener("click", (e) => {
    if (!e.target.closest("#video-play")) return;
    loaded = true;
    renderFrame(true);
    track("trailer_play");
  });

  // Links oficiales (no son de referido): se cuenta el clic, nada más.
  $("oficial").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-track]");
    if (a) track(a.dataset.track);
  });
}

init();
