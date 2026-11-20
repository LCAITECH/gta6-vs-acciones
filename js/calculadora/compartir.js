// Bloque de compartir: links, descarga y copia de la imagen.
import { track } from "./analitica.js";
import { $ } from "./base.js";
import { drawShareCard } from "./compartir-tarjeta.js";
import { shareText, shareUrl } from "./compartir-texto.js";
import { toast } from "./toast.js";
let shareTimer = null;
export function renderShare() {
  const canvas = $("share-canvas");
  if (!canvas) return;
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => drawShareCard(canvas), 150);
  const text = shareText();
  const url = shareUrl();
  $("share-x").href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  $("share-wa").href = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
}

function canvasBlob() {
  return new Promise((resolve) => $("share-canvas").toBlob(resolve, "image/png"));
}

export function bindShare() {
  $("share-download").addEventListener("click", async () => {
    await drawShareCard($("share-canvas"));
    const blob = await canvasBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "mi-gta6-vs-ttwo.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    track("share-download");
  });
  $("share-copy").addEventListener("click", async () => {
    let ok = true;
    try { await navigator.clipboard.writeText(shareUrl()); }
    catch {
      try {
        const ta = document.createElement("textarea"); ta.value = shareUrl(); document.body.appendChild(ta);
        ta.select(); ok = document.execCommand("copy"); ta.remove();
      } catch { ok = false; }
    }
    toast(ok ? "Link copiado" : "No se pudo copiar el link");
    track("share-copy");
  });
  const nativeBtn = $("share-native");
  if (navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener("click", async () => {
      await drawShareCard($("share-canvas"));
      const blob = await canvasBlob();
      const file = new File([blob], "mi-gta6-vs-ttwo.png", { type: "image/png" });
      const data = { title: "GTA 6 vs acciones", text: shareText(), url: shareUrl() };
      if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
      try { await navigator.share(data); track("share-native"); } catch { /* cancelled */ }
    });
  }
  $("share-x").addEventListener("click", () => track("share-x"));
  $("share-wa").addEventListener("click", () => track("share-whatsapp"));
}
