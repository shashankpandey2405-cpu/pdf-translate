"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { RotatePdfConfigurePanel } from "@/components/tools/rotate/RotatePdfConfigurePanel";
import {
  rotatePDF,
  rotateAllPages,
  getRotatedFilename,
  type RotationAngle,
} from "@/tools/rotate-pdf/logic";
import { content } from "@/tools/rotate-pdf/content";

type PageState = { rotation: number };

import { usePdfWorkerCleanup } from "@/hooks/usePdfWorker";

export default function RotatePDF() {
  usePdfWorkerCleanup();
  const { i18n } = useTranslation();
  const [pageStates, setPageStates] = useState<PageState[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  return (
    <SinglePdfToolShell
      slug={content.slug}
      toolLabel="Rotate PDF"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<RotateCw className="h-5 w-5 text-violet-600" />}
      iconClassName="bg-violet-50"
      steps={content.steps}
      lang={i18n.language}
      configurePanel={(file) => (
        <RotatePdfConfigurePanel
          file={file}
          pageStates={pageStates}
          setPageStates={setPageStates}
          selected={selected}
          setSelected={setSelected}
        />
      )}
      onProcess={async (file) => {
        const rotations = pageStates
          .map((p, i) => ({ pageIndex: i, angle: p.rotation }))
          .filter((r) => r.angle !== 0)
          .map((r) => ({ pageIndex: r.pageIndex, angle: r.angle as RotationAngle }));

        const result =
          rotations.length === 0 ? await rotateAllPages(file, 90) : await rotatePDF(file, rotations);

        return {
          blob: new Blob([result as BlobPart], { type: "application/pdf" }),
          filename: getRotatedFilename(file),
        };
      }}
    />
  );
}
