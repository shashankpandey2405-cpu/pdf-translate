import { inferContentTypeFromFilename } from "@/lib/enhanced/inferUploadContentType";

/** Resolve declared MIME for magic-byte validation at job enqueue. */
export function resolveJobDeclaredMime(
  inputR2Key: string,
  jobOptions?: Record<string, unknown>,
): string {
  if (typeof jobOptions?.contentType === "string" && jobOptions.contentType.trim()) {
    return jobOptions.contentType.trim();
  }
  if (typeof jobOptions?.mimeType === "string" && jobOptions.mimeType.trim()) {
    return jobOptions.mimeType.trim();
  }
  const leaf = inputR2Key.split("/").pop() ?? "";
  const dash = leaf.indexOf("-");
  const filename = dash >= 0 ? leaf.slice(dash + 1) : leaf;
  return inferContentTypeFromFilename(filename);
}
