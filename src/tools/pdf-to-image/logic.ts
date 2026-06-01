import { getPdfEngine } from "@/pdf-engine/engineProvider";
import {
  assertWithinBrowserPageCap,
  getAdaptiveExportScale,
  getPageProcessingChunkSize,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { Zip, ZipPassThrough } from "fflate";

export async function pdfPageToImage(
  file: File,
  pageNum: number,
  scale = 2.0,
  format: "jpeg" | "png" = "jpeg",
): Promise<string> {
  const canvas = document.createElement("canvas");
  const engine = await getPdfEngine();
  const doc = await engine.open(file);
  try {
    await doc.renderPageToCanvas(canvas, {
      pageNumber: pageNum,
      scale,
      intent: "export",
      dprCap: 2,
    });
  } finally {
    doc.destroy();
  }
  return format === "png"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", 0.88);
}

function canvasToPageBytes(
  canvas: HTMLCanvasElement,
  format: "jpeg" | "png",
): Uint8Array {
  const dataUrl =
    format === "png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.88);
  const [, data] = dataUrl.split(",");
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

/** Incremental ZIP — one page in memory at a time before final archive bytes. */
function zipPagesStreaming(
  pages: AsyncIterable<{ name: string; bytes: Uint8Array }>,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const zip = new Zip((err, data, final) => {
      if (err) {
        reject(err);
        return;
      }
      if (data) chunks.push(data);
      if (final) {
        const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          out.set(c, offset);
          offset += c.byteLength;
        }
        resolve(out);
      }
    });

    void (async () => {
      try {
        for await (const { name, bytes } of pages) {
          const entry = new ZipPassThrough(name);
          zip.add(entry);
          entry.push(bytes, true);
        }
        zip.end();
      } catch (e) {
        zip.terminate();
        reject(e);
      }
    })();
  });
}

export async function getAllPagesAsImages(
  file: File,
  scale?: number,
  format: "jpeg" | "png" = "jpeg",
): Promise<string[]> {
  return runStableBrowserJob(async () => {
    const engine = await getPdfEngine();
    const probe = await engine.open(file);
    let pageCount = 0;
    try {
      pageCount = probe.getPageCount();
    } finally {
      probe.destroy();
    }
    assertWithinBrowserPageCap(pageCount);
    const fileMb = file.size / (1024 * 1024);
    const renderScale = scale ?? getAdaptiveExportScale(pageCount, fileMb);
    const chunkSize = getPageProcessingChunkSize();
    const results: string[] = [];

    for (let chunkStart = 1; chunkStart <= pageCount; chunkStart += chunkSize) {
      const chunkEnd = Math.min(pageCount, chunkStart + chunkSize - 1);
      const doc = await engine.open(file);
      try {
        for (let i = chunkStart; i <= chunkEnd; i++) {
          const canvas = document.createElement("canvas");
          await doc.renderPageToCanvas(canvas, {
            pageNumber: i,
            scale: renderScale,
            intent: "export",
            dprCap: 2,
          });
          results.push(
            format === "png"
              ? canvas.toDataURL("image/png")
              : canvas.toDataURL("image/jpeg", 0.88),
          );
        }
      } finally {
        doc.destroy();
      }
      await yieldToMain();
    }

    return results;
  });
}

/** Build ZIP with streaming archive writer — avoids holding all page blobs before zip. */
export async function buildPdfPageImagesZip(
  file: File,
  format: "jpeg" | "png",
): Promise<{ blob: Blob; filename: string }> {
  return runStableBrowserJob(async () => {
    const engine = await getPdfEngine();
    const probe = await engine.open(file);
    let pageCount = 0;
    try {
      pageCount = probe.getPageCount();
    } finally {
      probe.destroy();
    }
    assertWithinBrowserPageCap(pageCount);

    const fileMb = file.size / (1024 * 1024);
    const renderScale = getAdaptiveExportScale(pageCount, fileMb);
    const chunkSize = getPageProcessingChunkSize();

    async function* pageBytes(): AsyncGenerator<{ name: string; bytes: Uint8Array }> {
      for (let chunkStart = 1; chunkStart <= pageCount; chunkStart += chunkSize) {
        const chunkEnd = Math.min(pageCount, chunkStart + chunkSize - 1);
        const doc = await engine.open(file);
        try {
          for (let i = chunkStart; i <= chunkEnd; i++) {
            const canvas = document.createElement("canvas");
            await doc.renderPageToCanvas(canvas, {
              pageNumber: i,
              scale: renderScale,
              intent: "export",
              dprCap: 2,
            });
            yield {
              name: getImageFilename(file.name, i, format),
              bytes: canvasToPageBytes(canvas, format),
            };
          }
        } finally {
          doc.destroy();
        }
        await yieldToMain();
      }
    }

    const zipBytes = await zipPagesStreaming(pageBytes());
    if (!zipBytes.byteLength) {
      const { ConversionError } = await import("@/tools/conversions/ConversionError");
      throw new ConversionError("EMPTY", "No pages could be rendered from this PDF.");
    }

    const out = new ArrayBuffer(zipBytes.byteLength);
    new Uint8Array(out).set(zipBytes);
    const base = file.name.replace(/\.pdf$/i, "") || "pages";
    return {
      blob: new Blob([out], { type: "application/zip" }),
      filename: format === "png" ? `${base}-png-pages.zip` : `${base}-jpg-pages.zip`,
    };
  });
}

/** Small previews only — full export should use {@link buildPdfPageImagesZip}. */
export async function buildPdfPageImagesZipPreview(
  file: File,
  format: "jpeg" | "png",
  maxPreviewPages = 3,
): Promise<{ dataUrls: string[]; pageCount: number }> {
  const engine = await getPdfEngine();
  const probe = await engine.open(file);
  let pageCount = 0;
  try {
    pageCount = probe.getPageCount();
  } finally {
    probe.destroy();
  }
  const limit = Math.min(pageCount, maxPreviewPages);
  const dataUrls: string[] = [];
  const doc = await engine.open(file);
  try {
    for (let i = 1; i <= limit; i++) {
      const canvas = document.createElement("canvas");
      await doc.renderPageToCanvas(canvas, {
        pageNumber: i,
        scale: 1.2,
        intent: "thumbnail",
        dprCap: 1.5,
      });
      dataUrls.push(
        format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82),
      );
    }
  } finally {
    doc.destroy();
  }
  return { dataUrls, pageCount };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function getImageFilename(original: string, page: number, format: "jpeg" | "png"): string {
  return original.replace(/\.pdf$/i, "") + `_page_${page}.${format === "png" ? "png" : "jpg"}`;
}
