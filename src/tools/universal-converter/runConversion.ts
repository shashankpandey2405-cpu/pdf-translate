import type { FormatId, TargetId } from "@/data/universalConverter/matrix";
import { formatLabel } from "@/data/universalConverter/matrix";
import { ConversionError } from "@/tools/conversions/ConversionError";
import { processToolOutput } from "@/tools/toolPipeline/registry";
import { pdfToHtml } from "@/tools/pdf-to-html/logic";
import { pdfToText } from "@/tools/universal-converter/pdfToText";
import { imageFileToPdf } from "@/tools/universal-converter/imagesToPdf";
import { convertImageFile, compressImageFile } from "@/tools/universal-converter/imageConvert";

export type ConversionResult = { blob: Blob; filename: string };

function asBlobPart(data: Uint8Array): BlobPart {
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  return ab;
}

const IMAGE_FORMATS = new Set<FormatId>(["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "bmp"]);

export async function runUniversalConversion(
  file: File,
  from: FormatId,
  to: TargetId,
): Promise<ConversionResult> {
  if (from === to) {
    throw new ConversionError("UNSUPPORTED", "Source and destination formats are the same.");
  }

  if (from === "pdf") {
    if (to === "html") {
      const { html, filename } = await pdfToHtml(file);
      return { blob: new Blob([html], { type: "text/html;charset=utf-8" }), filename };
    }
    if (to === "txt") {
      const { bytes, filename } = await pdfToText(file);
      return { blob: new Blob([asBlobPart(bytes)], { type: "text/plain;charset=utf-8" }), filename };
    }
    if (to === "docx" || to === "doc") {
      return processToolOutput("pdf-to-word", file);
    }
    if (to === "jpg" || to === "jpeg") return processToolOutput("pdf-to-jpg", file);
    if (to === "png") return processToolOutput("pdf-to-png", file);
    if (to === "epub") return processToolOutput("pdf-to-epub", file);
    if (to === "xlsx" || to === "xls") return processToolOutput("pdf-to-excel", file);
  }

  if ((from === "xlsx" || from === "xls") && to === "pdf") {
    return processToolOutput("excel-to-pdf", file);
  }

  if (IMAGE_FORMATS.has(from) && to === "pdf") {
    const prepared = await compressImageFile(file);
    const { bytes, filename } = await imageFileToPdf(prepared);
    return { blob: new Blob([asBlobPart(bytes)], { type: "application/pdf" }), filename };
  }

  if (IMAGE_FORMATS.has(from) && (to === "jpg" || to === "jpeg" || to === "png" || to === "webp")) {
    const prepared = from === "heic" || from === "heif" ? file : await compressImageFile(file);
    const { blob, filename } = await convertImageFile(prepared, to);
    return { blob, filename };
  }

  if ((from === "docx" || from === "doc") && to === "pdf") {
    throw new ConversionError(
      "UNSUPPORTED",
      "Word to PDF runs on Trusted Cloud for best fidelity. Open Word to PDF from All Tools, sign in free, and upload your document (up to 60MB).",
    );
  }

  throw new ConversionError(
    "UNSUPPORTED",
    `Conversion from ${formatLabel(from)} to ${formatLabel(to)} is not supported yet.`,
  );
}
