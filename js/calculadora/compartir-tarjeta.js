// Imagen para compartir (canvas).
import { fmtAR, money } from "./base.js";
import { SITE_URL, shareFacts } from "./compartir-texto.js";
import { estado } from "./estado.js";
let logoImg = null;
function loadLogo() {
  if (logoImg) return Promise.resolve(logoImg);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { logoImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/vi-logo.png";
  });
}

export async function drawShareCard(canvas) {
  const W = 1200, H = 675;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const f = shareFacts();
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a0b2e"); sky.addColorStop(0.45, "#7a2a6b"); sky.addColorStop(0.7, "#f4717c"); sky.addColorStop(1, "#ffb36b");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // sun with stripes
  const sx = 930, sy = 470, sr = 210;
  const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
  sun.addColorStop(0, "#ffe9a0"); sun.addColorStop(1, "#f976b0");
  ctx.save(); ctx.shadowColor = "#ffdf80"; ctx.shadowBlur = 80;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = sun; ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#c2457e";
  for (let i = 0; i < 7; i++) ctx.fillRect(sx - sr, sy + 20 + i * 26, sr * 2, 4 + i * 2);
  ctx.restore();
  // ocean
  const sea = ctx.createLinearGradient(0, 560, 0, H);
  sea.addColorStop(0, "#3b1a5a"); sea.addColorStop(1, "#0d0820");
  ctx.fillStyle = sea; ctx.fillRect(0, 560, W, H - 560);
  ctx.strokeStyle = "#f976b055"; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 575 + i * 18); ctx.lineTo(W, 575 + i * 18); ctx.stroke(); }
  // dark panel for readability
  ctx.fillStyle = "rgba(8,5,16,0.78)";
  roundRect(ctx, 40, 40, 760, 595, 28); ctx.fill();
  ctx.strokeStyle = "#f976b0"; ctx.lineWidth = 3; ctx.shadowColor = "#f976b0"; ctx.shadowBlur = 24;
  roundRect(ctx, 40, 40, 760, 595, 28); ctx.stroke(); ctx.shadowBlur = 0;
  // logo
  const logo = await loadLogo();
  if (logo) { ctx.save(); ctx.shadowColor = "#f976b0"; ctx.shadowBlur = 40; ctx.drawImage(logo, 840, 60, 300, 300 * logo.height / logo.width); ctx.restore(); }
  const font = '"Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
  ctx.textBaseline = "alphabetic";
  const fit = (txt, weight, size, fam, maxW) => {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${fam}`; s -= 2; } while (ctx.measureText(txt).width > maxW && s > 14);
  };
  const body = "Figtree, system-ui, sans-serif";
  if (f) {
    const head = `Compré ${f.what} por ${f.paid}`;
    ctx.fillStyle = "#ffdf80"; ctx.save(); ctx.shadowColor = "#f976b0"; ctx.shadowBlur = 14;
    fit(head.toUpperCase(), 800, 44, font, 690); ctx.fillText(head.toUpperCase(), 80, 105); ctx.restore();
    ctx.fillStyle = "#d4cbe0"; ctx.font = `500 19px ${body}`;
    ctx.fillText(`el ${f.date} · ${f.withTax} con impuestos`, 80, 136);
    const line = f.mode === "btc"
      ? "Si hubiera comprado bitcoin (BTC), hoy valdrían:"
      : f.mode === "both"
        ? "Si hubiera puesto esa plata en TTWO o en BTC, hoy valdrían:"
        : "Si hubiera comprado acciones de Take-Two Interactive (TTWO), hoy valdrían:";
    ctx.fillStyle = "#f6f0ea"; fit(line, 500, 24, body, 690);
    ctx.fillText(line, 80, 180);
    if (f.mode === "both" && (f.ttwo || f.btc)) {
      const drawCol = (x0, pack, name, accent) => {
        if (!pack) {
          ctx.fillStyle = "#d4cbe0"; ctx.font = `700 28px ${font}`;
          ctx.fillText(`${name}: sin dato`, x0, 280);
          return;
        }
        const col = pack.up ? "#9ed39a" : "#ff8a9a";
        ctx.fillStyle = accent; ctx.font = `700 22px ${font}`;
        ctx.fillText(name, x0, 220);
        ctx.save(); ctx.shadowColor = pack.up ? "#9ed39a" : accent; ctx.shadowBlur = 22;
        ctx.fillStyle = pack.up ? "#c8f5c3" : "#ffdf80"; ctx.font = `800 64px ${font}`;
        ctx.fillText(pack.valTxt, x0, 290); ctx.restore();
        ctx.fillStyle = col; ctx.font = `700 26px ${font}`;
        ctx.fillText(`${pack.pctTxt}  ·  ${pack.glTxt.toUpperCase()}`, x0, 330);
      };
      drawCol(80, f.ttwo, "TTWO", "#f976b0");
      drawCol(430, f.btc, "BTC", "#3ef0d4");
    } else {
      const col = f.up ? "#9ed39a" : "#ff8a9a";
      ctx.save(); ctx.shadowColor = f.up ? "#9ed39a" : "#f976b0"; ctx.shadowBlur = 30;
      ctx.fillStyle = f.up ? "#c8f5c3" : "#ffdf80"; ctx.font = `800 120px ${font}`;
      ctx.fillText(f.valTxt, 76, 290); ctx.restore();
      ctx.fillStyle = col; ctx.font = `700 40px ${font}`;
      ctx.fillText(`${f.pctTxt}  ·  ${f.glTxt.toUpperCase()}`, 80, 345);
    }
  }
  if (f && f.saveTxt && estado.lastCompare) {
    ctx.fillStyle = "rgba(255,223,128,0.12)"; roundRect(ctx, 70, 392, 700, 140, 20); ctx.fill();
    ctx.strokeStyle = "#ffdf80"; ctx.lineWidth = 2; roundRect(ctx, 70, 392, 700, 140, 20); ctx.stroke();
    ctx.fillStyle = "#ffdf80"; ctx.font = `700 26px ${font}`;
    ctx.fillText(`AHORRO CON ${estado.lastCompare.best.name.toUpperCase()}`, 95, 430);
    ctx.fillStyle = "#fff"; ctx.font = `800 58px ${font}`;
    ctx.fillText(`${money(estado.lastCompare.save, "ARS")}`, 95, 492);
    ctx.fillStyle = "#e8dfef"; ctx.font = `500 22px Figtree, system-ui, sans-serif`;
    ctx.fillText(`${fmtAR.format(estado.lastCompare.savePct)}% menos que con tarjeta bancaria`, 95, 520);
  }
  ctx.fillStyle = "#99ccff"; ctx.font = `600 24px Figtree, system-ui, sans-serif`;
  ctx.fillText(SITE_URL.replace("https://", ""), 80, 590);
  ctx.fillStyle = "#d4cbe0"; ctx.font = `400 16px Figtree, system-ui, sans-serif`;
  ctx.fillText("Educativo, no es consejo financiero. Sin afiliación con Rockstar/Take-Two.", 80, 616);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
