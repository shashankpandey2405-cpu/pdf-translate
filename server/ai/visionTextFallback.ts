/**
 * When a PDF has no selectable text (scan / photo), extract content via vision AI
 * so summarize / chat / translate can proceed without asking the user to OCR first.
 */
import { extractPdfPagesForVision } from "@/server/ai/extractPdfPage";
import type { PageText } from "@/server/ai/extractPdfText";
import { totalExtractedChars } from "@/server/ai/extractPdfText";
import { analysesToExcerpt } from "@/server/ai/smartScanStore";
import { analyzeDocumentImage } from "@/server/ai/visionAnalyze";
import type { OpenRouterUsage } from "@/server/ai/openrouter";

const EMPTY_USAGE: OpenRouterUsage = { promptTokens: 0, completionTokens: 0, model: "" };

function mergeUsage(a: OpenRouterUsage, b: OpenRouterUsage): OpenRouterUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    model: b.model ? (a.model ? `${a.model}+${b.model}` : b.model) : a.model,
  };
}

function analysisToPageText(analysis: Awaited<ReturnType<typeof analyzeDocumentImage>>["analysis"], pageNumber: number): PageText {
  return { pageNumber, text: analysesToExcerpt([analysis]) };
}

export async function extractPdfTextWithVisionFallback(
  pdfBytes: Uint8Array,
  maxPages: number,
  opts: {
    isPremium?: boolean;
    qualityHint?: string;
    onPageProgress?: (pageIndex: number, total: number) => void | Promise<void>;
  } = {},
): Promise<{ pages: PageText[]; usage: OpenRouterUsage; usedVision: boolean }> {
  const isPremium = opts.isPremium ?? false;
  const pageLimit = Math.min(Math.max(1, maxPages), isPremium ? 8 : 3);
  const fileSizeKb = Math.round(pdfBytes.byteLength / 1024);
  const qualityHint =
    opts.qualityHint?.trim() ||
    (fileSizeKb < 50
      ? "Very low resolution — read every visible character carefully."
      : fileSizeKb < 200
        ? "Scan or photo PDF — extract all visible text in reading order."
        : "Document may be scanned — extract all visible text.");

  let usage = EMPTY_USAGE;
  const pages: PageText[] = [];

  try {
    if (pageLimit <= 1) {
      const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
      const result = await analyzeDocumentImage(pdfBase64, "application/pdf", {
        isPremium,
        pageNum: 1,
        qualityHint,
      });
      pages.push(analysisToPageText(result.analysis, 1));
      usage = result.usage;
    } else {
      const pagePdfBytes = await extractPdfPagesForVision(pdfBytes, pageLimit);
      for (let i = 0; i < pagePdfBytes.length; i += 1) {
        await opts.onPageProgress?.(i, pagePdfBytes.length);
        const result = await analyzeDocumentImage(
          Buffer.from(pagePdfBytes[i]).toString("base64"),
          "application/pdf",
          { isPremium, pageNum: i + 1, qualityHint },
        );
        pages.push(analysisToPageText(result.analysis, i + 1));
        usage = mergeUsage(usage, result.usage);
      }
    }
  } catch (e) {
    console.warn(
      "[vision-text-fallback] failed:",
      e instanceof Error ? e.message : e,
    );
    return { pages: [], usage: EMPTY_USAGE, usedVision: false };
  }

  const usedVision = totalExtractedChars(pages) >= 20;
  console.info(
    `[vision-text-fallback] pages=${pages.length} chars=${totalExtractedChars(pages)} vision=${usedVision}`,
  );
  return { pages, usage, usedVision };
}
