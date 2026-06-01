import { ConversionError } from "@/tools/conversions/ConversionError";
import type { TargetId } from "@/data/universalConverter/matrix";

async function heicToBlob(file: File, toType: "image/jpeg" | "image/png"): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType, quality: 0.92 });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob) throw new ConversionError("UNSUPPORTED", "Could not convert HEIC image.");
  return blob;
}

async function rasterizeToCanvas(file: File): Promise<HTMLCanvasElement> {
  let blob: Blob = file;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif") || file.type.includes("heic")) {
    blob = await heicToBlob(file, "image/png");
  }
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ConversionError("UNSUPPORTED", "Could not read image.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

export async function convertImageFile(
  file: File,
  to: Extract<TargetId, "jpg" | "jpeg" | "png" | "webp">,
): Promise<{ blob: Blob; filename: string }> {
  const canvas = await rasterizeToCanvas(file);
  const base = file.name.replace(/\.[^.]+$/i, "") || "image";

  if (to === "jpg" || to === "jpeg") {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPG encode failed"))), "image/jpeg", 0.92);
    });
    return { blob, filename: `${base}.jpg` };
  }

  if (to === "png") {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png");
    });
    return { blob, filename: `${base}.png` };
  }

  if (to === "webp") {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("WebP encode failed"))), "image/webp", 0.92);
    });
    return { blob, filename: `${base}.webp` };
  }

  throw new ConversionError("UNSUPPORTED", `Cannot convert to ${to}.`);
}

/** Optional lossless re-encode via browser-image-compression for smaller JPG output. */
export async function compressImageFile(file: File, maxMb = 2): Promise<File> {
  try {
    const { default: imageCompression } = await import("browser-image-compression");
    const compressed = await imageCompression(file, {
      maxSizeMB: maxMb,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
    });
    return compressed;
  } catch {
    return file;
  }
}
