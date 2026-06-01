import { emptyResume, normalizeResume, RESUME_STORAGE_KEY, type ResumeData } from "./types";
import { safeId } from "@/lib/safeId";

const LEGACY_V1_KEY = "pdftrusted-student-resume-v1";
const LEGACY_V2_KEY = "pdftrusted-student-resume-v2";

export function loadResume(): ResumeData {
  if (typeof window === "undefined") return emptyResume();
  try {
    let raw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_V2_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_V1_KEY);
    if (!raw) return emptyResume();
    const data = normalizeResume(JSON.parse(raw) as Partial<ResumeData>);
    return data;
  } catch {
    return emptyResume();
  }
}

export function saveResume(data: ResumeData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function newEntryId(): string {
  return safeId("re");
}
