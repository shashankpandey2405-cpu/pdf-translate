"use client";

import { lazy, Suspense, type ComponentType } from "react";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { resolveCanonicalToolPath } from "@/lib/seo/localeSlugAliases";
import { isLocaleCode } from "@/lib/seo/site";
import ToolPage from "@/route-pages/tools/ToolPage";

const MergePDF = lazy(() => import("@/pages/tools/MergePDF"));
const CompressPDF = lazy(() => import("@/pages/tools/CompressPDF"));
const SplitPDF = lazy(() => import("@/pages/tools/SplitPDF"));
const ExtractPages = lazy(() => import("@/pages/tools/ExtractPages"));
const RemovePages = lazy(() => import("@/pages/tools/RemovePages"));
const OrganizePdf = lazy(() => import("@/pages/tools/OrganizePdf"));
const PDFToWord = lazy(() => import("@/pages/tools/PDFToWord"));
const WordToPdf = lazy(() => import("@/pages/tools/WordToPdf"));
const PDFEditor = lazy(() => import("@/pages/tools/PDFEditor"));
const SignPdf = lazy(() => import("@/pages/tools/SignPdf"));
const OcrPdf = lazy(() => import("@/pages/tools/OcrPdf"));
const UnlockPDF = lazy(() => import("@/pages/tools/UnlockPDF"));
const ProtectPdf = lazy(() => import("@/pages/tools/ProtectPdf"));
const PDFToImage = lazy(() => import("@/pages/tools/PDFToImage"));
const WatermarkPDF = lazy(() => import("@/pages/tools/WatermarkPDF"));
const RotatePDF = lazy(() => import("@/pages/tools/RotatePDF"));

const DEDICATED_BY_CANONICAL: Record<string, ComponentType> = {
  "merge-pdf": MergePDF,
  "compress-pdf": CompressPDF,
  "split-pdf": SplitPDF,
  "extract-pages": ExtractPages,
  "remove-pages": RemovePages,
  "organize-pdf": OrganizePdf,
  "pdf-to-word": PDFToWord,
  "word-to-pdf": WordToPdf,
  "pdf-editor": PDFEditor,
  "sign-pdf": SignPdf,
  "ocr-pdf": OcrPdf,
  "unlock-pdf": UnlockPDF,
  "protect-pdf": ProtectPdf,
  "pdf-to-image": PDFToImage,
  "watermark-pdf": WatermarkPDF,
  "rotate-pdf": RotatePDF,
};

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

/** Resolves locale SEO alias slugs to dedicated pages or generic ToolPage. */
export default function ToolOrDedicatedPage() {
  const { i18n } = useTranslation();
  const [, params] = useRoute("/:toolId");
  const rawSlug = (params?.toolId ?? "").trim();
  const loc = isLocaleCode(i18n.language) ? i18n.language : "en";
  const canonical = resolveCanonicalToolPath(loc, rawSlug) ?? rawSlug;
  const Dedicated = DEDICATED_BY_CANONICAL[canonical];

  if (Dedicated) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Dedicated />
      </Suspense>
    );
  }

  return <ToolPage />;
}
