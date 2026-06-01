import type { PdfEngine } from "@/pdf-engine/types";
import { logDriverHealth } from "@/utils/logger";

type EngineName = "mupdf" | "pdfjs";

const enginePromises: Partial<Record<EngineName, Promise<PdfEngine>>> = {};

function preferredEngine(): EngineName {
  const fromEnv = (process.env.VITE_PDF_ENGINE as string | undefined)?.toLowerCase();
  if (fromEnv === "mupdf") return "mupdf";
  return "pdfjs";
}

async function makeEngine(name: EngineName): Promise<PdfEngine> {
  if (name === "mupdf") {
    const { MuPdfEngine } = await import("./mupdfEngine");
    const e = new MuPdfEngine();
    await e.init();
    return e;
  }
  const { PdfJsEngine } = await import("./pdfjsEngine");
  const e = new PdfJsEngine();
  await e.init();
  return e;
}

export type GetPdfEngineOptions = {
  /** Override env default; pdf.js is the lightweight default until a tool opts into MuPDF. */
  engine?: EngineName;
};

export async function getPdfEngine(options?: GetPdfEngineOptions): Promise<PdfEngine> {
  const name = options?.engine ?? preferredEngine();
  const cached = enginePromises[name];
  if (cached) return cached;

  enginePromises[name] = (async () => {
    try {
      const eng = await makeEngine(name);
      void logDriverHealth({ library: `pdf_engine_${eng.name}`, phase: "init", ok: true });
      return eng;
    } catch (e) {
      void logDriverHealth({ library: `pdf_engine_${name}`, phase: "init", ok: false, error: e });
      const fallback: EngineName = name === "mupdf" ? "pdfjs" : "mupdf";
      const eng = await makeEngine(fallback);
      void logDriverHealth({ library: `pdf_engine_${eng.name}`, phase: "init_fallback", ok: true });
      return eng;
    }
  })();

  return enginePromises[name]!;
}
