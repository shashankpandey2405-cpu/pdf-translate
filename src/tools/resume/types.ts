export type ResumeTemplateId =
  | "modern-executive"
  | "classic-academic"
  | "creative-portfolio"
  | "minimalist-zen"
  | "tech-innovator"
  | "dubai-corporate"
  | "ats-friendly"
  | "standard-professional"
  | "entrepreneur"
  | "hybrid-flex"
  | "government-formal"
  | "international-eu"
  | "international-us";

export type ResumeSectionId =
  | "header"
  | "summary"
  | "contact"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "projects"
  | "awards"
  | "internships"
  | "references"
  | "hobbies"
  | "social";

export type ResumeAccentColor = "slate" | "navy" | "emerald" | "burgundy";
export type ResumeFontFamily = "inter" | "georgia" | "system-serif";
export type PhotoShape = "circle" | "square" | "rounded";

export type ResumeEntry = {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  end: string;
  details: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  link: string;
  tech: string;
  description: string;
};

export type ResumeDesign = {
  accentColor: ResumeAccentColor;
  fontFamily: ResumeFontFamily;
  photoShape: PhotoShape;
};

export type ResumeData = {
  templateId: ResumeTemplateId;
  profilePhoto: string | null;
  personal: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    website: string;
    summary: string;
  };
  education: ResumeEntry[];
  internships: ResumeEntry[];
  projects: ResumeProject[];
  skills: string[];
  languages: ResumeEntry[];
  certifications: ResumeEntry[];
  references: ResumeEntry[];
  hobbies: string[];
  social: {
    github: string;
    linkedin: string;
    portfolio: string;
  };
  awards: string;
  additionalInfo: string;
  sectionOrder: ResumeSectionId[];
  sectionVisibility: Partial<Record<ResumeSectionId, boolean>>;
  design: ResumeDesign;
};

export const RESUME_STORAGE_KEY = "pdftrusted-student-resume-v3";

export const DEFAULT_SECTION_ORDER: ResumeSectionId[] = [
  "header",
  "summary",
  "contact",
  "experience",
  "education",
  "skills",
  "projects",
  "languages",
  "certifications",
  "awards",
  "references",
  "hobbies",
  "social",
];

const LEGACY_TEMPLATE_MAP: Record<string, ResumeTemplateId> = {
  classic: "ats-friendly",
  modern: "modern-executive",
  minimal: "minimalist-zen",
};

export function emptyResume(): ResumeData {
  return {
    templateId: "ats-friendly",
    profilePhoto: null,
    personal: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      city: "",
      address: "",
      website: "",
      summary: "",
    },
    education: [],
    internships: [],
    projects: [],
    skills: [],
    languages: [],
    certifications: [],
    references: [],
    hobbies: [],
    social: { github: "", linkedin: "", portfolio: "" },
    awards: "",
    additionalInfo: "",
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sectionVisibility: {},
    design: {
      accentColor: "slate",
      fontFamily: "inter",
      photoShape: "rounded",
    },
  };
}

export function normalizeResume(parsed: Partial<ResumeData>): ResumeData {
  const base = emptyResume();
  const tid = parsed.templateId
    ? LEGACY_TEMPLATE_MAP[parsed.templateId as string] ?? (parsed.templateId as ResumeTemplateId)
    : base.templateId;

  const sectionOrder =
    parsed.sectionOrder && parsed.sectionOrder.length > 0
      ? [...parsed.sectionOrder]
      : base.sectionOrder;

  for (const id of DEFAULT_SECTION_ORDER) {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  }

  return {
    ...base,
    ...parsed,
    templateId: tid,
    profilePhoto: parsed.profilePhoto ?? null,
    personal: { ...base.personal, ...parsed.personal },
    social: { ...base.social, ...parsed.social },
    education: parsed.education ?? [],
    internships: parsed.internships ?? [],
    projects: parsed.projects ?? [],
    skills: parsed.skills ?? [],
    languages: parsed.languages ?? [],
    certifications: parsed.certifications ?? [],
    references: parsed.references ?? [],
    hobbies: parsed.hobbies ?? [],
    awards: parsed.awards ?? "",
    additionalInfo: parsed.additionalInfo ?? "",
    sectionOrder,
    sectionVisibility: parsed.sectionVisibility ?? {},
    design: { ...base.design, ...parsed.design },
  };
}

export function isSectionVisible(data: ResumeData, id: ResumeSectionId): boolean {
  return data.sectionVisibility[id] !== false;
}

/** @deprecated Use RESUME_TEMPLATES from templates.ts */
export const RESUME_TEMPLATE_OPTIONS: { id: ResumeTemplateId; label: string; desc: string }[] = [];
