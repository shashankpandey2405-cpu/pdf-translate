import { PDFDocument } from "pdf-lib";

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function dataUrlByteLength(dataUrl: string): number {
  const payload = dataUrl.split(",")[1] ?? "";
  return Math.floor((payload.length * 3) / 4);
}

export async function rebuildPdfFromPageImages(pageDataUrls: string[]): Promise<Blob> {
  function asBlobPart(bytes: Uint8Array): BlobPart {
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    return ab;
  }

  const doc = await PDFDocument.create();
  for (const dataUrl of pageDataUrls) {
    const [header, b64] = dataUrl.split(",");
    const mime = /data:(image\/[a-zA-Z0-9.+-]+);base64/.exec(header)?.[1] || "image/png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (mime === "image/png") {
      const embedded = await doc.embedPng(bytes);
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    } else {
      const embedded = await doc.embedJpg(bytes);
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    }
  }
  const bytes = await doc.save();
  return new Blob([asBlobPart(bytes)], { type: "application/pdf" });
}
