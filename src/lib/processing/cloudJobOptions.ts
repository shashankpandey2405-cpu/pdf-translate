import type { DocumentAnalysis } from "@/lib/processing/documentAnalysis";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";

/** Cloud worker options passed with enhanced job enqueue. */
export function buildCloudJobOptions(
  toolSlug: string,
  analysis: DocumentAnalysis | null,
  tier: PremiumProcessingTier = "standard",
): Record<string, unknown> | undefined {
  if (toolSlug === "pdf-to-word") {
    const scanned = Boolean(analysis?.likelyScanned) || Boolean(analysis?.imageHeavy);
    const pages = analysis?.pageCount ?? 50;
    const tierPro = tier === "pro";

    if (!scanned) {
      return {
        ocrLanguage: "auto",
        docxForceOcr: false,
        docxOcrPreflightMaxPages: 0,
        docxTableEnhance: pages > 1,
        docxMakeEditable: true,
        docxPipelineVersion: "v4",
        docxFastPath: true,
      };
    }

    const ocrCap = tierPro
      ? Math.min(Math.max(pages, 1), 100)
      : Math.min(Math.max(pages, 1), 20);
    return {
      ocrLanguage: "auto",
      docxForceOcr: tierPro,
      docxOcrEngine: "tesseract",
      docxOcrPreflightMaxPages: ocrCap,
      docxTableEnhance: true,
      docxMakeEditable: true,
      docxPipelineVersion: "v4",
    };
  }
  if (toolSlug === "word-to-pdf" || toolSlug === "pptx-to-pdf") {
    return {
      officeNormalize: true,
      officeEmbedFonts: true,
      officePrintQuality: true,
    };
  }
  if (toolSlug === "compress-pdf") {
    return { compressPreset: "recommended" };
  }
  if (toolSlug === "pdf-to-excel") {
    const statementLike =
      Boolean(analysis?.textLayerRich) &&
      !analysis?.likelyScanned &&
      (analysis?.pageCount ?? 0) <= 40;
    const pages = analysis?.pageCount ?? 50;
    const ocrCap =
      tier === "pro"
        ? Math.min(Math.max(pages, 1), 100)
        : Math.min(Math.max(pages, 1), 15);
    const scanned = analysis?.likelyScanned ?? false;
    const forceOcr = tier === "pro" ? true : scanned;
    return {
      ocrLanguage: "eng",
      excelForceOcr: forceOcr,
      excelOcrEngine: scanned ? "paddle" : "auto",
      excelOcrPreflightMaxPages: ocrCap,
      exportMode: statementLike ? "statement" : "tables",
    };
  }
  if (toolSlug === "pdf-to-image" || toolSlug === "pdf-to-png" || toolSlug === "pdf-to-jpg") {
    return {
      imageFormat: toolSlug === "pdf-to-jpg" ? "jpeg" : toolSlug === "pdf-to-png" ? "png" : "png",
      dpi: 150,
    };
  }
  if (toolSlug === "pdf-to-pptx") {
    return { dpi: 150 };
  }
  if (toolSlug === "pdf-to-pdfa") {
    return { conformance: "2b" };
  }
  if (toolSlug === "ocr-pdf") {
    const scanned = Boolean(analysis?.likelyScanned) || Boolean(analysis?.imageHeavy);
    return {
      ocrAutoLanguage: true,
      ocrDeskew: true,
      ocrPreprocess: true,
      ocrPreprocessScale: 2.0,
      ocrPreserveColors: true,
      ocrMode: scanned ? "accurate" : "balanced",
    };
  }
  return undefined;
}
