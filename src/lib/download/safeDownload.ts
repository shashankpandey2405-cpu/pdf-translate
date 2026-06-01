import { toast } from "sonner";
import { isIOS } from "@/lib/download/isIOS";
import { scheduleFeedbackPrompt } from "@/lib/feedback/feedbackTrigger";
import { triggerShareNudge } from "@/lib/share/shareNudge";

const REVOKE_DELAY_MS = 5000;

function notifyDownloadSuccess(toolName?: string, filename?: string): void {
  if (typeof window === "undefined") return;
  const name = toolName ?? filename?.replace(/\.[^.]+$/, "") ?? "pdf-tool";
  scheduleFeedbackPrompt({ toolName: name, pageUrl: window.location.pathname });
  triggerShareNudge();
}

function sanitizeFilename(name: string): string {
  const trimmed = (name || "download").trim();
  return trimmed.replace(/[^\w.\-()+\s]/g, "_") || "download.pdf";
}

async function clickAnchor(href: string, filename: string): Promise<void> {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  await new Promise((r) => window.setTimeout(r, 350));
  a.remove();
}

/** Direct file download — never opens the OS / browser share sheet. */
export async function safeDownloadBlob(
  blob: Blob,
  filename: string,
  options?: { toolName?: string; skipFeedback?: boolean },
): Promise<void> {
  const safeName = sanitizeFilename(filename);

  if (isIOS()) {
    await new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          reject(new Error("Could not prepare file for download."));
          return;
        }
        const opened = window.open(dataUrl, "_blank", "noopener,noreferrer");
        if (opened) {
          toast.success("Document ready", {
            description: "Tap and hold the preview, then choose Save to Files.",
          });
          if (!options?.skipFeedback) notifyDownloadSuccess(options?.toolName, safeName);
          resolve();
          return;
        }
        void clickAnchor(dataUrl, safeName)
          .then(() => {
            toast.success("Download started", { description: safeName });
            if (!options?.skipFeedback) notifyDownloadSuccess(options?.toolName, safeName);
            resolve();
          })
          .catch(reject);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
      reader.readAsDataURL(blob);
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  try {
    await clickAnchor(url, safeName);
    toast.success("Download started", { description: safeName });
    if (!options?.skipFeedback) notifyDownloadSuccess(options?.toolName, safeName);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }
}

/** Native share sheet — use only from explicit Share buttons. */
export async function shareBlob(blob: Blob, filename: string): Promise<void> {
  const safeName = sanitizeFilename(filename);

  if (typeof navigator === "undefined" || !navigator.share) {
    toast.error("Sharing is not supported here", {
      description: "Use Download to save the file to your device.",
    });
    return;
  }

  try {
    const file = new File([blob], safeName, { type: blob.type || "application/octet-stream" });
    if (!navigator.canShare?.({ files: [file] })) {
      toast.error("This file cannot be shared from the browser", {
        description: "Use Download instead.",
      });
      return;
    }
    await navigator.share({ files: [file], title: safeName });
    toast.success("Share", { description: "Choose an app to share your file." });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    toast.error("Share failed", { description: "Try Download instead." });
  }
}

/** Revoke blob URLs only after the browser has started the download (avoids back-nav errors). */
export function scheduleRevokeObjectUrl(url: string, delayMs = REVOKE_DELAY_MS): void {
  window.setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, delayMs);
}

/** Download from an existing object URL without revoking the preview URL immediately. */
export async function safeDownloadObjectUrl(
  objectUrl: string,
  filename: string,
  opts?: { revokeAfter?: boolean },
): Promise<void> {
  const safeName = sanitizeFilename(filename);
  if (isIOS()) {
    const res = await fetch(objectUrl);
    const blob = await res.blob();
    await safeDownloadBlob(blob, safeName);
    if (opts?.revokeAfter) scheduleRevokeObjectUrl(objectUrl);
    return;
  }
  await clickAnchor(objectUrl, safeName);
  toast.success("Download started", { description: safeName });
  if (opts?.revokeAfter) scheduleRevokeObjectUrl(objectUrl);
}
