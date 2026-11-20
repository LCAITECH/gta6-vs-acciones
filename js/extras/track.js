// Seguimiento con demora para no mandar un evento por cada tecla.
import { G } from "./acceso.js";
const tTimers = {};
export function debounceTrack(name) {
  clearTimeout(tTimers[name]);
  tTimers[name] = setTimeout(() => G().track(name), 3000);
}
