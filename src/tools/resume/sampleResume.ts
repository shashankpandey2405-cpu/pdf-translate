import type { ResumeData } from "./types";

/** Rich sample data for template gallery thumbnails. */
export function sampleResumeForTemplate(templateId: ResumeData["templateId"]): ResumeData {
  return {
    templateId,
    profilePhoto: null,
    personal: {
      fullName: "Alexandra Chen",
      jobTitle: "Senior Product Manager",
      email: "alex.chen@email.com",
      phone: "+1 (555) 234-5678",
      city: "San Francisco, CA",
      address: "123 Market Street",
      website: "alexchen.dev",
      summary:
        "Results-driven product leader with 8+ years building B2B SaaS. Expert in roadmap strategy, cross-functional leadership, and data-informed decisions.",
    },
    education: [
      {
        id: "e1",
        title: "Stanford University",
        subtitle: "MBA, Technology Management",
        start: "2014",
        end: "2016",
        details: "",
      },
    ],
    internships: [
      {
        id: "i1",
        title: "Senior Product Manager",
        subtitle: "TechCorp Inc.",
        start: "2020",
        end: "Present",
        details: "Led 0→1 launch of analytics suite\nGrew ARR 40% YoY",
      },
    ],
    projects: [
      {
        id: "p1",
        name: "Open Metrics Dashboard",
        link: "github.com/achen/metrics",
        tech: "React, Node.js",
        description: "Open-source analytics toolkit adopted by 2k+ teams.",
      },
    ],
    skills: ["Product Strategy", "Agile", "SQL", "Figma", "Roadmapping"],
    languages: [{ id: "l1", title: "English", subtitle: "Native", start: "", end: "", details: "" }],
    certifications: [],
    references: [],
    hobbies: ["Running", "Photography"],
    social: {
      github: "github.com/achen",
      linkedin: "linkedin.com/in/achen",
      portfolio: "alexchen.dev",
    },
    awards: "Product Leader of the Year 2024",
    additionalInfo: "",
    sectionOrder: [
      "header",
      "summary",
      "contact",
      "experience",
      "education",
      "skills",
      "projects",
      "awards",
      "social",
    ],
    sectionVisibility: {},
    design: { accentColor: "navy", fontFamily: "inter", photoShape: "rounded" },
  };
}
