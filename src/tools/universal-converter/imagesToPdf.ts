import { PDFDocument } from "pdf-lib";
import { scaleDownImageBitmap } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { ConversionError } from "@/tools/conversions/ConversionError";

async function fileToPngBytes(file: File): Promise<Uint8Array> {
  let blob: Blob = file;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif") || file.type.includes("heic")) {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/png", quality: 0.92 });
    const converted = Array.isArray(result) ? result[0] : result;
    if (!converted) throw new ConversionError("UNSUPPORTED", "Could not convert HEIC/HEIF image.");
    blob = converted;
  }
  let bitmap = await createImageBitmap(blob);
  bitmap = await scaleDownImageBitmap(bitmap);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ConversionError("UNSUPPORTED", "Could not process this image.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image encode failed"))), "image/png");
  });
  return new Uint8Array(await pngBlob.arrayBuffer());
}

/** Embed one or more images into a single PDF (client-side, pdf-lib). */
export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  if (!files.length) throw new ConversionError("EMPTY", "No images provided.");
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const bytes = await fileToPngBytes(file);
    const image = await pdfDoc.embedPng(bytes);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

export async function imageFileToPdf(file: File): Promise<{ bytes: Uint8Array; filename: string }> {
  const bytes = await imagesToPdf([file]);
  const base = file.name.replace(/\.[^.]+$/i, "") || "image";
  return { bytes, filename: `${base}.pdf` };
}
