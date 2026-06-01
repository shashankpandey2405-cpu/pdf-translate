"use client";

import { Link } from "wouter";
import { Shield, Sparkles, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";
import { ScrollReveal } from "@/components/home/ScrollReveal";

/** ~300 words of unique home-page copy for AdSense / thin-content compliance. */
export function HomeWhyPdfTrusted() {
  const { t } = useTranslation();

  return (
    <SaasSection id="why-pdftrusted" className="py-12 sm:py-20">
      <ScrollReveal>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {t("home.why.eyebrow", { defaultValue: "Why PDFTrusted?" })}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("home.why.title", {
              defaultValue: "The PDF platform built for real work — not just quick conversions",
            })}
          </h2>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              {t("home.why.p1", {
                defaultValue:
                  "PDFTrusted is an AI document intelligence platform that helps millions of users compress, merge, convert, sign, OCR, translate, and summarize PDFs without installing desktop software. Unlike generic file converters, every tool is designed around how people actually handle documents: homework packets, tax forms, contracts, research papers, and client deliverables that must stay private and accurate.",
              })}
            </p>
            <p>
              {t("home.why.p2", {
                defaultValue:
                  "Our hybrid architecture lets you pick Private Local processing when files should never leave your device, or Turbo Cloud when you need Ghostscript compression, OCR, translation, or AI on heavy documents. Encrypted staging auto-expires; signed-in free users get 10 monthly credits for cloud and AI. Premium unlocks 500 MB uploads and expanded credits.",
              })}
            </p>
            <p>
              {t("home.why.p3", {
                defaultValue:
                  "From Chat with PDF and AI Summarize to merge, compress, and e-sign, PDFTrusted replaces a cluttered toolbox with one fast, mobile-ready experience. No account is required to start. Sign in when you want saved credits, cloud history, and subscription benefits — your files, your pace, your privacy.",
              })}
            </p>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: t("home.why.trust1Title", { defaultValue: "Private Local" }),
                desc: t("home.why.trust1Desc", {
                  defaultValue: "Zero-upload browser processing when you choose it",
                }),
              },
              {
                icon: Sparkles,
                title: t("home.why.trust2Title", { defaultValue: "Turbo Cloud + AI" }),
                desc: t("home.why.trust2Desc", {
                  defaultValue: "Heavy files, OCR, translate & summarize on secure workers",
                }),
              },
              {
                icon: Zap,
                title: t("home.why.trust3Title", { defaultValue: "Mobile-ready" }),
                desc: t("home.why.trust3Desc", {
                  defaultValue: "44px tap targets, iPhone downloads, PWA install",
                }),
              },
            ].map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm"
              >
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
                <p className="mt-2 font-bold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/all-tools"
              className="press-scale inline-flex min-h-[44px] items-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors duration-300 ease-out hover:bg-indigo-700"
            >
              {t("home.why.ctaTools", { defaultValue: "Explore all tools" })}
            </Link>
            <Link
              href="/pricing"
              className="press-scale inline-flex min-h-[44px] items-center rounded-2xl border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors duration-300 ease-out hover:bg-muted"
            >
              {t("home.why.ctaPricing", { defaultValue: "View premium plans" })}
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </SaasSection>
  );
}
