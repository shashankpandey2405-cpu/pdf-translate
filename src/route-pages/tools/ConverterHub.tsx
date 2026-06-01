"use client";

import { Link } from "wouter";
import { ArrowRight, FileImage, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { ConverterHubDesktop } from "@/components/desktop/ConverterHubDesktop";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";

const MOBILE_QUICK_CONVERT = [
  { href: "/pdf-to-word", label: "PDF to Word", icon: FileText, desc: "Editable DOCX" },
  { href: "/word-to-pdf", label: "Word to PDF", icon: FileText, desc: "From DOCX" },
  { href: "/pdf-to-image", label: "PDF to Image", icon: FileImage, desc: "JPG / PNG" },
  { href: "/pdf-to-excel", label: "PDF to Excel", icon: FileSpreadsheet, desc: "Tables & data" },
  { href: "/universal-converter", label: "All formats", icon: RefreshCw, desc: "50+ conversions" },
] as const;

function ConverterHubMobile() {
  return (
    <div className="min-h-[calc(100dvh-8rem)] px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Converter
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Convert any file</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a format below or open the full universal converter.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MOBILE_QUICK_CONVERT.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="press-scale flex min-h-[100px] flex-col gap-2 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-md active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-bold leading-tight text-foreground">{label}</span>
            <span className="text-[11px] text-muted-foreground">{desc}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/universal-converter"
        className="press-scale mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25"
      >
        Open Universal Converter
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

export default function ConverterHub() {
  return (
    <ToolPageSplit
      desktop={<ConverterHubDesktop />}
      mobile={
        <MobileToolLayout slug="converter-hub" toolLabel="Converter" title="Convert any file">
          <ConverterHubMobile />
        </MobileToolLayout>
      }
    />
  );
}
