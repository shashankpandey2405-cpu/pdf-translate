import type { ResumeTemplateId } from "./types";

export type TemplateCategory =
  | "corporate"
  | "government"
  | "minimal"
  | "creative"
  | "fresher"
  | "executive"
  | "international";

export type ResumeRegion = "US" | "EU" | "UK" | "GCC";

export type ResumeTemplateMeta = {
  id: ResumeTemplateId;
  labelKey: string;
  descKey: string;
  category: TemplateCategory;
  supportsPhoto: boolean;
  region?: ResumeRegion;
  tags: string[];
};

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; labelKey: string }[] = [
  { id: "corporate", labelKey: "resumeStudio.categories.corporate" },
  { id: "government", labelKey: "resumeStudio.categories.government" },
  { id: "minimal", labelKey: "resumeStudio.categories.minimal" },
  { id: "creative", labelKey: "resumeStudio.categories.creative" },
  { id: "fresher", labelKey: "resumeStudio.categories.fresher" },
  { id: "executive", labelKey: "resumeStudio.categories.executive" },
  { id: "international", labelKey: "resumeStudio.categories.international" },
];

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "modern-executive",
    labelKey: "resumeStudio.templates.modernExecutive.label",
    descKey: "resumeStudio.templates.modernExecutive.desc",
    category: "executive",
    supportsPhoto: true,
    tags: ["Executive", "Photo"],
  },
  {
    id: "dubai-corporate",
    labelKey: "resumeStudio.templates.dubaiCorporate.label",
    descKey: "resumeStudio.templates.dubaiCorporate.desc",
    category: "international",
    supportsPhoto: true,
    region: "GCC",
    tags: ["GCC", "Corporate"],
  },
  {
    id: "ats-friendly",
    labelKey: "resumeStudio.templates.atsFriendly.label",
    descKey: "resumeStudio.templates.atsFriendly.desc",
    category: "corporate",
    supportsPhoto: true,
    tags: ["ATS"],
  },
  {
    id: "standard-professional",
    labelKey: "resumeStudio.templates.standardProfessional.label",
    descKey: "resumeStudio.templates.standardProfessional.desc",
    category: "corporate",
    supportsPhoto: true,
    tags: ["Two-column"],
  },
  {
    id: "classic-academic",
    labelKey: "resumeStudio.templates.classicAcademic.label",
    descKey: "resumeStudio.templates.classicAcademic.desc",
    category: "fresher",
    supportsPhoto: false,
    tags: ["Education"],
  },
  {
    id: "minimalist-zen",
    labelKey: "resumeStudio.templates.minimalistZen.label",
    descKey: "resumeStudio.templates.minimalistZen.desc",
    category: "minimal",
    supportsPhoto: false,
    tags: ["Minimal"],
  },
  {
    id: "creative-portfolio",
    labelKey: "resumeStudio.templates.creativePortfolio.label",
    descKey: "resumeStudio.templates.creativePortfolio.desc",
    category: "creative",
    supportsPhoto: true,
    tags: ["Creative"],
  },
  {
    id: "tech-innovator",
    labelKey: "resumeStudio.templates.techInnovator.label",
    descKey: "resumeStudio.templates.techInnovator.desc",
    category: "creative",
    supportsPhoto: true,
    tags: ["Developer"],
  },
  {
    id: "government-formal",
    labelKey: "resumeStudio.templates.governmentFormal.label",
    descKey: "resumeStudio.templates.governmentFormal.desc",
    category: "government",
    supportsPhoto: true,
    tags: ["Formal", "Government"],
  },
  {
    id: "international-eu",
    labelKey: "resumeStudio.templates.internationalEu.label",
    descKey: "resumeStudio.templates.internationalEu.desc",
    category: "international",
    supportsPhoto: true,
    region: "EU",
    tags: ["EU", "Photo"],
  },
  {
    id: "international-us",
    labelKey: "resumeStudio.templates.internationalUs.label",
    descKey: "resumeStudio.templates.internationalUs.desc",
    category: "international",
    supportsPhoto: false,
    region: "US",
    tags: ["US", "ATS"],
  },
  {
    id: "entrepreneur",
    labelKey: "resumeStudio.templates.entrepreneur.label",
    descKey: "resumeStudio.templates.entrepreneur.desc",
    category: "executive",
    supportsPhoto: false,
    tags: ["Bold"],
  },
  {
    id: "hybrid-flex",
    labelKey: "resumeStudio.templates.hybridFlex.label",
    descKey: "resumeStudio.templates.hybridFlex.desc",
    category: "corporate",
    supportsPhoto: true,
    tags: ["Flexible"],
  },
];

export function getTemplateMeta(id: ResumeTemplateId): ResumeTemplateMeta | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}

export function templatesByCategory(category: TemplateCategory | "all"): ResumeTemplateMeta[] {
  if (category === "all") return RESUME_TEMPLATES;
  return RESUME_TEMPLATES.filter((t) => t.category === category);
}

export const ONBOARDING_TEMPLATE_MAP: Record<string, ResumeTemplateId> = {
  student: "classic-academic",
  fresher: "ats-friendly",
  professional: "standard-professional",
  executive: "modern-executive",
  photo: "modern-executive",
  noPhoto: "ats-friendly",
  government: "government-formal",
  international: "international-eu",
};
