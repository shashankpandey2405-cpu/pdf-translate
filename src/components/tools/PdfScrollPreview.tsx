"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";
import { getPDFPageCount, renderPDFPage } from "@/components/PDFThumbnail";
import { getPageProcessingChunkSize, yieldToMain } from "@/lib/browserSafeProcessing";
import { getMaxStackPreviewPages } from "@/lib/render/canvasBudget";
import { isMobileSafari } from "@/lib/download/isIOS";
import { cn } from "@/lib/utils";

function revokePreviewUrls(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
  }
}

type Props = {
  blob: Blob;
  filename?: string;
  className?: string;
  maxWidth?: number;
  fullPage?: boolean;
  /** `paged` = fit each page in viewport, scroll between pages; `stack` = all pages stacked. */
  layout?: "stack" | "paged";
};

function blobToPreviewFile(blob: Blob, filename = "preview.pdf"): File {
  if (blob instanceof File) return blob;
  return new File([blob], filename, { type: blob.type || "application/pdf" });
}

function fitScaleForViewport(widthPx: number, heightPx: number, maxWidth: number): number {
  const w = Math.max(120, widthPx - 16);
  const h = Math.max(160, heightPx - 40);
  const byWidth = w / 210;
  const byHeight = h / 297;
  const fit = Math.min(byWidth, byHeight, maxWidth / 210, 2);
  return Math.max(0.35, fit * 0.96);
}

/**
 * PDF preview: paged (one page fits viewport) or stacked pages.
 */
