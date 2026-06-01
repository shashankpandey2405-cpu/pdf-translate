import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import {
  assertWithinBrowserPageCap,
  getPageProcessingChunkSize,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";

import { ConversionError } from "@/tools/conversions/ConversionError";

export async function pdfToWord(file: File): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
    const pdf = await acquirePdfDocument(file);
    try {
      assertWithinBrowserPageCap(pdf.numPages);
      let fullText = "";
      let charCount = 0;
      const chunk = getPageProcessingChunkSize();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        try {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item) => item && typeof (item as { str?: string }).str === "string")
            .map((item) => {
              const t = item as { str: string; hasEOL?: boolean };
              return t.str + (t.hasEOL ? "\n" : " ");
            })
            .join("");
          charCount += pageText.replace(/\s+/g, "").length;
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        } finally {
          page.cleanup();
        }
        if (i % chunk === 0) await yieldToMain();
      }

      const avgChars = charCount / Math.max(pdf.numPages, 1);
      if (avgChars < 80) {
        throw new ConversionError(
          "UNSUPPORTED",
          "This PDF appears to be scanned or image-based. Use Cloud Processing for layout-preserving Word (DOCX) output with OCR.",
        );
      }

      const rtfContent = buildRTF(fullText, file.name);
      return new TextEncoder().encode(rtfContent);
    } finally {
      releasePdfDocument(file);
    }
  });
}

function buildRTF(text: string, originalName: string): string {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par\n");

  return `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fcharset0 Arial;}}
{\\info{\\title ${originalName}}{\\author PDFTrusted}{\\company PDFTrusted.com}}
\\f1\\fs24
${escaped}
}`;
}

export function getWordFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + ".rtf";
}
