import type { ResumeData } from "./types";

/** True when the resume has user-entered content worth guarding on navigation. */
export function isResumeDirty(data: ResumeData): boolean {
  const p = data.personal;
  if (
    p.fullName.trim() ||
    p.jobTitle.trim() ||
    p.email.trim() ||
    p.phone.trim() ||
    p.summary.trim() ||
    p.city.trim() ||
    p.address.trim() ||
    p.website.trim()
  ) {
    return true;
  }
  if (data.profilePhoto) return true;
  if (data.awards.trim() || data.additionalInfo.trim()) return true;
  return (
    data.education.length > 0 ||
    data.internships.length > 0 ||
    data.projects.length > 0 ||
    data.skills.length > 0 ||
    data.languages.length > 0 ||
    data.certifications.length > 0 ||
    data.references.length > 0 ||
    data.hobbies.length > 0 ||
    Boolean(data.social.github.trim() || data.social.linkedin.trim() || data.social.portfolio.trim())
  );
}
