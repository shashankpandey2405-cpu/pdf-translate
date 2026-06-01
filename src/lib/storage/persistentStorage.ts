/**
 * Request durable IndexedDB / Cache Storage quota via the Storage Manager API.
 * Replaces deprecated `webkitStorageInfo.requestQuota(StorageType.persistent, …)`.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Fire-and-forget — safe to call during app bootstrap. */
export function ensurePersistentStorage(): void {
  if (typeof window === "undefined") return;
  void requestPersistentStorage();
}
