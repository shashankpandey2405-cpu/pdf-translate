"use client";

import { GraduationCap, Scale, Briefcase, Code2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const USE_CASES = [
  {
    key: "students",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    title: "Students & Academics",
    desc: "Summarize research papers, generate study questions, compress assignments, and OCR scan handwritten notes.",
    tools: ["AI Summarize", "Question Generator", "Compress PDF", "OCR Scan"],
  },
  {
    key: "legal",
    icon: Scale,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    title: "Legal Professionals",
    desc: "Flatten forms, sign documents, protect sensitive files, compare contract versions, and ensure PDF/A compliance.",
    tools: ["Sign PDF", "Protect PDF", "Compare PDF", "PDF/A Convert"],
  },
  {
    key: "business",
    icon: Briefcase,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    title: "Business & Enterprise",
    desc: "Compress files for email, convert formats, merge reports, add watermarks, and translate documents across teams.",
    tools: ["Compress PDF", "PDF to Word", "Merge PDF", "Translate PDF"],
  },
  {
    key: "developers",
    icon: Code2,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    title: "Developers & IT",
    desc: "Batch convert to PDF/A for archival, OCR scanned legacy docs, split large PDFs, and automate document workflows.",
    tools: ["PDF/A Convert", "OCR PDF", "Split PDF", "Batch Processing"],
  },
];

export function HomeUseCases() {
  const { t } = useTranslation();

  return (
    <SaasSection id="use-cases">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
          Built for Everyone
        </span>
        <h2 className="saas-heading mt-4">
          {t("home.useCases.title", { defaultValue: "PDF Workflows for Every Role" })}
        </h2>
        <p className="saas-subheading mx-auto">
          {t("home.useCases.subtitle", {
            defaultValue: "Whether you're a student, lawyer, business professional, or developer — we have the right tools.",
          })}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map(({ key, icon: Icon, color, bg, title, desc, tools }) => (
          <div
            key={key}
            className={`group rounded-2xl border border-border ${bg} p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform group-hover:scale-110`}>
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-base font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tools.map((tool) => (
                <span key={tool} className="rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/all-tools"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-bold text-foreground transition-colors hover:bg-muted press-scale"
        >
          See All Tools for Your Workflow
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </SaasSection>
  );
}
