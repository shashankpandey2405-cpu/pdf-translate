/**
 * Compress image to a target size in KB using browser-image-compression (binary search on quality).
 */
export async function resizeToTargetKb(file: File, targetKb: number): Promise<Blob> {
  if (targetKb < 5) throw new Error("Target size must be at least 5 KB.");
  const targetBytes = targetKb * 1024;
  const { default: imageCompression } = await import("browser-image-compression");

  if (file.size <= targetBytes) return file;

  let lo = 0.05;
  let hi = 1;
  let best: Blob = file;

  for (let pass = 0; pass < 14; pass++) {
    const quality = (lo + hi) / 2;
    const compressed = await imageCompression(file, {
      maxSizeMB: Math.max(targetKb / 1024 + 0.05, 0.1),
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: quality,
      alwaysKeepResolution: false,
    });
    if (compressed.size <= targetBytes) {
      best = compressed;
      lo = quality;
    } else {
      hi = quality;
    }
  }

  if (best.size > targetBytes) {
    const aggressive = await imageCompression(file, {
      maxSizeMB: targetKb / 1024,
      maxWidthOrHeight: 2400,
      useWebWorker: true,
      initialQuality: lo,
    });
    if (aggressive.size <= targetBytes) return aggressive;
  }

  return best;
}
