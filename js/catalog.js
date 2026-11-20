// Catálogo único de precios: data/hardware-prices.json.
// Lo comparten Comparar / Armar PC (pc-builder.js) y La jodita / Metas (extras.js, goals.js),
// así un mismo producto muestra el mismo precio en todas las vistas. Una sola descarga por carga de página.
const HW_URL = "data/hardware-prices.json";
let pending = null;

export function loadHardware() {
  if (!pending) {
    pending = fetch(HW_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("hardware-prices");
        return res.json();
      })
      .then((hw) => ({ hw, byId: Object.fromEntries((hw.items || []).map((it) => [it.id, it])) }))
      .catch((err) => {
        pending = null; // permite reintentar si falló
        throw err;
      });
  }
  return pending;
}
