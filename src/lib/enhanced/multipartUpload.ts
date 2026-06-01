/**
 * Enhanced cloud multipart upload (Phase 4).
 * Uses existing multipart API with enhanced/input/ key prefix when enabled.
 */
import { isEnhancedMultipartEnabled } from "@/lib/featureFlags";
import { uploadFileMultipart } from "@/lib/chunkedUpload";

const MULTIPART_THRESHOLD_BYTES = 35 * 1024 * 1024;

export function shouldUseEnhancedMultipart(fileSize: number): boolean {
  return isEnhancedMultipartEnabled() && fileSize >= MULTIPART_THRESHOLD_BYTES;
}

export async function uploadEnhancedFile(
  file: File,
  presign: { url: string; key: string; contentType: string },
): Promise<void> {
  if (!shouldUseEnhancedMultipart(file.size)) {
    const put = await fetch(presign.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": presign.contentType },
    });
    if (!put.ok) {
      throw new Error(`Upload failed (HTTP ${put.status})`);
    }
    return;
  }

  await uploadFileMultipart(file, {
    onProgress: () => {},
  });
}
