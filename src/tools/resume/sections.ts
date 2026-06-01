import type { ResumeData, ResumeSectionId } from "./types";
import { isSectionVisible } from "./types";

export type ResumeSectionMeta = {
  id: ResumeSectionId;
  labelKey: string;
  defaultVisible: boolean;
};

export const RESUME_SECTIONS: ResumeSectionMeta[] = [
  { id: "header", labelKey: "resumeStudio.sections.header", defaultVisible: true },
  { id: "summary", labelKey: "resumeStudio.sections.summary", defaultVisible: true },
  { id: "contact", labelKey: "resumeStudio.sections.contact", defaultVisible: true },
  { id: "experience", labelKey: "resumeStudio.sections.experience", defaultVisible: true },
  { id: "education", labelKey: "resumeStudio.sections.education", defaultVisible: true },
  { id: "skills", labelKey: "resumeStudio.sections.skills", defaultVisible: true },
  { id: "projects", labelKey: "resumeStudio.sections.projects", defaultVisible: true },
  { id: "languages", labelKey: "resumeStudio.sections.languages", defaultVisible: false },
  { id: "certifications", labelKey: "resumeStudio.sections.certifications", defaultVisible: false },
  { id: "awards", labelKey: "resumeStudio.sections.awards", defaultVisible: false },
  { id: "references", labelKey: "resumeStudio.sections.references", defaultVisible: false },
  { id: "hobbies", labelKey: "resumeStudio.sections.hobbies", defaultVisible: false },
  { id: "social", labelKey: "resumeStudio.sections.social", defaultVisible: true },
];

export function visibleSectionOrder(data: ResumeData): ResumeSectionId[] {
  return data.sectionOrder.filter((id) => isSectionVisible(data, id));
}

export function sectionCompletion(data: ResumeData, id: ResumeSectionId): "empty" | "partial" | "done" {
  switch (id) {
    case "header":
      return data.personal.fullName.trim() ? (data.personal.jobTitle.trim() ? "done" : "partial") : "empty";
    case "summary":
      return data.personal.summary.trim() ? "done" : "empty";
    case "contact":
      return data.personal.email.trim() || data.personal.phone.trim() ? "done" : "empty";
    case "experience":
      return data.internships.some((e) => e.title.trim()) ? "done" : "empty";
    case "education":
      return data.education.some((e) => e.title.trim()) ? "done" : "empty";
    case "skills":
      return data.skills.length > 0 ? "done" : "empty";
    case "projects":
      return data.projects.some((p) => p.name.trim()) ? "done" : "empty";
    case "languages":
      return data.languages.some((e) => e.title.trim()) ? "done" : "empty";
    case "certifications":
      return data.certifications.some((e) => e.title.trim()) ? "done" : "empty";
    case "awards":
      return data.awards.trim() ? "done" : "empty";
    case "references":
      return data.references.some((e) => e.title.trim()) ? "done" : "empty";
    case "hobbies":
      return data.hobbies.length > 0 ? "done" : "empty";
    case "social":
      return data.social.github.trim() || data.social.linkedin.trim() || data.social.portfolio.trim()
        ? "done"
        : "empty";
    default:
      return "empty";
  }
}
