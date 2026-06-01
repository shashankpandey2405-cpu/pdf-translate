import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import {
  assertWithinBrowserPageCap,
  getPageProcessingChunkSize,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { ConversionError } from "@/tools/conversions/ConversionError";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function pdfToHtml(file: File): Promise<{ html: string; filename: string }> {
  return runStableBrowserJob(async () => {
    const pdf = await acquirePdfDocument(file);
    const sections: string[] = [];
    try {
      assertWithinBrowserPageCap(pdf.numPages);
      const chunk = getPageProcessingChunkSize();

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        try {
          const viewport = page.getViewport({ scale: 1 });
          const text = await page.getTextContent({ includeMarkedContent: false });
          const items = text.items as Array<{ str?: string }>;
          const paragraph = items
            .map((it) => (typeof it.str === "string" ? it.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          sections.push(
            `<section class="pdf-page" data-page="${pageNum}" style="max-width:${Math.round(viewport.width)}px">` +
              `<h2>Page ${pageNum}</h2>` +
              `<p class="pdf-text">${escapeHtml(paragraph || "(No extractable text on this page)")}</p>` +
              `</section>`,
          );
        } finally {
          page.cleanup();
        }
        if (pageNum % chunk === 0) await yieldToMain();
      }
    } finally {
      releasePdfDocument(file);
    }

    if (sections.length === 0) {
      throw new ConversionError("EMPTY", "No pages found in this PDF.");
    }

    const title = escapeHtml(file.name.replace(/\.pdf$/i, "") || "Document");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — PDFTrusted export</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 1.5rem; background: #f8fafc; color: #0f172a; }
    .wrap { max-width: 48rem; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    .pdf-page { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }
    .pdf-page h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 0.75rem; }
    .pdf-text { line-height: 1.65; margin: 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${title}</h1>
    ${sections.join("\n")}
  </div>
</body>
</html>`;

    return {
      html,
      filename: (file.name.replace(/\.pdf$/i, "") || "document") + ".html",
    };
  });
}
