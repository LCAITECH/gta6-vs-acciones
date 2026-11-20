// ¿Me conviene? Tabla comparativa de plataformas con el precio de hoy.
import { $ } from "./acceso.js";
import { ars } from "./formato.js";
import { convPrice } from "./ofertas.js";
export function renderConviene() {
  const table = $("conv-table");
  if (!table) return;
  const slimD = convPrice("ps5-digital");
  const slimS = convPrice("ps5-standard");
  const pro = convPrice("ps5-pro");
  const xs = convPrice("xbox-s");
  const xx = convPrice("xbox-x");
  const slimPrice = slimD && slimS
    ? `Digital ${ars(slimD.ars)} <span class="tag">${slimD.how}</span>Standard ${ars(slimS.ars)} <span class="tag">${slimS.how}</span>`
    : "—";
  const rows = [
    {
      name: "PS5 Slim (Digital / Standard)",
      render: "1440p", out: "4K", up: "TAA espacial de Rockstar",
      fps: "30 fps (tirones a los 20 altos; peor caso, 20 bajos)",
      stab: "Sólida, un poco más floja que la Pro",
      price: slimPrice,
      verd: "Se ve y se juega bien; la imagen es más blanda que en la Pro y puede haber algún bajón.",
    },
    {
      name: "PS5 Pro", best: true,
      render: "1440p", out: "4K", up: "PSSR (upscaler de IA temporal)",
      fps: "30 fps (bajones cortos a 24 fps con lanzagranadas; recupera rápido)",
      stab: "La más firme (~75 h de prueba en 30, casi siempre)",
      price: pro ? `${ars(pro.ars)} <span class="tag">${pro.how}</span>` : "—",
      verd: "La mejor opción según DF: imagen tipo 4K, sombras con ray tracing y el 30 fps más estable.",
    },
    {
      name: "Xbox Series X",
      render: "1440p", out: "4K", up: "TAA espacial de Rockstar",
      fps: "30 fps (tirones a los 20 altos; peor caso, 20 bajos)",
      stab: "A la par de la PS5 Slim (el sistema permite un contenedor VRR a 120 Hz)",
      price: xx ? `${ars(xx.ars)} <span class="tag">${xx.how}</span>` : "—",
      verd: "Se ve y se juega bien, al nivel de la PS5 Slim; misma resolución y un upscaler espacial similar.",
    },
    {
      name: "Xbox Series S",
      render: "720p", out: "~1080p", up: "AMD FSR 4 (temporal)",
      fps: "A menudo 25–30 fps (peor caso ~20; con explosivos puede irse a los teens)",
      stab: "La menos estable de las cuatro: el 30 más flojo",
      price: xs ? `${ars(xs.ars)} <span class="tag">${xs.how}</span>` : "—",
      verd: "La más difícil de recomendar según DF: salida a 1080p, recortes visuales y bajones a los 20 medios.",
    },
    {
      name: "Xbox One (solo nube)",
      render: "720p (Series S, en el servidor)", out: "~1080p, comprimido por el stream", up: "FSR 4 en el servidor + compresión de la nube",
      fps: "El de Series S, vía Xbox Cloud Gaming (sin medición de DF al 18/11/2026)",
      stab: "Depende de tu conexión; no hay test publicado del stream",
      price: "— <span class=\"tag\">no hay versión nativa; usás la consola que ya tenés</span>",
      verd: "La única forma de jugarlo en One. Ajustes de Series S; Rockstar advierte que la conexión puede afectar el rendimiento. DF no midió el stream (nota del 10/11/2026).",
    },
    {
      name: "PC",
      render: "TBA", out: "TBA", up: "TBA",
      fps: "TBA",
      stab: "TBA",
      price: "— <span class=\"tag\">sin versión anunciada</span>",
      verd: "No hay fecha oficial. Lo de 2027 es rumor; no lo damos por hecho.",
    },
  ];
  table.innerHTML = `<thead><tr><th>Plataforma</th><th>Render / salida</th><th>Upscaler</th><th>FPS</th><th>Estabilidad</th><th class="n">Precio ARS hoy</th><th>Veredicto</th></tr></thead><tbody>` +
    rows.map((row) => `<tr${row.best ? ' class="conv-best"' : ""}>
      <th scope="row">${row.name}${row.best ? ' <span class="conv-badge" title="Según Digital Foundry, 18/11/2026">mejor opción</span>' : ""}</th>
      <td data-label="Render / salida">${row.render} → ${row.out}</td>
      <td data-label="Upscaler">${row.up}</td>
      <td data-label="FPS">${row.fps}</td>
      <td data-label="Estabilidad">${row.stab}</td>
      <td class="n" data-label="Precio ARS hoy">${row.price}</td>
      <td data-label="Veredicto">${row.verd}</td>
    </tr>`).join("") + `</tbody>`;
}
