"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { hardLockPdfFile, getHardLockedFilename } from "@/tools/hard-lock-pdf/logic";
import { content } from "@/tools/hard-lock-pdf/content";

export default function HardLockPdf() {
  const { i18n } = useTranslation();
  const [progressLabel, setProgressLabel] = useState("");

  return (
    <SinglePdfToolShell
      slug={content.slug}
      toolLabel="Hard Lock PDF"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<Lock className="w-5 h-5 text-primary" />}
      iconClassName="bg-primary/10"
      steps={content.steps}
      lang={i18n.language}
      configurePanel={() => (
        <p className="text-xs text-muted-foreground leading-relaxed rounded-xl border border-primary/20 bg-primary/5 p-3">
          {progressLabel || "Hard Lock rasterizes every page at high resolution. The output cannot be edited in Acrobat, browsers, or PDF editors."}
        </p>
      )}
      onProcess={async (file) => {
        const bytes = await hardLockPdfFile(file, {
          onProgress: (page, total) => {
            setProgressLabel(`Flattening page ${page} of ${total}…`);
          },
        });
        return {
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
          filename: getHardLockedFilename(file),
        };
      }}
    />
  );
}
