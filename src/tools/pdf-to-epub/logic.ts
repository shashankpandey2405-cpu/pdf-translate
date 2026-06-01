import { strToU8, zipSync } from "fflate";
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import {
  assertWithinBrowserPageCap,
  getPageProcessingChunkSize,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { ConversionError } from "@/tools/conversions/ConversionError";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getEpubFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + ".epub";
}

/**
 * Minimal EPUB 3 (text-only) from extractable PDF text — suitable for reflow readers.
 */
export async function pdfToEpubBytes(file: File): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
    const pdf = await acquirePdfDocument(file);
    try {
      assertWithinBrowserPageCap(pdf.numPages);
      const sections: string[] = [];
      const chunk = getPageProcessingChunkSize();

      for (let p = 1; p <= pdf.numPages; p += 1) {
        let page;
        try {
          page = await pdf.getPage(p);
        } catch {
          continue;
        }
        try {
          let textContent;
          try {
            textContent = await page.getTextContent();
          } catch {
            continue;
          }
          const parts = textContent.items.flatMap((item) => {
            if ("str" in item && typeof (item as { str?: unknown }).str === "string") {
              const t = String((item as { str: string }).str).trim();
              return t ? [t] : [];
            }
            return [];
          });
          const body = parts.length ? escapeXml(parts.join(" ")) : "";
          sections.push(
            `<section xmlns="http://www.w3.org/1999/xhtml" id="p${p}"><h2>Page ${p}</h2><p>${body || "<em>(no extractable text)</em>"}</p></section>`,
          );
        } finally {
          page.cleanup();
        }
        if (p % chunk === 0) await yieldToMain();
      }

      if (!sections.length) {
        throw new ConversionError("EMPTY", "No pages could be read from this PDF.");
      }

      const title = file.name.replace(/\.pdf$/i, "") || "document";
      const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head><title>${escapeXml(title)}</title></head>
<body>${sections.join("\n")}</body>
</html>`;

      const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head><title>Navigation</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>Contents</h1><ol><li><a href="chapter.xhtml">Document</a></li></ol></nav>
</body>
</html>`;

      const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`;

      const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">urn:uuid:pdftrusted-browser-export</dc:identifier>
<dc:title>${escapeXml(title)}</dc:title>
<dc:language>en</dc:language>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="c1" href="chapter.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine><itemref idref="c1"/></spine>
</package>`;

      const zipEntries: Record<string, Uint8Array> = {
        mimetype: strToU8("application/epub+zip"),
        "META-INF/container.xml": strToU8(containerXml),
        "OEBPS/content.opf": strToU8(contentOpf),
        "OEBPS/nav.xhtml": strToU8(navXhtml),
        "OEBPS/chapter.xhtml": strToU8(chapterXhtml),
      };

      const zipped = zipSync(zipEntries, { level: 0 }) as Uint8Array;
      const out = new ArrayBuffer(zipped.byteLength);
      new Uint8Array(out).set(zipped);
      return new Uint8Array(out);
    } finally {
      releasePdfDocument(file);
    }
  });
}
