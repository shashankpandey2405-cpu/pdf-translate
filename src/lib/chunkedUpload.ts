import {
  TIER_CLIENT_MAX,
  TIER_MAX_UPLOAD,
  TIER_PREMIUM_MAX_UPLOAD,
  TIER_PRESIGNED_PUT_MAX,
  maxUploadBytesForTier,
  sizeExceedsUploadMessage,
} from "@/lib/uploadTiers";
import { isPrivacyFirstMode } from "@/lib/trustShield/storage";
import {
  postDeleteStagedKeys,
  registerStagedKeys,
  unregisterStagedKeys,
} from "@/lib/stagedFileRegistry";
import { logPipelineFailure } from "@/utils/logger";

type MultipartInitResponse = {
  uploadId: string;
  key: string;
  partSize: number;
  uploadToken: string;
};

type MultipartSession = {
  uploadId: string;
  key: string;
  partSize: number;
  uploadToken: string;
  fileName: string;
  fileSize: number;
  fileLastModified: number;
  uploadedParts: Record<number, string>;
};

type UploadResult = {
  key: string;
  location: string;
  etag: string;
};

type UploadOptions = {
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
  maxUploadBytes?: number;
};

async function resolveClientUploadPolicy(
  explicitMax?: number,
): Promise<{ maxBytes: number; isPremium: boolean }> {
  if (explicitMax != null && Number.isFinite(explicitMax) && explicitMax > 0) {
    return {
      maxBytes: explicitMax,
      isPremium: explicitMax >= TIER_PREMIUM_MAX_UPLOAD,
    };
  }
  if (typeof window === "undefined") {
    return { maxBytes: TIER_MAX_UPLOAD, isPremium: false };
  }
  try {
    const res = await fetch("/api/session", { credentials: "include", cache: "no-store" });
    if (!res.ok) return { maxBytes: TIER_MAX_UPLOAD, isPremium: false };
    const data = (await res.json()) as { isPremium?: boolean; user?: unknown };
    const isPremium = Boolean(data.isPremium);
    const isSignedIn = Boolean(data.user);
    return {
      maxBytes: maxUploadBytesForTier(isPremium, isSignedIn),
      isPremium,
    };
  } catch {
    return { maxBytes: TIER_MAX_UPLOAD, isPremium: false };
  }
}

function getSessionStorageKey(file: File) {
  return `pt_multipart_${file.name}_${file.size}_${file.lastModified}`;
}

function readSession(file: File): MultipartSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(getSessionStorageKey(file));
    if (!raw) return null;
    return JSON.parse(raw) as MultipartSession;
  } catch {
    return null;
  }
}

function saveSession(file: File, session: MultipartSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getSessionStorageKey(file), JSON.stringify(session));
}

function clearSession(file: File) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(getSessionStorageKey(file));
}

/** Best-effort: delete staged R2 keys after successful browser processing (signed-in users). */
export async function deleteStagedKeys(keys: string[]): Promise<void> {
  const safe = keys.filter((k) => k.startsWith("staging/") || k.startsWith("uploads/"));
  if (!safe.length) return;
  const ok = await postDeleteStagedKeys(safe);
  if (ok) unregisterStagedKeys(safe);
}

async function requestJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data as T;
}

