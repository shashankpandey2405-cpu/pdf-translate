/** Browser-only DOCX → HTML for result preview (mammoth, loaded on demand). */

const PREVIEW_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise
      .then((v) => {
        window.clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        window.clearTimeout(timer);
        reject(e);
      });
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fast text-only preview while full HTML renders. */
export async function docxBlobToPreviewText(blob: Blob): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await blob.arrayBuffer();
  const result = await withTimeout(
    mammoth.extractRawText({ arrayBuffer }),
    PREVIEW_TIMEOUT_MS,
    "Word text preview",
  );
  return (result.value || "").trim();
}

export async function docxBlobToPreviewHtml(blob: Blob): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await blob.arrayBuffer();

  const result = await withTimeout(
    mammoth.convertToHtml(
      { arrayBuffer },
      {
        ignoreEmptyParagraphs: true,
        // Skip embedded page images — they hang preview on large pdf2docx outputs.
        convertImage: mammoth.images.imgElement(() =>
          Promise.resolve({ src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" }),
        ),
      },
    ),
    PREVIEW_TIMEOUT_MS,
    "Word preview",
  );

  const html = (result.value || "").trim();
  if (html) return html;

  const raw = await docxBlobToPreviewText(blob);
  if (!raw) return "<p class=\"text-muted-foreground\">Preview unavailable — download to open in Word.</p>";
  return `<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">${escapeHtml(raw)}</pre>`;
}

export function isDocxFilename(filename: string): boolean {
  return /\.docx$/i.test(filename);
}
