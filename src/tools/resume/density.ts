import type { ResumeData } from "./types";

/** Slightly tighten typography when the résumé has lots of entries. */
export function resumeDensityClass(data: ResumeData): string {
  const blocks =
    data.education.length +
    data.internships.length +
    data.projects.length +
    data.languages.length +
    data.certifications.length +
    (data.skills.length > 8 ? 2 : 0) +
    (data.awards.trim() ? 1 : 0) +
    (data.additionalInfo.trim() ? 1 : 0);
  if (blocks >= 10) return "text-[9.5px] leading-snug";
  if (blocks >= 6) return "text-[10px] leading-normal";
  return "text-[11px] leading-relaxed";
}
