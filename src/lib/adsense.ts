import {
  hasAdvertisingConsent,
  readAdsConsentAccepted,
  subscribeConsent,
} from "@/lib/consent";

export type AdsenseSlotKind = "top_banner" | "sidebar" | "bottom_banner" | "in_article";

const FALLBACK_SLOT_IDS: Record<AdsenseSlotKind, string> = {
  top_banner: "1234567890",
  sidebar: "0987654321",
  bottom_banner: "1122334455",
  in_article: "5544332211",
};

export const AD_FORMATS: Record<AdsenseSlotKind, string> = {
  top_banner: "horizontal",
  sidebar: "rectangle",
  bottom_banner: "horizontal",
  in_article: "fluid",
};

export { readAdsConsentAccepted, hasAdvertisingConsent };

/** Subscribe to consent changes (same-tab updates + other tabs). */
export function subscribeAdsConsent(listener: () => void): () => void {
  return subscribeConsent(listener);
}

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env[key]) {
    return process.env[key];
  }
  try {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
  } catch {
    return undefined;
  }
}

/** AdSense runs only when this env var is set (trimmed, non-empty). */
export function getAdsenseClientId(): string | undefined {
  const raw =
    readEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID") ??
    readEnv("VITE_ADSENSE_CLIENT_ID") ??
    undefined;
  if (typeof raw !== "string") return undefined;
  const id = raw.trim();
  return id.length > 0 ? id : undefined;
}

/** AdSense display off (verification can use env + meta only). */
export function isAdsenseEnabled(): boolean {
  return false;
}

export function getAdsenseSlotId(kind: AdsenseSlotKind): string {
  const envKey: Record<AdsenseSlotKind, string | undefined> = {
    top_banner: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_TOP") ?? readEnv("VITE_ADSENSE_SLOT_TOP"),
    sidebar: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR") ?? readEnv("VITE_ADSENSE_SLOT_SIDEBAR"),
    bottom_banner: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM") ?? readEnv("VITE_ADSENSE_SLOT_BOTTOM"),
    in_article: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE") ?? readEnv("VITE_ADSENSE_SLOT_IN_ARTICLE"),
  };
  const v = envKey[kind];
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return FALLBACK_SLOT_IDS[kind];
}

export function ensureAdsenseScript(_clientId: string): void {
  /* no-op — ads disabled */
}

export function pushAdsensePlacement(): void {
  /* no-op — ads disabled */
}
