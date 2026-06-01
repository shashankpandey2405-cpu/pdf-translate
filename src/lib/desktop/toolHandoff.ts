import { getToolHref } from "../../../constants/tools";
import {
  newUploadSessionId,
  saveHybridUploadSession,
} from "@/lib/processing/hybridUploadSession";

/** Pass uploaded file to another tool without re-upload (IndexedDB session). */
export async function handoffFileToTool(file: File, targetSlug: string, routePath?: string): Promise<string> {
  await saveHybridUploadSession({
    sessionId: newUploadSessionId(),
    toolSlug: targetSlug,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    blob: file,
    preferredMode: "enhanced",
  });
  return getToolHref({ slug: targetSlug, routePath });
}
