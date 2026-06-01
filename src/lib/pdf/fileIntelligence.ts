import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";

export type PdfFileInsight = {
  pageCount: number | null;
  sizeBytes: number;
  sizeLabel: string;
  passwordProtected: boolean;
  validPdf: boolean;
  thumbnailDataUrl: string | null;
  recommendation: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isPdfHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export async function analyzePdfFile(file: File): Promise<PdfFileInsight> {
  const buf = await file.arrayBuffer();
  const header = new Uint8Array(buf, 0, Math.min(buf.byteLength, 8));
  const validPdf = isPdfHeader(header);
  const sizeBytes = file.size;
  const sizeLabel = formatBytes(sizeBytes);

  if (!validPdf) {
    return {
      pageCount: null,
      sizeBytes,
      sizeLabel,
      passwordProtected: false,
      validPdf: false,
      thumbnailDataUrl: null,
      recommendation: "This file does not look like a valid PDF. Try re-exporting or use another format.",
    };
  }

  if (typeof document === "undefined") {
    return {
      pageCount: null,
      sizeBytes,
      sizeLabel,
      passwordProtected: false,
      validPdf: true,
      thumbnailDataUrl: null,
      recommendation: null,
    };
  }

  try {
    const pdfjsLib = await import("pdfjs-dist");
    configurePdfJsWorker(pdfjsLib);
    const loading = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
    const pdf = await loading.promise;
    const pageCount = pdf.numPages;

    let thumbnailDataUrl: string | null = null;
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      }
    } catch {
      /* thumbnail optional */
    }

    void pdf.destroy();

    let recommendation: string | null = null;
    if (pageCount > 50) {
      recommendation = "Large document — Premium cloud processing supports higher page limits.";
    } else if (sizeBytes > 15 * 1024 * 1024) {
      recommendation = "Large file — Premium cloud may handle this better than browser mode.";
    }

    return {
      pageCount,
      sizeBytes,
      sizeLabel,
      passwordProtected: false,
      validPdf: true,
      thumbnailDataUrl,
      recommendation,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const passwordProtected =
      /password|encrypted|needs password/i.test(msg) || msg.includes("PasswordException");
    return {
      pageCount: null,
      sizeBytes,
      sizeLabel,
      passwordProtected,
      validPdf: true,
      thumbnailDataUrl: null,
      recommendation: passwordProtected
        ? "This PDF is password protected. Remove the password before processing."
        : "Could not read this PDF. It may be corrupted or use unsupported encryption.",
    };
  }
}
