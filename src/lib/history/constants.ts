/** IndexedDB store for enhanced / cloud job outputs kept locally after server purge. */
export const LOCAL_HISTORY_STORE_NAME = "pdftrusted-local-history";
export const LOCAL_HISTORY_INDEX_KEY = "__local_history_index__";
export const LOCAL_HISTORY_BLOB_PREFIX = "lh:";

export const LOCAL_HISTORY_MAX_ENTRIES = 25;
export const LOCAL_HISTORY_MAX_TOTAL_BYTES = 300 * 1024 * 1024;
export const LOCAL_HISTORY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Cloud R2 copy removed from servers after this window (client timer + purge API). */
export const CLOUD_OUTPUT_TTL_SEC = 60;
