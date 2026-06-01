import { usePwaInstallContext } from "@/context/PwaInstallContext";

/** Chromium deferred install prompt (not typed in lib.dom). */
export type BeforeInstallPromptEventInner = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** @deprecated Use usePwaInstallContext directly when inside PwaInstallProvider. */
export function usePwaInstall() {
  return usePwaInstallContext();
}
