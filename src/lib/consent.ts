/**
 * GDPR/CCPA-oriented consent storage. Essential cookies always implied for site function.
 */
export type ConsentCategory = "essential" | "analytics" | "advertising" | "preferences";

export type ConsentState = {
  version: 1;
  essential: true;
  analytics: boolean;
  advertising: boolean;
  preferences: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "pdftrusted:consent-v1";
const LEGACY_ADS_KEY = "pdftrusted:ads-consent";
const CHANGE_EVENT = "pdftrusted:consent-changed";

const DEFAULT_STATE: ConsentState = {
  version: 1,
  essential: true,
  analytics: false,
  advertising: false,
  preferences: false,
  updatedAt: "",
};

function nowIso(): string {
  return new Date().toISOString();
}

function migrateLegacy(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const legacy = window.localStorage.getItem(LEGACY_ADS_KEY);
    if (legacy === "accepted") {
      return {
        version: 1,
        essential: true,
        analytics: true,
        advertising: true,
        preferences: true,
        updatedAt: nowIso(),
      };
    }
    if (legacy === "essential") {
      return { ...DEFAULT_STATE, updatedAt: nowIso() };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function readConsentState(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migrated = migrateLegacy();
      if (migrated) {
        writeConsentState(migrated);
        return migrated;
      }
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== 1) return null;
    return {
      version: 1,
      essential: true,
      analytics: Boolean(parsed.analytics),
      advertising: Boolean(parsed.advertising),
      preferences: Boolean(parsed.preferences),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function writeConsentState(state: ConsentState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, essential: true, updatedAt: nowIso() }),
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* private mode */
  }
}

export function hasConsentChoice(): boolean {
  return readConsentState() !== null;
}

export function hasAdvertisingConsent(): boolean {
  return readConsentState()?.advertising === true;
}

export function hasAnalyticsConsent(): boolean {
  return readConsentState()?.analytics === true;
}

/** @deprecated Use hasAdvertisingConsent — kept for adsense.ts compatibility */
export function readAdsConsentAccepted(): boolean {
  return hasAdvertisingConsent();
}

export function acceptAllConsent(): ConsentState {
  const state: ConsentState = {
    version: 1,
    essential: true,
    analytics: true,
    advertising: true,
    preferences: true,
    updatedAt: nowIso(),
  };
  writeConsentState(state);
  return state;
}

export function rejectNonEssentialConsent(): ConsentState {
  const state: ConsentState = { ...DEFAULT_STATE, updatedAt: nowIso() };
  writeConsentState(state);
  return state;
}

export function saveCustomConsent(partial: Pick<ConsentState, "analytics" | "advertising" | "preferences">): ConsentState {
  const state: ConsentState = {
    version: 1,
    essential: true,
    analytics: partial.analytics,
    advertising: partial.advertising,
    preferences: partial.preferences,
    updatedAt: nowIso(),
  };
  writeConsentState(state);
  return state;
}

export function subscribeConsent(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onCustom = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === LEGACY_ADS_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, onCustom);
  window.addEventListener("pdftrusted:ads-consent-changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom);
    window.removeEventListener("pdftrusted:ads-consent-changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

/** CCPA-style signal: user in US-like locale/timezone (heuristic only). */
export function isLikelyCcpaRegion(): boolean {
  if (typeof navigator === "undefined") return false;
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.endsWith("-us") || lang === "en-us") return true;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.startsWith("America/");
  } catch {
    return false;
  }
}
