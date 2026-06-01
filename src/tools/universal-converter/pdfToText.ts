import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import { ConversionError } from "@/tools/conversions/ConversionError";

export async function pdfToText(file: File): Promise<{ bytes: Uint8Array; filename: string }> {
  const pdf = await acquirePdfDocument(file);
  try {
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => "str" in item && "transform" in item)
        .map((item) => {
          const t = item as { str: string; hasEOL?: boolean };
          return t.str + (t.hasEOL ? "\n" : " ");
        })
        .join("");
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    if (!fullText.trim()) {
      throw new ConversionError("EMPTY", "No extractable text found in this PDF.");
    }
    const encoder = new TextEncoder();
    return {
      bytes: encoder.encode(fullText),
      filename: file.name.replace(/\.pdf$/i, "") + ".txt",
    };
  } finally {
    releasePdfDocument(file);
  }
}
