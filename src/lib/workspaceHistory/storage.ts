import { createStore, del, entries, get, set } from "idb-keyval";
import { safeId } from "@/lib/safeId";
import {
  WORKSPACE_BLOB_PREFIX,
  WORKSPACE_INDEX_KEY,
  WORKSPACE_MAX_AGE_MS,
  WORKSPACE_MAX_ENTRIES,
  getWorkspaceMaxTotalBytes,
} from "@/lib/workspaceHistory/constants";
import type { WorkspaceHistoryEntry, WorkspaceSaveInput } from "@/lib/workspaceHistory/types";

const store = createStore("pdftrusted-workspace", "files");

function blobKey(id: string): string {
  return `${WORKSPACE_BLOB_PREFIX}${id}`;
}

function newId(): string {
  return safeId("ws");
}

async function readIndex(): Promise<WorkspaceHistoryEntry[]> {
  const index = await get<WorkspaceHistoryEntry[]>(WORKSPACE_INDEX_KEY, store);
  return Array.isArray(index) ? index : [];
}

async function writeIndex(index: WorkspaceHistoryEntry[]): Promise<void> {
  await set(WORKSPACE_INDEX_KEY, index, store);
}

function pruneByAge(index: WorkspaceHistoryEntry[]): WorkspaceHistoryEntry[] {
  const cutoff = Date.now() - WORKSPACE_MAX_AGE_MS;
  return index.filter((e) => e.updatedAt >= cutoff);
}

async function enforceLimits(index: WorkspaceHistoryEntry[]): Promise<WorkspaceHistoryEntry[]> {
  let sorted = [...index].sort((a, b) => b.updatedAt - a.updatedAt);
  sorted = pruneByAge(sorted);

  while (sorted.length > WORKSPACE_MAX_ENTRIES) {
    const removed = sorted.pop();
    if (removed) await del(blobKey(removed.id), store);
  }

  let total = sorted.reduce((sum, e) => sum + e.size, 0);
  while (total > getWorkspaceMaxTotalBytes() && sorted.length > 0) {
    const removed = sorted.pop();
    if (removed) {
      await del(blobKey(removed.id), store);
      total -= removed.size;
    }
  }

  return sorted;
}

export async function listWorkspaceHistory(): Promise<WorkspaceHistoryEntry[]> {
  const index = await enforceLimits(await readIndex());
  await writeIndex(index);
  return index;
}

export async function loadWorkspaceBlob(id: string): Promise<ArrayBuffer | null> {
  const buf = await get<ArrayBuffer>(blobKey(id), store);
  return buf ?? null;
}

export async function getWorkspaceEntry(id: string): Promise<WorkspaceHistoryEntry | null> {
  const index = await listWorkspaceHistory();
  return index.find((e) => e.id === id) ?? null;
}

export async function saveWorkspaceSession(input: WorkspaceSaveInput): Promise<WorkspaceHistoryEntry | null> {
  if (typeof window === "undefined") return null;

  const bytes =
    input.data instanceof Blob ? new Uint8Array(await input.data.arrayBuffer()) : input.data;
  if (!bytes.byteLength) return null;

  const mimeType = input.mimeType ?? "application/pdf";
  const id = newId();
  const entry: WorkspaceHistoryEntry = {
    id,
    filename: input.filename,
    toolSlug: input.toolSlug,
    toolLabel: input.toolLabel,
    size: bytes.byteLength,
    updatedAt: Date.now(),
    mimeType,
  };

  let index = await readIndex();
  index = index.filter((e) => !(e.toolSlug === entry.toolSlug && e.filename === entry.filename));
  index.unshift(entry);

  await set(blobKey(id), new Uint8Array(bytes), store);
  index = await enforceLimits(index);
  await writeIndex(index);

  return entry;
}

export async function deleteWorkspaceEntry(id: string): Promise<void> {
  const index = (await readIndex()).filter((e) => e.id !== id);
  await del(blobKey(id), store);
  await writeIndex(index);
}

export async function clearAllWorkspaceHistory(): Promise<void> {
  const all = await entries(store);
  await Promise.all(
    all.map(([key]) => {
      if (key === WORKSPACE_INDEX_KEY) return Promise.resolve();
      return del(key, store);
    }),
  );
  await writeIndex([]);
}

export function workspaceEntryToFile(entry: WorkspaceHistoryEntry, buffer: ArrayBuffer): File {
  return new File([buffer], entry.filename, { type: entry.mimeType || "application/pdf" });
}
