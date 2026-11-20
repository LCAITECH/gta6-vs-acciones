// Gráfico animado de lo gastado contra lo invertido.
import { $, money } from "./base.js";
let chartFrame = 0;

export function drawChart(points, ccy) {
  const canvas = $("chart");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!points.length) return;

  const pad = { t: 36, r: 70, b: 70, l: 150 };
  const vals = points.flatMap((p) => [p.spent, p.invested, p.btc].filter((v) => v != null));
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const padY = (max - min) * 0.12 || max * 0.08 || 1;
  min -= padY;
  max += padY;

  const x = (i) => pad.l + (i / Math.max(points.length - 1, 1)) * (w - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);

  ctx.strokeStyle = "#f976b022";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();

  const gridCount = 4;
  ctx.font = "22px Figtree, sans-serif";
  ctx.fillStyle = "#efe8f6";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= gridCount; i += 1) {
    const v = min + ((max - min) * i) / gridCount;
    const yy = y(v);
    ctx.strokeStyle = "#ffffff0f";
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(w - pad.r, yy);
    ctx.stroke();
    ctx.fillText(money(v, ccy), pad.l - 12, yy);
  }

  const first = points[0].date;
  const last = points[points.length - 1].date;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(first, x(0), h - pad.b + 16);
  ctx.fillText(last, x(points.length - 1), h - pad.b + 16);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduce ? 0 : 1100;
  const start = performance.now();

  const render = (frac) => {
    ctx.clearRect(pad.l + 1, pad.t - 1, w - pad.l - pad.r, h - pad.t - pad.b + 1);
    for (let i = 0; i <= gridCount; i += 1) {
      const v = min + ((max - min) * i) / gridCount;
      const yy = y(v);
      ctx.strokeStyle = "#ffffff0f";
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
    }

    const n = Math.max(1, Math.floor(1 + (points.length - 1) * frac));
    const visible = points.slice(0, n);

    ctx.save();
    ctx.strokeStyle = "#ffdf80";
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.shadowColor = "#ffdf80";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    visible.forEach((p, i) => {
      const xx = x(i);
      const yy = y(p.spent);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    const hasTtwo = visible.some((p) => p.invested != null);
    const hasBtc = visible.some((p) => p.btc != null);
    const strokeKey = (key, color, width, alpha, fillFrom) => {
      const pts = visible.map((p, i) => (p[key] != null ? [x(i), y(p[key])] : null));
      const first = pts.findIndex(Boolean);
      const lastI = pts.map((v, i) => (v ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
      if (first < 0) return;
      if (fillFrom) {
        const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
        grad.addColorStop(0, fillFrom);
        grad.addColorStop(1, "#00000000");
        ctx.beginPath();
        let started = false;
        pts.forEach((pt) => {
          if (!pt) return;
          if (!started) { ctx.moveTo(pt[0], pt[1]); started = true; }
          else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.lineTo(pts[lastI][0], h - pad.b);
        ctx.lineTo(pts[first][0], h - pad.b);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      let started = false;
      pts.forEach((pt) => {
        if (!pt) return;
        if (!started) { ctx.moveTo(pt[0], pt[1]); started = true; }
        else ctx.lineTo(pt[0], pt[1]);
      });
      ctx.stroke();
      ctx.restore();
    };
    if (hasTtwo) {
      strokeKey("invested", "#f976b0", 10, 0.55, "#f976b055");
      strokeKey("invested", "#f976b0", 5, 1, null);
    }
    if (hasBtc) {
      strokeKey("btc", "#3ef0d4", 8, 0.55, hasTtwo ? null : "#3ef0d455");
      strokeKey("btc", "#3ef0d4", 4.5, 1, null);
    }

    const lastPt = visible[visible.length - 1];
    ctx.save();
    if (lastPt.invested != null) {
      ctx.shadowColor = "#f976b0";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#f976b0";
      ctx.beginPath();
      ctx.arc(x(visible.length - 1), y(lastPt.invested), 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (lastPt.btc != null) {
      ctx.shadowColor = "#3ef0d4";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#3ef0d4";
      ctx.beginPath();
      ctx.arc(x(visible.length - 1), y(lastPt.btc), 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = "#ffdf80";
    ctx.fillStyle = "#ffdf80";
    ctx.beginPath();
    ctx.arc(x(visible.length - 1), y(lastPt.spent), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  if (chartFrame) cancelAnimationFrame(chartFrame);
  if (!duration) {
    render(1);
    return;
  }
  const tick = (now) => {
    const frac = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - frac) ** 3;
    render(eased);
    if (frac < 1) chartFrame = requestAnimationFrame(tick);
  };
  chartFrame = requestAnimationFrame(tick);
}
