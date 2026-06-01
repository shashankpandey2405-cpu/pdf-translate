"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEnhancedResultBlob } from "@/lib/enhanced/fetchResultBlob";
import { purgeEnhancedOutput } from "@/lib/enhanced/purgeEnhancedOutput";
import type { EnhancedJobRunResult } from "@/lib/enhanced/types";
import { CLOUD_OUTPUT_TTL_SEC } from "@/lib/history/constants";
import { saveLocalHistoryEntry, loadLocalHistoryBlob } from "@/lib/history/localHistory";

type Args = {
  toolSlug: string;
  toolName: string;
};

export function useEnhancedResultLifecycle({ toolSlug, toolName }: Args) {
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);
  const [localEntryId, setLocalEntryId] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(CLOUD_OUTPUT_TTL_SEC);
  const [cloudExpired, setCloudExpired] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const purgeMetaRef = useRef<{ jobId: string; inputR2Key?: string; outputR2Key?: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const purgedRef = useRef(false);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setObjectUrl(null);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    purgedRef.current = false;
    purgeMetaRef.current = null;
    revokeObjectUrl();
    setLocalBlob(null);
    setLocalEntryId(null);
    setActiveJobId(null);
    setSecondsLeft(CLOUD_OUTPUT_TTL_SEC);
    setCloudExpired(false);
    setPersisting(false);
  }, [revokeObjectUrl]);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(CLOUD_OUTPUT_TTL_SEC);
    setCloudExpired(false);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const persistFromCloudResult = useCallback(
    async (cloud: EnhancedJobRunResult) => {
      setPersisting(true);
      try {
        const blob = await fetchEnhancedResultBlob(cloud.downloadUrl, { jobId: cloud.jobId });
        const entry = await saveLocalHistoryEntry({
          jobId: cloud.jobId,
          toolSlug,
          toolName,
          fileName: cloud.filename,
          blob,
          inputR2Key: cloud.inputR2Key,
          outputR2Key: cloud.outputR2Key,
        });
        purgeMetaRef.current = {
          jobId: cloud.jobId,
          inputR2Key: cloud.inputR2Key,
          outputR2Key: cloud.outputR2Key,
        };
        setActiveJobId(cloud.jobId);
        setLocalBlob(blob);
        setLocalEntryId(entry?.id ?? null);
        revokeObjectUrl();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setObjectUrl(url);
        startCountdown();
        return { blob, entryId: entry?.id ?? null };
      } finally {
        setPersisting(false);
      }
    },
    [toolSlug, toolName, revokeObjectUrl, startCountdown],
  );

  const ensureLocalBlob = useCallback(async (): Promise<Blob | null> => {
    if (localBlob) return localBlob;
    if (!localEntryId) return null;
    const blob = await loadLocalHistoryBlob(localEntryId);
    if (blob) {
      setLocalBlob(blob);
      if (!objectUrlRef.current) {
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setObjectUrl(url);
      }
    }
    return blob;
  }, [localBlob, localEntryId]);

  useEffect(() => {
    if (secondsLeft > 0 || purgedRef.current) return;
    setCloudExpired(true);
    const meta = purgeMetaRef.current;
    if (meta && !purgedRef.current) {
      purgedRef.current = true;
      void purgeEnhancedOutput(meta);
    }
  }, [secondsLeft]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return {
    localBlob,
    localEntryId,
    objectUrl,
    secondsLeft,
    cloudExpired,
    persisting,
    jobId: activeJobId,
    persistFromCloudResult,
    ensureLocalBlob,
    reset,
  };
}
