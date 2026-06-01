"use client";

import { useEffect, useState } from "react";
import { getPDFPageCount, renderPDFPage } from "@/components/PDFThumbnail";
import {
  assertWithinBrowserPageCap,
  getAdaptiveExportScale,
  getPageProcessingChunkSize,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { getPdfViewportMaxScale } from "@/lib/pdfRenderBudget";

export function usePdfPageThumbnails(file: File | null) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setPageCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setThumbnails([]);

    void (async () => {
      try {
        const total = await getPDFPageCount(file);
        if (cancelled) return;
        assertWithinBrowserPageCap(total);
        setPageCount(total);
        const fileMb = file.size / (1024 * 1024);
        const scale = Math.min(getAdaptiveExportScale(total, fileMb) * 0.45, getPdfViewportMaxScale());
        const chunk = getPageProcessingChunkSize();
        const urls: string[] = [];

        for (let p = 1; p <= total; p += 1) {
          const url = await renderPDFPage(file, p, scale);
          urls.push(url);
          if (p % chunk === 0 || p === total) {
            if (cancelled) return;
            setThumbnails([...urls]);
            await yieldToMain();
          }
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load page previews.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return { thumbnails, pageCount, loading, error };
}
