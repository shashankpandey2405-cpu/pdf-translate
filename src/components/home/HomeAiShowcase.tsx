"use client";

import { Link } from "wouter";
import { ArrowRight, Gauge, MessageSquareText, Languages, ScanEye, Brain, Sparkles, FileQuestion, ScanSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const AI_FEATURES = [
  {
    slug: "compress-pdf",
    icon: Gauge,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    title: "AI Compression Engine",
    desc: "Reduce PDF size by up to 90% without visible quality loss. Our AI analyzes each page element — text, images, vectors — for optimal compression.",
    stat: "90%",
    statLabel: "smaller files",
  },
  {
    slug: "chat-pdf",
    icon: MessageSquareText,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    title: "Chat with Any PDF",
    desc: "Ask questions in natural language and get instant answers from your documents. Powered by GPT-4 and Claude AI models.",
    stat: "GPT-4",
    statLabel: "powered",
  },
  {
    slug: "translate-pdf",
    icon: Languages,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    title: "AI Translation",
    desc: "Translate entire PDFs across 50+ languages while preserving layout, formatting, and structure perfectly.",
    stat: "50+",
    statLabel: "languages",
  },
  {
    slug: "ocr-pdf",
    icon: ScanEye,
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    title: "AI-Powered OCR",
    desc: "Extract text from scanned documents with 99% accuracy. Supports Arabic, Hindi, Chinese, and 50+ scripts.",
    stat: "99%",
    statLabel: "accuracy",
  },
  {
    slug: "ai-summarize",
    icon: Brain,
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    title: "Smart Summarization",
    desc: "Get concise, accurate summaries of lengthy documents in seconds. Ideal for research papers, legal docs, and reports.",
    stat: "10x",
    statLabel: "faster reading",
  },
  {
    slug: "ai-question-gen",
    icon: FileQuestion,
    gradient: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    title: "AI Question Generator",
    desc: "Auto-generate quizzes, study questions, and comprehension tests from any PDF. Perfect for students and educators.",
    stat: "AI",
    statLabel: "generated",
  },
  {
    slug: "smart-scan-ai",
    icon: ScanSearch,
    gradient: "from-cyan-500 to-teal-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    title: "Smart Scan AI",
    desc: "Reconstruct and enhance low-quality scans using multi-model AI processing. Turn blurry photos into clean documents.",
    stat: "HD",
    statLabel: "quality output",
  },
] as const;

export function HomeAiShowcase() {
  const { t } = useTranslation();

  return (
    <SaasSection muted id="ai-showcase">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Google AI, GPT-4 & Claude
        </span>
        <h2 className="saas-heading mt-4">
          {t("home.ai.title", { defaultValue: "AI That Actually Understands Your Documents" })}
        </h2>
        <p className="saas-subheading mx-auto">
          {t("home.ai.subtitle", {
            defaultValue: "Not just processing — real intelligence. Our AI reads, understands, and transforms your PDFs.",
          })}
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AI_FEATURES.slice(0, 3).map(({ slug, icon: Icon, gradient, bg, title, desc, stat, statLabel }) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className={`group relative flex flex-col gap-4 rounded-2xl border border-border ${bg} p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-foreground">{stat}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{statLabel}</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary transition-transform group-hover:translate-x-1">
              Try it free <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AI_FEATURES.slice(3).map(({ slug, icon: Icon, gradient, title, desc, stat, statLabel }) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-black text-foreground">{stat}</span>
                <span className="ml-1 text-[10px] font-semibold text-muted-foreground uppercase">{statLabel}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{desc}</p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
              Try free <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </SaasSection>
  );
}
