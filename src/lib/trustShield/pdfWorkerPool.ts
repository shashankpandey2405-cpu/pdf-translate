import * as Comlink from "comlink";
import type { PdfWorkerApi } from "@/workers/pdfProcessing.worker";
import type { DocumentAuditReport } from "./documentAuditor";
import type { CompressionLevel } from "@/tools/compress-pdf/logic";
import { logToolError } from "@/utils/logger";
import { enqueuePdfJob } from "@/lib/pdfJobQueue";
import type { PageRotation } from "@/workers/tasks/rotate";

type WorkerRemote = Comlink.Remote<PdfWorkerApi>;

let worker: Worker | null = null;
let remote: WorkerRemote | null = null;

function getRemote(): WorkerRemote | null {
  if (typeof window === "undefined") return null;
  if (remote && worker) return remote;
  try {
    worker = new Worker(new URL("../../workers/pdfProcessing.worker.ts", import.meta.url), {
      type: "module",
    });
    remote = Comlink.wrap<PdfWorkerApi>(worker);
    return remote;
  } catch (e) {
    logToolError("pdf-worker", "spawn", e, { recoverable: true });
    worker = null;
    remote = null;
    return null;
  }
}

export function terminatePdfWorker(): void {
  worker?.terminate();
  worker = null;
  remote = null;
}

export async function auditPdfInWorker(file: File): Promise<DocumentAuditReport> {
  const r = getRemote();
  const buf = await file.arrayBuffer();
  if (!r) {
    const { auditPdfDocument } = await import("./documentAuditor");
    return auditPdfDocument(file);
  }
  return r.audit(buf, file.name);
}

export async function mergePdfsInWorker(files: File[]): Promise<Uint8Array> {
  return enqueuePdfJob(async () => {
    const r = getRemote();
    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    if (!r) {
      const { mergePdfBuffers } = await import("@/workers/tasks/merge");
      return mergePdfBuffers(buffers);
    }
    const out = await r.merge(buffers);
    return new Uint8Array(out);
  });
}

export async function compressPdfInWorker(
  file: File,
  level: CompressionLevel,
): Promise<Uint8Array> {
  return enqueuePdfJob(async () => {
    const r = getRemote();
    const buf = await file.arrayBuffer();
    if (!r) {
      const { compressPdfBuffer } = await import("@/workers/tasks/compress");
      return compressPdfBuffer(buf, level);
    }
    const out = await r.compress(buf, level);
    return new Uint8Array(out);
  });
}

export async function rotatePagesInWorker(
  file: File,
  rotations: PageRotation[],
): Promise<Uint8Array> {
  return enqueuePdfJob(async () => {
    const r = getRemote();
    const buf = await file.arrayBuffer();
    if (!r) {
      const { rotatePagesBuffer } = await import("@/workers/tasks/rotate");
      return rotatePagesBuffer(buf, rotations);
    }
    const out = await r.rotatePages(buf, rotations);
    return new Uint8Array(out);
  });
}

export async function rotateAllPagesInWorker(
  file: File,
  angle: 90 | 180 | 270,
): Promise<Uint8Array> {
  return enqueuePdfJob(async () => {
    const r = getRemote();
    const buf = await file.arrayBuffer();
    if (!r) {
      const { rotateAllPagesBuffer } = await import("@/workers/tasks/rotate");
      return rotateAllPagesBuffer(buf, angle);
    }
    const out = await r.rotateAll(buf, angle);
    return new Uint8Array(out);
  });
}

export async function splitPdfPagesInWorker(
  file: File,
  pageIndices: number[],
): Promise<Uint8Array> {
  return enqueuePdfJob(async () => {
    const r = getRemote();
    const buf = await file.arrayBuffer();
    if (!r) {
      const { splitPdfPagesBuffer } = await import("@/workers/tasks/split");
      return splitPdfPagesBuffer(buf, pageIndices);
    }
    const out = await r.splitPages(buf, pageIndices);
    return new Uint8Array(out);
  });
}

export async function splitPdfSeparateInWorker(
  file: File,
  pageIndices: number[],
): Promise<Uint8Array[]> {
  return enqueuePdfJob(async () => {
    const r = getRemote();
    const buf = await file.arrayBuffer();
    if (!r) {
      const { splitPdfSeparateBuffers } = await import("@/workers/tasks/split");
      return splitPdfSeparateBuffers(buf, pageIndices);
    }
    const outs = await r.splitSeparate(buf, pageIndices);
    return outs.map((o) => new Uint8Array(o));
  });
}

export async function pingPdfWorker(): Promise<boolean> {
  const r = getRemote();
  if (!r) return false;
  try {
    return (await r.ping()) === "pong";
  } catch (e) {
    logToolError("pdf-worker", "ping", e, { recoverable: true });
    return false;
  }
}
