// Disparador de datos para gta6.lcaitech.com.
//
// Por qué existe: los `schedule` de GitHub Actions son "best effort". Con carga los demoran horas o los
// descartan (el 19/11/2026 el cron de TTWO corrió 0 de ~27 veces). Un Cron Trigger de Cloudflare sí es puntual,
// así que este Worker dispara (workflow_dispatch, por la API de GitHub) los mismos workflows en su horario.
// Los `schedule` de los workflows quedan como respaldo: si ambos corren, `concurrency: data-refresh` los encola.
//
// No tiene rutas HTTP: solo corre por cron. Secret (no commiteado): GH_TOKEN = fine-grained PAT limitado a este
// repo con el permiso "Actions: Read and write". Ver README ("Quién dispara los refrescos").

const GH_API = "https://api.github.com";
const DEFAULT_REPO = "LCAITECH/gta6-vs-acciones";

// Qué toca en cada tick (hora UTC). Hay una sola cron, cada 15 minutos, y acá se decide qué workflows salen.
// Cada workflow cae en un minuto distinto: nunca hay más de 2 por tick, porque comparten
// `concurrency: data-refresh` y GitHub descarta los pendientes de más (solo guarda 1 corriendo + 1 pendiente).
export function dueWorkflows(date) {
  const dow = date.getUTCDay(); // 0 = domingo
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const weekday = dow >= 1 && dow <= 5;
  const due = [];
  // TTWO: cada 15 min durante la rueda de Nasdaq (lunes a viernes, 14:00-21:45 UTC).
  if (weekday && h >= 14 && h <= 21) due.push({ file: "refresh-ttwo.yml" });
  // TTWO: histórico oficial una vez por día, ya cerrada la rueda.
  if (weekday && h === 22 && m === 30) due.push({ file: "refresh-ttwo.yml", inputs: { history: "true" } });
  // Dólar: cada hora de 13 a 21 UTC en días hábiles, más una corrida nocturna (06:00 UTC).
  if (m === 0 && ((weekday && h >= 13 && h <= 21) || h === 6)) due.push({ file: "refresh-fx.yml" });
  // BTC: cada 3 horas (cotiza 24/7).
  if (m === 15 && h % 3 === 0) due.push({ file: "refresh-btc.yml" });
  // Precios de hardware: cada 6 horas.
  if (m === 30 && h % 6 === 0) due.push({ file: "refresh-hardware.yml" });
  return due;
}

async function dispatch(env, { file, inputs }) {
  const repo = env.GH_REPO || DEFAULT_REPO;
  const res = await fetch(`${GH_API}/repos/${repo}/actions/workflows/${file}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "gta6-cron",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: env.GH_REF || "main", ...(inputs ? { inputs } : {}) }),
  });
  // GitHub contesta 204 sin cuerpo cuando lo encoló. El mensaje lleva solo archivo y status, nunca el token.
  if (res.status !== 204) throw new Error(`${file}: GitHub respondió ${res.status}`);
}

export default {
  async scheduled(event, env) {
    const due = dueWorkflows(new Date(event.scheduledTime));
    if (!due.length) return;
    if (!env.GH_TOKEN) throw new Error("falta el secret GH_TOKEN: no se dispara nada");
    const results = await Promise.allSettled(due.map((w) => dispatch(env, w)));
    const failed = results.filter((r) => r.status === "rejected").map((r) => r.reason.message);
    // Se intentan todos; si alguno falló, la invocación figura como fallida en el panel de Cloudflare.
    if (failed.length) throw new Error(failed.join(" | "));
  },
};
