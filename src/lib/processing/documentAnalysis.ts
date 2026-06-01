/**
 * Client-side PDF structure analysis (pdf.js) for intelligent Browser vs Cloud routing.
 */
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";

export type DocumentComplexity = "simple" | "moderate" | "complex";
export type DocumentClass =
  | "digital_text"
  | "scanned"
  | "image_heavy"
  | "large_file"
  | "mixed";

export type DocumentAnalysis = {
  pageCount: number;
  sampledPages: number;
  textCharCount: number;
  avgCharsPerPage: number;
  sparsePageRatio: number;
  likelyScanned: boolean;
  textLayerRich: boolean;
  imageHeavy: boolean;
  complexity: DocumentComplexity;
  documentClass: DocumentClass;
  recommendCloud: boolean;
  recommendOcr: boolean;
  reason: string;
};

export async function analyzePdfDocument(file: File, maxSamplePages = 6): Promise<DocumentAnalysis> {
  const pdf = await acquirePdfDocument(file);
  try {
    const pageCount = pdf.numPages;
    const sample = Math.min(pageCount, maxSamplePages);
    let textCharCount = 0;
    const perPageChars: number[] = [];

    for (let i = 1; i <= sample; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      let pageChars = 0;
      for (const item of text.items) {
        if ("str" in item && typeof item.str === "string") {
          pageChars += item.str.trim().length;
        }
      }
      perPageChars.push(pageChars);
      textCharCount += pageChars;
    }

    const scale = pageCount / Math.max(sample, 1);
    const estimatedChars = Math.round(textCharCount * scale);
    const avgCharsPerPage = estimatedChars / Math.max(pageCount, 1);
    const sparsePages = perPageChars.filter((c) => c < 80).length;
    const sparsePageRatio = sparsePages / Math.max(perPageChars.length, 1);

    const likelyScanned =
      avgCharsPerPage < 120 && (sparsePageRatio >= 0.55 || Math.min(...perPageChars, 0) < 40);
    const textLayerRich = avgCharsPerPage >= 500;
    const imageHeavy = file.size > 5 * 1024 * 1024 && !textLayerRich;

    let complexity: DocumentComplexity = "simple";
    if (pageCount > 40 || file.size > 25 * 1024 * 1024) complexity = "complex";
    else if (pageCount > 12 || likelyScanned || imageHeavy) complexity = "moderate";

    let documentClass: DocumentClass = "digital_text";
    if (likelyScanned) documentClass = "scanned";
    else if (imageHeavy) documentClass = "image_heavy";
    else if (file.size > 12 * 1024 * 1024 || pageCount > 20) documentClass = "large_file";
    else if (sparsePageRatio > 0.3 && !textLayerRich) documentClass = "mixed";

    const recommendOcr = likelyScanned;
    const recommendCloud =
      likelyScanned ||
      complexity !== "simple" ||
      imageHeavy ||
      pageCount > 15 ||
      file.size > 12 * 1024 * 1024;

    let reason = "This document has a good text layer — browser processing works well for quick tasks.";
    if (likelyScanned) {
      reason =
        "Scanned document detected. Cloud reconstruction preserves layout, tables, and images far better than browser mode.";
    } else if (imageHeavy) {
      reason = "Image-heavy PDF detected. Cloud processing delivers higher fidelity for this file.";
    } else if (complexity === "complex") {
      reason = "Large or complex document. Cloud processing is more reliable and produces better results.";
    } else if (recommendCloud) {
      reason = "Cloud processing is recommended for premium-quality output on this document.";
    }

    return {
      pageCount,
      sampledPages: sample,
      textCharCount: estimatedChars,
      avgCharsPerPage: Math.round(avgCharsPerPage),
      sparsePageRatio: Math.round(sparsePageRatio * 100) / 100,
      likelyScanned,
      textLayerRich,
      imageHeavy,
      complexity,
      documentClass,
      recommendCloud,
      recommendOcr,
      reason,
    };
  } finally {
    releasePdfDocument(file);
  }
}
