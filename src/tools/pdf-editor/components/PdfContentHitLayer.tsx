import { useEffect, useState } from "react";
import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";

export interface ContentPick {
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  sample: string;
  fontName?: string;
  fontSizePx?: number;
}

interface Props {
  file: File;
  pageNumber: number;
  /** Must match rendered PDF canvas width / height */
  canvasWidth: number;
  canvasHeight: number;
  enabled: boolean;
  /** Tooltip for editable text regions */
  pickHint?: string;
  onPick: (pick: ContentPick) => void;
}

type Region = ContentPick & { key: string; fontName?: string; fontSizePx?: number };

/** Transparent hit-targets aligned to extracted PDF text spans */
export function PdfContentHitLayer({ file, pageNumber, canvasWidth, canvasHeight, enabled, pickHint, onPick }: Props) {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    if (!enabled || canvasWidth < 8 || canvasHeight < 8) {
      setRegions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      configurePdfJsWorker(pdfjsLib);

      const data = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
      const page = await pdf.getPage(pageNumber);

      const baseVp = page.getViewport({ scale: 1 });
      const scale = canvasWidth / baseVp.width;
      const viewport = page.getViewport({ scale });

      const text = await page.getTextContent({ includeMarkedContent: false });
      const blocks: Region[] = [];
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
        if (!item.transform || item.transform.length < 6) continue;

        const m = pdfjsLib.Util.transform(viewport.transform, item.transform);

        const xScale = Math.hypot(m[0], m[1]);

        /**
         * `item.width` is in glyph space horizontally; multiplying by glyph basis length in canvas space yields box width.
         */
        let vwRaw = typeof item.width === "number" ? Math.abs(item.width) * xScale : 0;
        if (!vwRaw || vwRaw < 4) vwRaw = Math.max(48, Math.min(canvasWidth - m[4], str.length * 8));
        let vhRaw = Math.hypot(m[2], m[3]) || Math.abs(scale * 14);

        const vx = m[4];
        const vyTop = m[5] - vhRaw;

        blocks.push({
          key: `${key++}`,
          vx,
          vy: vyTop,
          vw: Math.min(canvasWidth - vx, vwRaw),
          vh: Math.min(canvasHeight - vyTop, vhRaw * 1.15),
          sample: str,
          fontName: item.fontName,
          fontSizePx: Math.max(8, vhRaw * 0.85),
        });
      }

      if (!cancelled) setRegions(blocks);
      void pdf.destroy();
    })();

    return () => {
      cancelled = true;
    };
  }, [canvasWidth, canvasHeight, enabled, file, pageNumber]);

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 z-[15] overflow-hidden rounded-2xl pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight }}
      aria-hidden
    >
      {regions.map((r) => (
        <button
          key={r.key}
          type="button"
          className="pointer-events-auto absolute hover:bg-primary/15 border border-transparent hover:border-primary/40 rounded-lg transition-colors"
          style={{ left: r.vx, top: r.vy, width: r.vw, height: r.vh, minHeight: 8 }}
          title={pickHint ?? "Double-click to edit"}
          onDoubleClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onPick({
              vx: r.vx,
              vy: r.vy,
              vw: r.vw,
              vh: r.vh,
              sample: r.sample,
              fontName: r.fontName,
              fontSizePx: r.fontSizePx,
            });
          }}
        />
      ))}
    </div>
  );
}
