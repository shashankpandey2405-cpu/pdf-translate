/** Structured logs for cloud queue / OCR pipeline (grep-friendly in Vercel/Railway). */
import { addServerBreadcrumb } from "@/server/monitoring/capture";

export function logQueueEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): void {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${String(v)}`);
  console.log(`[cloud-queue] ${event} ${parts.join(" ")}`);

  if (
    event === "enqueue_failed" ||
    event === "enqueue_exception" ||
    event === "job_failed"
  ) {
    addServerBreadcrumb(`[cloud-queue] ${event}`, {
      ...(Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [
          k,
          typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : String(v),
        ]),
      ) as Record<string, string | number | boolean>),
    });
  }
}
