import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";
export type TextRun = {
  id: string;
  pageIndex: number;
  /** Canvas CSS px (top-left origin, matches editor overlay) */
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  text: string;
  fontName?: string;
  fontSizePx: number;
};

export async function extractTextRuns(
  file: File,
  pageNumber: number,
  canvasWidth: number,
  canvasHeight: number,
): Promise<TextRun[]> {
  const pdfjsLib = await import("pdfjs-dist");
  configurePdfJsWorker(pdfjsLib);

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
  try {
    const page = await pdf.getPage(pageNumber);
    const baseVp = page.getViewport({ scale: 1 });
    const scale = canvasWidth / baseVp.width;
    const viewport = page.getViewport({ scale });
    const text = await page.getTextContent({ includeMarkedContent: false });
    const runs: TextRun[] = [];
    let key = 0;

    const items = text.items as unknown as Array<{
      str?: string;
      transform?: number[];
      width?: number;
      height?: number;
      fontName?: string;
    }>;

    for (const item of items) {
      const str = typeof item.str === "string" ? item.str : "";
      if (!str.trim() || !item.transform || item.transform.length < 6) continue;

      const m = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const xScale = Math.hypot(m[0], m[1]);
      let vwRaw = typeof item.width === "number" ? Math.abs(item.width) * xScale : 0;
      if (!vwRaw || vwRaw < 4) vwRaw = Math.max(48, Math.min(canvasWidth - m[4], str.length * 8));
      let vhRaw = Math.hypot(m[2], m[3]) || Math.abs(scale * 14);
      const vx = m[4];
      const vyTop = m[5] - vhRaw;

      runs.push({
        id: `run-${key++}`,
        pageIndex: pageNumber - 1,
        vx,
        vy: vyTop,
        vw: Math.min(canvasWidth - vx, vwRaw),
        vh: Math.min(canvasHeight - vyTop, vhRaw * 1.15),
        text: str,
        fontName: item.fontName,
        fontSizePx: Math.max(8, vhRaw * 0.85),
      });
    }
    return runs;
  } finally {
    void pdf.destroy();
  }
}

export function findTextRunAt(
  runs: TextRun[],
  pick: { vx: number; vy: number; vw: number; vh: number },
): TextRun | undefined {
  const cx = pick.vx + pick.vw / 2;
  const cy = pick.vy + pick.vh / 2;
  return runs.find(
    (r) => cx >= r.vx && cx <= r.vx + r.vw && cy >= r.vy && cy <= r.vy + r.vh,
  );
}

export type ContentTextPick = {
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  sample: string;
  fontName?: string;
  fontSizePx?: number;
};

export function textRunToContentPick(run: TextRun): ContentTextPick {
  return {
    vx: run.vx,
    vy: run.vy,
    vw: run.vw,
    vh: run.vh,
    sample: run.text,
    fontName: run.fontName,
    fontSizePx: run.fontSizePx,
  };
}
