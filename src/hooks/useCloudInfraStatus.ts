"use client";

import { useEffect, useState } from "react";

export type CloudInfraStatus = {
  loading: boolean;
  ready: boolean;
  redisReachable: boolean;
  message: string | null;
};

const INITIAL: CloudInfraStatus = {
  loading: true,
  ready: false,
  redisReachable: false,
  message: null,
};

/** Probes /api/enhanced/health — server truth for Redis + R2 + Supabase (no auth required). */
export function useCloudInfraStatus(): CloudInfraStatus {
  const [status, setStatus] = useState<CloudInfraStatus>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8_000);
        const res = await fetch("/api/enhanced/health", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        window.clearTimeout(timeout);
        const data = (await res.json()) as {
          ok?: boolean;
          redisReachable?: boolean;
          message?: string;
          redisError?: string;
        };
        if (cancelled) return;
        const redisReachable = Boolean(data.redisReachable);
        const ready = Boolean(data.ok);
        setStatus({
          loading: false,
          ready,
          redisReachable,
          message:
            typeof data.message === "string"
              ? data.message
              : typeof data.redisError === "string"
                ? data.redisError
                : ready
                  ? "Cloud processing is available."
                  : "Cloud processing is not fully configured on the server.",
        });
      } catch {
        if (!cancelled) {
          setStatus({
            loading: false,
            ready: false,
            redisReachable: false,
            message: "Could not reach the cloud status API.",
          });
        }
      }
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