async function putPart(
  signedUrl: string,
  chunk: Blob,
  onDelta: (deltaBytes: number) => void,
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let loaded = 0;
    xhr.open("PUT", signedUrl, true);
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const delta = Math.max(0, ev.loaded - loaded);
      loaded = ev.loaded;
      if (delta > 0) onDelta(delta);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        resolve(etag ? etag.replace(/"/g, "") : "");
      } else {
        reject(new Error(`Part upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading part"));
    xhr.send(chunk);
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  const err = lastError instanceof Error ? lastError : new Error("Upload failed");
  logPipelineFailure("chunked-upload", "multipart_upload", err, {
    file_type: "multipart",
  });
  throw err;
}

async function uploadViaR2Proxy(key: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("key", key);
  form.append("file", file, file.name);
  form.append("contentType", file.type || "application/octet-stream");
  form.append("filename", file.name);
  const res = await fetch("/api/r2/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(data.message ?? data.error ?? `Secure upload failed (HTTP ${res.status})`);
  }
}

async function uploadFilePresignedPut(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const init = await requestJson<{ url: string; key: string }>("/api/r2/presign-put", {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    fileSize: file.size,
  });
  const onProgress = options.onProgress ?? (() => undefined);

  try {
    await uploadViaR2Proxy(init.key, file);
    onProgress(file.size, file.size);
    return { key: init.key, location: init.url.split("?")[0] ?? "", etag: "" };
  } catch {
    /* fall through to direct R2 PUT */
  }

  const etag = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let loaded = 0;
    xhr.open("PUT", init.url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const delta = Math.max(0, ev.loaded - loaded);
      loaded = ev.loaded;
      if (delta > 0) onProgress(loaded, file.size);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const h = xhr.getResponseHeader("ETag");
        resolve(h ? h.replace(/"/g, "") : "");
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading file"));
    xhr.send(file);
  });
  onProgress(file.size, file.size);
  return { key: init.key, location: init.url.split("?")[0] ?? "", etag };
}

export async function uploadFileMultipart(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const existing = readSession(file);
  if (existing && !existing.uploadToken) {
    clearSession(file);
    return uploadFileMultipart(file, options);
  }
  const session = existing ?? await (async () => {
    const init = await requestJson<MultipartInitResponse>("/api/multipart/init", {
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    });
    const started: MultipartSession = {
      uploadId: init.uploadId,
      key: init.key,
      partSize: init.partSize,
      uploadToken: init.uploadToken,
      fileName: file.name,
      fileSize: file.size,
      fileLastModified: file.lastModified,
      uploadedParts: {},
    };
    saveSession(file, started);
    return started;
  })();

  const totalParts = Math.ceil(file.size / session.partSize);
  let uploadedBytes = 0;
  const onProgress = options.onProgress ?? (() => undefined);

  for (let i = 1; i <= totalParts; i += 1) {
    const start = (i - 1) * session.partSize;
    const end = Math.min(start + session.partSize, file.size);
    const partSize = end - start;
    if (session.uploadedParts[i]) {
      uploadedBytes += partSize;
      continue;
    }

    const chunk = file.slice(start, end);
    const { url } = await requestJson<{ url: string }>("/api/multipart/sign-part", {
      key: session.key,
      uploadId: session.uploadId,
      uploadToken: session.uploadToken,
      partNumber: i,
    });

    const etag = await withRetry(
      () => putPart(url, chunk, (delta) => {
        uploadedBytes += delta;
        onProgress(uploadedBytes, file.size);
      }),
      2,
    );

    session.uploadedParts[i] = etag;
    saveSession(file, session);
    onProgress(uploadedBytes, file.size);
  }

  const parts = Object.keys(session.uploadedParts)
    .map((partNum) => Number(partNum))
    .sort((a, b) => a - b)
    .map((partNumber) => ({ partNumber, etag: session.uploadedParts[partNumber] }));

  const completed = await requestJson<UploadResult>("/api/multipart/complete", {
    key: session.key,
    uploadId: session.uploadId,
    uploadToken: session.uploadToken,
    parts,
  });
  clearSession(file);
  onProgress(file.size, file.size);
  return completed;
}

export async function uploadFilesMultipart(
  files: File[],
  options: UploadOptions = {},
): Promise<UploadResult[]> {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  let uploadedAcrossFiles = 0;
  const results: UploadResult[] = [];

  for (const file of files) {
    let fileUploaded = 0;
    const result = await uploadFileMultipart(file, {
      onProgress: (uploadedBytes, fileTotal) => {
        const safeUploaded = Math.min(uploadedBytes, fileTotal);
        const delta = Math.max(0, safeUploaded - fileUploaded);
        fileUploaded = safeUploaded;
        uploadedAcrossFiles += delta;
        options.onProgress?.(uploadedAcrossFiles, totalBytes);
      },
    });
    results.push(result);
  }
  options.onProgress?.(totalBytes, totalBytes);
  return results;
}

/** Tiered staging: ≤20MB browser-only; (20MB, 35MB] presigned PUT; (35MB, cap] multipart. */
export async function stageFilesForToolProcessing(files: File[], options: UploadOptions = {}): Promise<string[]> {
  const { maxBytes: maxUploadBytes, isPremium } = await resolveClientUploadPolicy(options.maxUploadBytes);
  const exceedsMessage = sizeExceedsUploadMessage(isPremium);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  let uploadedAcrossFiles = 0;
  const onProgress = options.onProgress ?? (() => undefined);
  const keys: string[] = [];

  if (isPrivacyFirstMode()) {
    for (const file of files) {
      if (file.size > maxUploadBytes) throw new Error(exceedsMessage);
      uploadedAcrossFiles += file.size;
    }
    onProgress(totalBytes, totalBytes);
    return keys;
  }

  for (const file of files) {
    if (file.size > maxUploadBytes) {
      throw new Error(exceedsMessage);
    }
    if (file.size <= TIER_CLIENT_MAX) {
      uploadedAcrossFiles += file.size;
      onProgress(uploadedAcrossFiles, totalBytes);
      continue;
    }

    let fileUploaded = 0;
    if (file.size <= TIER_PRESIGNED_PUT_MAX) {
      const result = await uploadFilePresignedPut(file, {
        onProgress: (uploadedBytes, fileTotal) => {
          const safeUploaded = Math.min(uploadedBytes, fileTotal);
          const delta = Math.max(0, safeUploaded - fileUploaded);
          fileUploaded = safeUploaded;
          uploadedAcrossFiles += delta;
          onProgress(uploadedAcrossFiles, totalBytes);
        },
      });
      keys.push(result.key);
    } else {
      const result = await uploadFileMultipart(file, {
        onProgress: (uploadedBytes, fileTotal) => {
          const safeUploaded = Math.min(uploadedBytes, fileTotal);
          const delta = Math.max(0, safeUploaded - fileUploaded);
          fileUploaded = safeUploaded;
          uploadedAcrossFiles += delta;
          onProgress(uploadedAcrossFiles, totalBytes);
        },
      });
      keys.push(result.key);
    }
  }
  onProgress(totalBytes, totalBytes);
  if (keys.length) registerStagedKeys(keys);
  return keys;
}

