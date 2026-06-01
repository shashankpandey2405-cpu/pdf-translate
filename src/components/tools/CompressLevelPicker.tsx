"use client";

import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  CompressionLevel,
  getQualityDescription,
  getQualityLabel,
} from "@/tools/compress-pdf/logic";
import { ToolModalSettingsBlock } from "@/components/tools/ToolModalSettingsBlock";

const LEVELS: CompressionLevel[] = ["extreme", "recommended", "less"];

type Props = {
  level: CompressionLevel;
  onLevelChange: (level: CompressionLevel) => void;
  /** Affects preset descriptions (browser vs cloud). */
  processingContext?: "browser" | "cloud";
};

export function CompressLevelPicker({ level, onLevelChange, processingContext = "browser" }: Props) {
  const { t } = useTranslation();

  return (
    <ToolModalSettingsBlock
      title={t("compress.levelTitle", { defaultValue: "Compression level" })}
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            data-testid={`button-compression-${l}`}
            onClick={() => onLevelChange(l)}
            className={`relative rounded-xl border-2 p-3 text-left transition-all touch-manipulation ${
              level === l
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {level === l ? (
              <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-primary" />
            ) : null}
            <p className="mb-0.5 pr-6 text-sm font-semibold text-foreground">{getQualityLabel(l)}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {getQualityDescription(l, processingContext)}
            </p>
          </button>
        ))}
      </div>
    </ToolModalSettingsBlock>
  );
}
