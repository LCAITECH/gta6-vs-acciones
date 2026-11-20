// Activo elegido (TTWO, BTC o ambos).
import { $ } from "./base.js";
import { estado } from "./estado.js";
export const ASSET_SHORT = { ttwo: "t", btc: "b", both: "2" };

export function assetMode() { return estado.asset; }

export function fijarActivo(mode) {
  if (!["ttwo", "btc", "both"].includes(mode)) return false;
  estado.asset = mode;
  const box = $("asset-toggle");
  if (box) {
    box.querySelectorAll("[data-asset]").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.asset === mode ? "true" : "false");
    });
  }
  return true;
}