export function PdfScrollPreview({
  blob,
  filename = "preview.pdf",
  className,
  maxWidth = 520,
  fullPage = false,
  layout = "stack",
}: Props) {
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const renderScaleRef = useRef(0.85);
  const [scaleTick, setScaleTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [brokenPages, setBrokenPages] = useState<Set<number>>(() => new Set());
  const urlsRef = useRef<string[]>([]);
  const mounted = useRef(true);
  const paged = layout === "paged";

  useEffect(() => {
    urlsRef.current = pageUrls;
  }, [pageUrls]);

  useEffect(() => {
    return () => revokePreviewUrls(urlsRef.current);
  }, []);

  const updateScale = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !paged) return;
    const next = fitScaleForViewport(el.clientWidth, el.clientHeight, maxWidth);
    if (Math.abs(next - renderScaleRef.current) < 0.06) return;
    renderScaleRef.current = next;
    setScaleTick((n) => n + 1);
  }, [maxWidth, paged]);

  useEffect(() => {
    if (!paged) return;
    const el = scrollRef.current;
    if (!el) return;
    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, [paged, updateScale]);

  useEffect(() => {
    if (!loading && paged) updateScale();
  }, [loading, paged, updateScale]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    setFailed(false);
    setPageUrls([]);
    setPageCount(0);
    setActivePage(1);
    setLoadingMore(false);
    setBrokenPages(new Set());
    revokePreviewUrls(urlsRef.current);

    const file = blobToPreviewFile(blob, filename);
    let scale = paged
      ? renderScaleRef.current
      : Math.min(Math.max(maxWidth / 210, 0.35), fullPage ? 2 : 1.15);
    if (isMobileSafari()) {
      scale = Math.min(scale, paged ? 0.9 : 0.85);
    }

    void (async () => {
      try {
        const total = await getPDFPageCount(file);
        if (!mounted.current) return;
        if (total < 1) {
          setFailed(true);
          setLoading(false);
          return;
        }
        setPageCount(total);
        const maxStackPages = paged ? total : Math.min(total, getMaxStackPreviewPages());

        const first = await renderPDFPage(file, 1, scale);
        if (!mounted.current) return;
        setPageUrls([first]);
        setLoading(false);

        if (maxStackPages <= 1) return;

        setLoadingMore(true);
        const chunk = getPageProcessingChunkSize();
        const rest: string[] = [];

        for (let p = 2; p <= maxStackPages; p += 1) {
          const url = await renderPDFPage(file, p, scale);
          rest.push(url);
          if (p % chunk === 0) {
            if (!mounted.current) return;
            setPageUrls((prev) => [...prev, ...rest]);
            rest.length = 0;
            await yieldToMain();
          }
        }

        if (!mounted.current) return;
        if (rest.length) setPageUrls((prev) => [...prev, ...rest]);
        setLoadingMore(false);
      } catch {
        if (!mounted.current) return;
        setFailed(true);
        setLoading(false);
        setLoadingMore(false);
      }
    })();

    return () => {
      mounted.current = false;
      revokePreviewUrls(urlsRef.current);
    };
  }, [blob, filename, maxWidth, fullPage, paged, scaleTick]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !paged || pageCount <= 1) return;

    const onScroll = () => {
      const h = el.clientHeight || 1;
      const idx = Math.round(el.scrollTop / h);
      setActivePage(Math.min(pageCount, Math.max(1, idx + 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [paged, pageCount]);

  const goToPage = (page: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const next = Math.min(pageCount, Math.max(1, page));
    el.scrollTo({ top: (next - 1) * el.clientHeight, behavior: "smooth" });
    setActivePage(next);
  };

  const markBroken = useCallback((idx: number) => {
    setBrokenPages((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }, []);

  const renderPageImg = (url: string, idx: number, imgClassName: string, imgStyle?: CSSProperties) => {
    if (brokenPages.has(idx)) {
      return (
        <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/60" aria-hidden />
          <p className="text-[11px] text-muted-foreground">
            Page {idx + 1} preview unavailable on this device. Download the file to view.
          </p>
        </div>
      );
    }
    return (
      <img
        src={url}
        alt={`Page ${idx + 1}`}
        className={imgClassName}
        style={imgStyle}
        loading={idx === 0 ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={() => markBroken(idx)}
      />
    );
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center gap-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary/70" aria-hidden />
        Loading preview…
      </div>
    );
  }

  if (failed || !pageUrls.length) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <FileText className="h-9 w-9 text-primary/50" aria-hidden />
        <p>Preview could not render in the browser. You can still process or download the file.</p>
      </div>
    );
  }

  if (paged) {
    const singlePage = pageCount <= 1;
    return (
      <div className={cn("pdf-preview-container flex h-full min-h-0 w-full flex-col touch-pan-y", className)}>
        <div className="flex shrink-0 items-center justify-between gap-2 px-2 pb-2">
          <p className="text-[11px] text-muted-foreground">
            Page {activePage} of {pageCount}
          </p>
          {pageCount > 1 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => goToPage(activePage - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={activePage >= pageCount}
                onClick={() => goToPage(activePage + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
        <div
          ref={singlePage ? undefined : scrollRef}
          className={cn(
            "pdf-preview-scroll min-h-0 flex-1 touch-pan-y",
            singlePage
              ? "overflow-visible"
              : "pdf-preview-scroll--inner overflow-y-auto snap-y snap-mandatory",
          )}
        >
          {pageUrls.map((url, idx) => (
            <figure
              key={`page-${idx + 1}`}
              className={cn(
                "pdf-preview-page box-border flex flex-col items-center justify-center px-2 py-2 touch-pan-y",
                singlePage ? "min-h-0 w-full" : "h-full min-h-full snap-start snap-always",
              )}
            >
              {renderPageImg(
                url,
                idx,
                "max-h-full max-w-full rounded-md object-contain shadow-sm touch-pan-y",
                singlePage
                  ? { width: "auto", height: "auto", maxWidth: "100%" }
                  : { maxHeight: "calc(100% - 0.5rem)", width: "auto", height: "auto" },
              )}
            </figure>
          ))}
          {loadingMore ? (
            <div className="flex h-full min-h-[120px] items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : null}
        </div>
        {pageCount > 1 ? (
          <p className="shrink-0 px-2 pt-1 text-center text-[10px] text-muted-foreground">
            Scroll inside preview or use arrows
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("pdf-preview-container flex w-full touch-pan-y flex-col gap-3 p-2 sm:p-3", className)}>
      {pageCount > 1 ? (
        <p className="text-center text-[11px] text-muted-foreground">
          {pageUrls.length} of {pageCount} pages
          {pageUrls.length < pageCount
            ? " — preview capped on this device; download or use cloud for full export"
            : " — scroll to see all"}
        </p>
      ) : null}
      {pageUrls.map((url, idx) => (
        <figure key={`page-${idx + 1}`} className="pdf-preview-page flex touch-pan-y flex-col items-center gap-1">
          {pageCount > 1 ? (
            <figcaption className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Page {idx + 1}
            </figcaption>
          ) : null}
          {renderPageImg(
            url,
            idx,
            cn(
              "w-full max-w-full touch-pan-y rounded-lg object-contain shadow-sm",
              fullPage ? "h-auto max-h-none" : "max-h-[min(55vh,520px)]",
            ),
          )}
        </figure>
      ))}
      {loadingMore ? (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading more pages…
        </div>
      ) : null}
    </div>
  );
}
