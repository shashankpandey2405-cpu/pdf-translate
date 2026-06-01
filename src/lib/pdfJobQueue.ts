/**
 * Serializes PDF worker jobs to avoid overload on weak devices.
 */

type Job<T> = {
  run: (signal: AbortSignal) => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  signal: AbortSignal;
};

const queue: Job<unknown>[] = [];
let running = false;
let paused = false;
let globalAbort: AbortController | null = null;

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    paused = document.visibilityState === "hidden";
    if (!paused) drain();
  });
}

function drain(): void {
  if (running || paused || queue.length === 0) return;
  const job = queue.shift()!;
  if (job.signal.aborted) {
    job.reject(new DOMException("Aborted", "AbortError"));
    drain();
    return;
  }
  running = true;
  void job
    .run(job.signal)
    .then((v) => job.resolve(v))
    .catch((e) => job.reject(e))
    .finally(() => {
      running = false;
      drain();
    });
}

export function enqueuePdfJob<T>(run: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
  const parent = signal;
  const ac = new AbortController();
  if (parent) {
    if (parent.aborted) {
      ac.abort(parent.reason);
    } else {
      parent.addEventListener("abort", () => ac.abort(parent.reason), { once: true });
    }
  }

  return new Promise<T>((resolve, reject) => {
    queue.push({
      run: run as (s: AbortSignal) => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
      signal: ac.signal,
    });
    drain();
  });
}

/** Call on route unmount to cancel pending jobs. */
export function abortPdfJobQueue(): void {
  globalAbort?.abort();
  globalAbort = new AbortController();
  while (queue.length > 0) {
    const j = queue.shift()!;
    j.reject(new DOMException("Aborted", "AbortError"));
  }
  running = false;
}
