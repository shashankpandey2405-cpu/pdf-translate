import { createStore, del, entries, get, set } from "idb-keyval";
import { safeId } from "@/lib/safeId";
import {
  LOCAL_HISTORY_BLOB_PREFIX,
  LOCAL_HISTORY_INDEX_KEY,
  LOCAL_HISTORY_MAX_AGE_MS,
  LOCAL_HISTORY_MAX_ENTRIES,
  LOCAL_HISTORY_MAX_TOTAL_BYTES,
  LOCAL_HISTORY_STORE_NAME,
} from "@/lib/history/constants";
import type { LocalHistoryEntry, LocalHistorySaveInput } from "@/lib/history/types";

const store = createStore(LOCAL_HISTORY_STORE_NAME, "files");

function blobKey(id: string): string {
  return `${LOCAL_HISTORY_BLOB_PREFIX}${id}`;
}

function newId(): string {
  return safeId("lh");
}

async function readIndex(): Promise<LocalHistoryEntry[]> {
  const index = await get<LocalHistoryEntry[]>(LOCAL_HISTORY_INDEX_KEY, store);
  return Array.isArray(index) ? index : [];
}

async function writeIndex(index: LocalHistoryEntry[]): Promise<void> {
  await set(LOCAL_HISTORY_INDEX_KEY, index, store);
}

function pruneByAge(index: LocalHistoryEntry[]): LocalHistoryEntry[] {
  const cutoff = Date.now() - LOCAL_HISTORY_MAX_AGE_MS;
  return index.filter((e) => e.createdAt >= cutoff);
}

async function enforceLimits(index: LocalHistoryEntry[]): Promise<LocalHistoryEntry[]> {
  let sorted = [...index].sort((a, b) => b.createdAt - a.createdAt);
  sorted = pruneByAge(sorted);

  while (sorted.length > LOCAL_HISTORY_MAX_ENTRIES) {
    const removed = sorted.pop();
    if (removed) await del(blobKey(removed.id), store);
  }

  let total = sorted.reduce((sum, e) => sum + e.size, 0);
  while (total > LOCAL_HISTORY_MAX_TOTAL_BYTES && sorted.length > 0) {
    const removed = sorted.pop();
    if (removed) {
      await del(blobKey(removed.id), store);
      total -= removed.size;
    }
  }

  return sorted;
}

export async function listLocalHistory(): Promise<LocalHistoryEntry[]> {
  if (typeof window === "undefined") return [];
  const index = await enforceLimits(await readIndex());
  await writeIndex(index);
  return index;
}

export async function getLocalHistoryEntry(id: string): Promise<LocalHistoryEntry | null> {
  const index = await listLocalHistory();
  return index.find((e) => e.id === id) ?? null;
}

export async function getLocalHistoryByJobId(jobId: string): Promise<LocalHistoryEntry | null> {
  const index = await listLocalHistory();
  return index.find((e) => e.jobId === jobId) ?? null;
}

export async function loadLocalHistoryBlob(id: string): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  const buf = await get<ArrayBuffer>(blobKey(id), store);
  if (!buf) return null;
  const entry = await getLocalHistoryEntry(id);
  const mimeType = entry?.mimeType ?? "application/octet-stream";
  return new Blob([buf], { type: mimeType });
}

export async function saveLocalHistoryEntry(input: LocalHistorySaveInput): Promise<LocalHistoryEntry | null> {
  if (typeof window === "undefined") return null;
  if (!input.blob.size) return null;

  const bytes = new Uint8Array(await input.blob.arrayBuffer());
  const mimeType = input.blob.type || "application/octet-stream";
  const id = newId();
  const entry: LocalHistoryEntry = {
    id,
    jobId: input.jobId,
    toolSlug: input.toolSlug,
    toolName: input.toolName,
    fileName: input.fileName,
    mimeType,
    size: bytes.byteLength,
    createdAt: Date.now(),
    inputR2Key: input.inputR2Key,
    outputR2Key: input.outputR2Key,
  };

  let index = await readIndex();
  index = index.filter((e) => e.jobId !== entry.jobId);
  index.unshift(entry);

  await set(blobKey(id), bytes, store);
  index = await enforceLimits(index);
  await writeIndex(index);

  return entry;
}

export async function deleteLocalHistoryEntry(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const index = (await readIndex()).filter((e) => e.id !== id);
  await del(blobKey(id), store);
  await writeIndex(index);
}

export async function clearLocalHistory(): Promise<void> {
  if (typeof window === "undefined") return;
  const all = await entries(store);
  await Promise.all(
    all.map(([key]) => {
      if (key === LOCAL_HISTORY_INDEX_KEY) return Promise.resolve();
      return del(key, store);
    }),
  );
  await writeIndex([]);
}

export function localHistoryEntryToFile(entry: LocalHistoryEntry, blob: Blob): File {
  return new File([blob], entry.fileName, { type: entry.mimeType || blob.type || "application/octet-stream" });
}
