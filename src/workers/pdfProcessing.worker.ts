/// <reference lib="webworker" />
import * as Comlink from "comlink";
import { auditPdfDocument } from "@/lib/trustShield/documentAuditor";
import { mergePdfBuffers } from "./tasks/merge";
import { compressPdfBuffer, type CompressionLevel } from "./tasks/compress";
import { rotateAllPagesBuffer, rotatePagesBuffer, type PageRotation } from "./tasks/rotate";
import { splitPdfPagesBuffer, splitPdfSeparateBuffers } from "./tasks/split";

export type PdfWorkerApi = {
  ping(): Promise<"pong">;
  audit(buffer: ArrayBuffer, fileName: string): Promise<Awaited<ReturnType<typeof auditPdfDocument>>>;
  merge(buffers: ArrayBuffer[]): Promise<ArrayBuffer>;
  compress(buffer: ArrayBuffer, level: CompressionLevel): Promise<ArrayBuffer>;
  rotateAll(buffer: ArrayBuffer, angle: 90 | 180 | 270): Promise<ArrayBuffer>;
  rotatePages(buffer: ArrayBuffer, rotations: PageRotation[]): Promise<ArrayBuffer>;
  splitPages(buffer: ArrayBuffer, pageIndices: number[]): Promise<ArrayBuffer>;
  splitSeparate(buffer: ArrayBuffer, pageIndices: number[]): Promise<ArrayBuffer[]>;
};

const api: PdfWorkerApi = {
  ping: async () => "pong",
  audit: async (buffer, fileName) => {
    const file = new File([buffer], fileName, { type: "application/pdf" });
    return auditPdfDocument(file);
  },
  merge: async (buffers) => {
    const out = await mergePdfBuffers(buffers);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  },
  compress: async (buffer, level) => {
    const out = await compressPdfBuffer(buffer, level);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  },
  rotateAll: async (buffer, angle) => {
    const out = await rotateAllPagesBuffer(buffer, angle);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  },
  rotatePages: async (buffer, rotations) => {
    const out = await rotatePagesBuffer(buffer, rotations);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  },
  splitPages: async (buffer, pageIndices) => {
    const out = await splitPdfPagesBuffer(buffer, pageIndices);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  },
  splitSeparate: async (buffer, pageIndices) => {
    const outs = await splitPdfSeparateBuffers(buffer, pageIndices);
    return outs.map(
      (out) => out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer,
    );
  },
};

Comlink.expose(api);
