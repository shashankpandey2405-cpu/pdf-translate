"use client";

import { CheckCircle2, XCircle, Minus, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveTable } from "@/components/layout/ResponsiveTable";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { SaasSection } from "@/components/saas/SaasSection";

type Status = "yes" | "no" | "partial";

const FEATURES = [
  { label: "AI Chat with PDF", pdftrusted: "yes" as Status, ilovepdf: "no" as Status, smallpdf: "no" as Status, adobe: "partial" as Status },
  { label: "AI Summarization", pdftrusted: "yes" as Status, ilovepdf: "no" as Status, smallpdf: "no" as Status, adobe: "partial" as Status },
  { label: "50+ Language Translation", pdftrusted: "yes" as Status, ilovepdf: "no" as Status, smallpdf: "no" as Status, adobe: "no" as Status },
  { label: "AI-Powered OCR", pdftrusted: "yes" as Status, ilovepdf: "partial" as Status, smallpdf: "partial" as Status, adobe: "yes" as Status },
  { label: "Browser-First Privacy", pdftrusted: "yes" as Status, ilovepdf: "no" as Status, smallpdf: "no" as Status, adobe: "no" as Status },
  { label: "No Sign-up Required", pdftrusted: "yes" as Status, ilovepdf: "partial" as Status, smallpdf: "no" as Status, adobe: "no" as Status },
  { label: "Free Tools (No Limits)", pdftrusted: "yes" as Status, ilovepdf: "partial" as Status, smallpdf: "partial" as Status, adobe: "no" as Status },
  { label: "Smart Scan AI", pdftrusted: "yes" as Status, ilovepdf: "no" as Status, smallpdf: "no" as Status, adobe: "no" as Status },
  { label: "AI Question Generator", pdftrusted: "yes" as Status, ilovepdf: "no" as Status, smallpdf: "no" as Status, adobe: "no" as Status },
  { label: "Auto File Deletion", pdftrusted: "yes" as Status, ilovepdf: "partial" as Status, smallpdf: "partial" as Status, adobe: "partial" as Status },
];

function StatusIcon({ status }: { status: Status }) {
  if (status === "yes") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "no") return <XCircle className="h-5 w-5 text-red-400/60" />;
  return <Minus className="h-5 w-5 text-amber-400" />;
}

export function HomeComparison() {
  return (
    <SaasSection id="comparison" className="py-12 sm:py-20">
      <ScrollReveal>
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
          <Crown className="h-3.5 w-3.5" />
          Why PdfTrusted?
        </span>
        <h2 className="saas-heading mt-4">See How We Compare</h2>
        <p className="saas-subheading mx-auto">
          PdfTrusted is the only platform with full AI document intelligence — not just basic PDF processing.
        </p>
      </div>

      <ResponsiveTable minWidth="640px" className="mt-10">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Feature</th>
            <th className="px-4 py-4 text-center">
              <div className="inline-flex flex-col items-center gap-1">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">PdfTrusted</span>
              </div>
            </th>
            <th className="px-4 py-4 text-center font-medium text-muted-foreground">iLovePDF</th>
            <th className="px-4 py-4 text-center font-medium text-muted-foreground">Smallpdf</th>
            <th className="px-4 py-4 text-center font-medium text-muted-foreground">Adobe</th>
          </tr>
        </thead>
        <tbody>
          {FEATURES.map(({ label, pdftrusted, ilovepdf, smallpdf, adobe }, idx) => (
            <tr
              key={label}
              className={`border-b border-border/60 ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
            >
              <td className="px-4 py-3 font-medium text-foreground">{label}</td>
              <td className="px-4 py-3 text-center"><div className="flex justify-center"><StatusIcon status={pdftrusted} /></div></td>
              <td className="px-4 py-3 text-center"><div className="flex justify-center"><StatusIcon status={ilovepdf} /></div></td>
              <td className="px-4 py-3 text-center"><div className="flex justify-center"><StatusIcon status={smallpdf} /></div></td>
              <td className="px-4 py-3 text-center"><div className="flex justify-center"><StatusIcon status={adobe} /></div></td>
            </tr>
          ))}
        </tbody>
      </ResponsiveTable>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/compare"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:bg-muted press-scale"
        >
          View Full Comparison
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/all-tools"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-110 press-scale"
        >
          Try PdfTrusted Free
        </Link>
      </div>
      </ScrollReveal>
    </SaasSection>
  );
}
