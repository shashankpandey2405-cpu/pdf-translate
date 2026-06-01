import { TRUST_SHIELD_NOTICE_KEY, TRUST_SHIELD_STORAGE_KEY } from "./constants";

export function isPrivacyFirstMode(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(TRUST_SHIELD_STORAGE_KEY);
    if (v === null) return true;
    return v !== "0";
  } catch {
    return true;
  }
}

export function setPrivacyFirstMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRUST_SHIELD_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export function isPrivacyNoticeSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(TRUST_SHIELD_NOTICE_KEY) === "1";
  } catch {
    return true;
  }
}

export function setPrivacyNoticeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRUST_SHIELD_NOTICE_KEY, "1");
  } catch {
    /* private mode */
  }
}
