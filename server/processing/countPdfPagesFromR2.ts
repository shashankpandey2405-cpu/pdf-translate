import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getAppEnv } from "@/server/types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";

const TAIL_BYTES = 512 * 1024;
const MAX_PAGES = 10_000;

function parsePageCountFromPdfBytes(bytes: Uint8Array): number | null {
  const text = new TextDecoder("latin1", { fatal: false }).decode(bytes);
  const matches = [...text.matchAll(/\/Count\s+(\d+)/g)];
  if (!matches.length) return null;
  let best = 0;
  for (const m of matches) {
    const n = Number.parseInt(m[1] ?? "", 10);
    if (Number.isFinite(n) && n > best && n <= MAX_PAGES) best = n;
  }
  return best > 0 ? best : null;
}

async function readObjectTail(key: string, tailSize: number): Promise<Uint8Array> {
  const env = getAppEnv();
  if (!hasS3Credentials(env)) throw new Error("S3 not configured");
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const size = head.ContentLength ?? 0;
  if (size <= 0) return new Uint8Array();
  const start = Math.max(0, size - tailSize);
  const res = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: `bytes=${start}-${size - 1}`,
    }),
  );
  const body = await res.Body?.transformToByteArray();
  return new Uint8Array(body ?? []);
}

async function countWithPdfJs(bytes: Uint8Array): Promise<number | null> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data: bytes, disableFontFace: true, useSystemFonts: true }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Server-authoritative PDF page count from R2 (tail parse, then optional full read). */
export async function countPdfPagesFromR2Key(
  key: string,
  opts?: { maxFullReadBytes?: number },
): Promise<number | null> {
  const maxFull = opts?.maxFullReadBytes ?? 25 * 1024 * 1024;
  const tail = await readObjectTail(key, TAIL_BYTES);
  const fromTail = parsePageCountFromPdfBytes(tail);
  if (fromTail !== null) return fromTail;

  const env = getAppEnv();
  if (!hasS3Credentials(env)) return null;
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const size = head.ContentLength ?? 0;
  if (size <= 0 || size > maxFull) return null;

  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await res.Body?.transformToByteArray();
  if (!body?.length) return null;
  return countWithPdfJs(new Uint8Array(body));
}

export type ResolvedPageCount = {
  pages: number | null;
  source: "client" | "server" | "default";
};

/**
 * Prefer server count for PDFs; reject when client claims far more pages than server sees.
 */
export async function resolveEnqueuePageCount(
  inputR2Key: string,
  kind: "pdf" | "zip" | "image" | "office" | null,
  clientPageCount: number | null,
): Promise<{ ok: true; resolved: ResolvedPageCount } | { ok: false; message: string }> {
  if (kind !== "pdf") {
    const pages =
      clientPageCount !== null && Number.isFinite(clientPageCount) && clientPageCount > 0
        ? Math.round(clientPageCount)
        : 1;
    return { ok: true, resolved: { pages, source: "client" } };
  }

  const serverCount = await countPdfPagesFromR2Key(inputR2Key);
  const client =
    clientPageCount !== null && Number.isFinite(clientPageCount) && clientPageCount > 0
      ? Math.round(clientPageCount)
      : null;

  if (serverCount !== null) {
    if (client !== null && client > serverCount + 5) {
      return {
        ok: false,
        message: `Page count mismatch (claimed ${client}, document has ${serverCount}). Refresh and try again.`,
      };
    }
    return { ok: true, resolved: { pages: serverCount, source: "server" } };
  }

  if (client !== null) {
    return { ok: true, resolved: { pages: client, source: "client" } };
  }

  return { ok: true, resolved: { pages: 1, source: "default" } };
}
