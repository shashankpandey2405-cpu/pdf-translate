"use client";

import { Code2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { pdfToHtml } from "@/tools/pdf-to-html/logic";
import { content } from "@/tools/pdf-to-html/content";

export default function PdfToHtml() {
  const { i18n } = useTranslation();
  return (
    <SinglePdfToolShell
      slug={content.slug}
      toolLabel="PDF to HTML"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<Code2 className="w-5 h-5 text-indigo-600" />}
      iconClassName="bg-indigo-50"
      steps={content.steps}
      lang={i18n.language}
      onProcess={async (file) => {
        const { html, filename } = await pdfToHtml(file);
        return {
          blob: new Blob([html], { type: "text/html;charset=utf-8" }),
          filename,
        };
      }}
    />
  );
}
