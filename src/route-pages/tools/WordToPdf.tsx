"use client";

import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { content } from "@/tools/word-to-pdf/content";
import { ConversionError } from "@/tools/conversions/ConversionError";
import { buildCloudJobOptions } from "@/lib/processing/cloudJobOptions";

const WORD_ACCEPT =
  ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function WordToPdf() {
  const { i18n } = useTranslation();

  return (
    <SinglePdfToolShell
      slug={content.slug}
      toolLabel="Word to PDF"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<FileText className="h-5 w-5 text-blue-600" />}
      iconClassName="bg-blue-50"
      steps={content.steps}
      lang={i18n.language}
      supportsEnhanced
      cloudProcessingOnly
      accept={WORD_ACCEPT}
      dropLabel="Drop your Word document here"
      dropSublabel=".docx or .doc — cloud conversion preserves layout"
      cloudOptions={() => buildCloudJobOptions("word-to-pdf", null) ?? {}}
      onProcess={async () => {
        throw new ConversionError("UNSUPPORTED", "Word conversion runs on Trusted Cloud.");
      }}
    />
  );
}
