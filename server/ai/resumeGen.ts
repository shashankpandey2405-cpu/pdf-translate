import type { ResumeData, ResumeEntry, ResumeTemplateId } from "@/tools/resume/types";
import { emptyResume, DEFAULT_SECTION_ORDER } from "@/tools/resume/types";
import { safeId } from "@/lib/safeId";

export type AiResumeIntake = {
  jobField: string;
  includePhoto: boolean;
  fullName: string;
  skills: string;
  experience: string;
  education: string;
  about: string;
  templateId: ResumeTemplateId;
};

export type AiResumePayload = {
  personal: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    city: string;
    summary: string;
  };
  skills: string[];
  experience: Array<{
    title: string;
    subtitle: string;
    start: string;
    end: string;
    details: string;
  }>;
  education: Array<{
    title: string;
    subtitle: string;
    start: string;
    end: string;
    details: string;
  }>;
  projects?: Array<{
    name: string;
    tech: string;
    description: string;
  }>;
};

export function resumeGenGuardrails(intake: AiResumeIntake): string {
  return `
You are PDFTrusted's professional resume writer. Create ATS-friendly resume content from the user's inputs only.

RULES:
1. Use ONLY information provided below — do not invent employers, degrees, or contact details.
2. Professional tone, active voice, concise bullets where appropriate.
3. Target role / field: ${intake.jobField || "General professional"}.
4. If a field is empty, omit or use a brief neutral placeholder — never fabricate credentials.
5. jobTitle in personal should align with the target field.
6. Split skills into a JSON array of individual skill strings (max 18).
7. experience and education entries need title, subtitle, start, end (years or "Present"), details (bullet text, use \\n for multiple bullets).
8. Do not include markdown fences or commentary.

Return ONLY valid JSON:
{
  "personal": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "city": "", "summary": "" },
  "skills": ["skill1"],
  "experience": [{ "title": "", "subtitle": "", "start": "", "end": "", "details": "" }],
  "education": [{ "title": "", "subtitle": "", "start": "", "end": "", "details": "" }],
  "projects": [{ "name": "", "tech": "", "description": "" }]
}

USER INPUT:
Name: ${intake.fullName}
Target field: ${intake.jobField}
Skills (raw): ${intake.skills}
Experience (raw): ${intake.experience}
Education (raw): ${intake.education}
About: ${intake.about}
`.trim();
}

function toEntry(raw: {
  title?: string;
  subtitle?: string;
  start?: string;
  end?: string;
  details?: string;
}): ResumeEntry {
  return {
    id: safeId(),
    title: String(raw.title ?? "").trim(),
    subtitle: String(raw.subtitle ?? "").trim(),
    start: String(raw.start ?? "").trim(),
    end: String(raw.end ?? "").trim(),
    details: String(raw.details ?? "").trim(),
  };
}

export function mergeAiPayloadIntoResume(
  intake: AiResumeIntake,
  payload: AiResumePayload,
  photoDataUrl: string | null,
): ResumeData {
  const base = emptyResume();
  base.templateId = intake.templateId;
  base.profilePhoto = intake.includePhoto ? photoDataUrl : null;
  base.personal.fullName = payload.personal.fullName?.trim() || intake.fullName.trim() || base.personal.fullName;
  base.personal.jobTitle = payload.personal.jobTitle?.trim() || intake.jobField.trim() || base.personal.jobTitle;
  base.personal.email = payload.personal.email?.trim() || base.personal.email;
  base.personal.phone = payload.personal.phone?.trim() || base.personal.phone;
  base.personal.city = payload.personal.city?.trim() || base.personal.city;
  base.personal.summary =
    payload.personal.summary?.trim() ||
    intake.about.trim() ||
    base.personal.summary;

  base.skills = Array.isArray(payload.skills)
    ? payload.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 24)
    : intake.skills
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 24);

  base.internships = (payload.experience ?? [])
    .map(toEntry)
    .filter((e) => e.title || e.details);
  base.education = (payload.education ?? []).map(toEntry).filter((e) => e.title || e.details);

  base.projects = (payload.projects ?? [])
    .map((p) => ({
      id: safeId(),
      name: String(p.name ?? "").trim(),
      link: "",
      tech: String(p.tech ?? "").trim(),
      description: String(p.description ?? "").trim(),
    }))
    .filter((p) => p.name || p.description);

  base.sectionOrder = [...DEFAULT_SECTION_ORDER];
  base.sectionVisibility = {
    header: true,
    summary: Boolean(base.personal.summary),
    contact: true,
    experience: base.internships.length > 0,
    education: base.education.length > 0,
    skills: base.skills.length > 0,
    projects: base.projects.length > 0,
  };

  if (intake.templateId === "ats-friendly" || intake.templateId === "standard-professional") {
    base.design.fontFamily = "inter";
    base.design.accentColor = "navy";
  }

  return base;
}

export function parseResumeGenResponse(raw: string): AiResumePayload | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as AiResumePayload;
    if (!parsed.personal || typeof parsed.personal !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
