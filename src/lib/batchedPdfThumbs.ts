import { getPdfEngine } from "@/pdf-engine/engineProvider";
import { getMaxConcurrentThumbs, getDeviceCapability } from "@/lib/deviceCapability";
import { getEditorThumbWindowRadius } from "@/lib/render/canvasBudget";

const THUMB_PAGE_CHUNK = 20;

/** Renders page thumbnails in batches to reduce memory spikes on low-end devices. */
export async function renderThumbsBatched(file: File, scale = 0.3): Promise<string[]> {
  const { tier } = getDeviceCapability();
  const thumbScale = tier === "low" ? Math.min(scale, 0.22) : scale;
  const batch = getMaxConcurrentThumbs();
  const engine = await getPdfEngine();

  let count = 0;
  {
    const probe = await engine.open(file);
    try {
      count = probe.getPageCount();
    } finally {
      probe.destroy();
    }
  }

  const thumbs: string[] = [];
  for (let chunkStart = 1; chunkStart <= count; chunkStart += THUMB_PAGE_CHUNK) {
    const chunkEnd = Math.min(count, chunkStart + THUMB_PAGE_CHUNK - 1);
    const doc = await engine.open(file);
    try {
      for (let start = chunkStart - 1; start < chunkEnd; start += batch) {
        const end = Math.min(chunkEnd, start + batch);
        for (let i = start + 1; i <= end; i++) {
          const canvas = document.createElement("canvas");
          await doc.renderPageToCanvas(canvas, {
            pageNumber: i,
            scale: thumbScale,
            intent: "thumbnail",
            dprCap: tier === "low" ? 1 : 1.5,
          });
          thumbs.push(canvas.toDataURL("image/jpeg", 0.8));
        }
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      doc.destroy();
    }
  }

  return thumbs;
}

/** Render only thumbnails near the active page (editor sidebar virtualization). */
export async function renderThumbWindow(
  file: File,
  centerPage: number,
  scale = 0.3,
  radius = getEditorThumbWindowRadius(),
): Promise<Map<number, string>> {
  const { tier } = getDeviceCapability();
  const thumbScale = tier === "low" ? Math.min(scale, 0.22) : scale;
  const engine = await getPdfEngine();

  let count = 0;
  {
    const probe = await engine.open(file);
    try {
      count = probe.getPageCount();
    } finally {
      probe.destroy();
    }
  }

  const start = Math.max(1, centerPage - radius);
  const end = Math.min(count, centerPage + radius);
  const map = new Map<number, string>();
  const doc = await engine.open(file);
  try {
    for (let i = start; i <= end; i++) {
      const canvas = document.createElement("canvas");
      await doc.renderPageToCanvas(canvas, {
        pageNumber: i,
        scale: thumbScale,
        intent: "thumbnail",
        dprCap: tier === "low" ? 1 : 1.5,
      });
      map.set(i, canvas.toDataURL("image/jpeg", 0.8));
    }
  } finally {
    doc.destroy();
  }
  return map;
}
