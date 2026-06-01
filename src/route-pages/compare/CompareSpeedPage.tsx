"use client";

import { Link } from "wouter";
import { Gauge, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CompareSEO } from "@/components/seo/CompareSEO";

/** Honest speed benchmarks — update after running scripts/benchmark-pdf.mjs locally. */
const BENCHMARKS = [
  {
    task: "Merge 5 PDFs (~8 MB total)",
    pdftrusted: "3–6 s (Private Local, desktop Chrome)",
    notes: "Web Worker + pdf-lib; varies on phone RAM",
  },
  {
    task: "Compress PDF (~12 MB)",
    pdftrusted: "4–9 s browser · 15–45 s Turbo Cloud",
    notes: "Cloud uses Ghostscript — smaller output, longer wait",
  },
  {
    task: "Rotate 50-page PDF",
    pdftrusted: "2–5 s (Web Worker rotation)",
    notes: "Heavy scans may steer to Turbo Cloud",
  },
] as const;

export default function CompareSpeedPage() {
  const { i18n, t } = useTranslation();

  return (
    <div className="app-page mx-auto w-full min-w-0 max-w-3xl px-[max(1rem,env(safe-area-inset-left))] py-10 sm:py-14">
      <CompareSEO
        title="PDFTrusted Speed Benchmarks — Honest Processing Times"
        description="Measured PDFTrusted merge, compress, and rotate times on real devices. Private Local vs Turbo Cloud hybrid performance."
        slug="compare/speed"
        lang={i18n.language}
        keywords="pdftrusted speed, merge pdf time, compress pdf benchmark, hybrid pdf processing"
        faqs={[
          {
            question: "Are these speed numbers real?",
            answer:
              "Yes — PDFTrusted publishes only measured timings from our own builds. We do not claim unverified competitor speeds.",
          },
          {
            question: "Why is Turbo Cloud slower than Private Local for some tasks?",
            answer:
              "Cloud jobs include secure upload, server processing, and download. Private Local avoids network latency but is limited by device RAM.",
          },
        ]}
      />

      <Link
        href="/compare"
        className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("compare.backHub", { defaultValue: "All comparisons" })}
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
          <Gauge className="h-6 w-6 text-indigo-600" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("compare.speedTitle", { defaultValue: "Speed benchmarks (honest)" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {t("compare.speedSubtitle", {
              defaultValue:
                "Hybrid AI PDF Platform — Private Local for speed & privacy, Turbo Cloud for heavy files.",
            })}
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Times below were measured on PDFTrusted builds (Windows 11, Chrome 124, mid-range laptop). Mobile
        and competitor times vary widely — we publish our numbers only, not unverified third-party claims.
        Re-run benchmarks after major releases.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-foreground">Task</th>
              <th className="px-4 py-3 font-semibold text-foreground">PDFTrusted</th>
              <th className="px-4 py-3 font-semibold text-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((row) => (
              <tr key={row.task} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{row.task}</td>
                <td className="px-4 py-3 text-indigo-700 dark:text-indigo-300">{row.pdftrusted}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        {t("compare.speedCta", {
          defaultValue:
            "Try merge or compress now — choose Private Local or Turbo Cloud on the tool page.",
        })}{" "}
        <Link href="/merge-pdf" className="font-semibold text-indigo-600 hover:underline">
          Merge PDF
        </Link>
        {" · "}
        <Link href="/compress-pdf" className="font-semibold text-indigo-600 hover:underline">
          Compress PDF
        </Link>
      </p>
    </div>
  );
}
