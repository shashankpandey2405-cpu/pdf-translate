"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { checkFileSizeForTier } from "@/lib/limits/fileSizePolicy";

export function useFileSizeGate(isPremium: boolean) {
  const [compressOpen, setCompressOpen] = useState(false);
  const [blockedFile, setBlockedFile] = useState<File | null>(null);
  const [blockedSizeMb, setBlockedSizeMb] = useState<number | undefined>();

  const gateFile = useCallback(
    (file: File): boolean => {
      const check = checkFileSizeForTier(file, isPremium);
      if (check.ok) return true;
      setBlockedFile(file);
      setBlockedSizeMb(check.sizeMb);
      setCompressOpen(true);
      toast.error("File is too large", {
        description: isPremium
          ? `Premium limit is ${check.limitMb} MB per file.`
          : `Free limit is ${check.limitMb} MB. Compress the PDF or upgrade to Premium (500 MB).`,
      });
      return false;
    },
    [isPremium],
  );

  return {
    compressOpen,
    setCompressOpen,
    blockedFile,
    blockedSizeMb,
    gateFile,
  };
}
