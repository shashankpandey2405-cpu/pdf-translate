"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { content } from "@/tools/unlock-pdf/content";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { unlockPDF, getUnlockedFilename } from "@/tools/unlock-pdf/logic";

export default function UnlockPDF() {
  const { t, i18n } = useTranslation();
  const { setMode } = useProcessingMode();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMode("enhanced");
  }, [setMode]);

  return (
    <SinglePdfToolShell
      supportsEnhanced
      slug={content.slug}
      toolLabel="Unlock PDF"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<Lock className="w-5 h-5 text-amber-600" />}
      iconClassName="bg-amber-50"
      steps={content.steps}
      lang={i18n.language}
      cloudOptions={() => ({
        toolSlug: "unlock-pdf",
        pdfUnlockPassword: password,
      })}
      configurePanel={() => (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 leading-relaxed">
            <strong>Browser:</strong> copies pages into a new PDF when encryption allows (may not remove all restrictions).{" "}
            <strong>Cloud:</strong> qpdf decrypt — use when you have the document open password.
          </p>
          <label className="block text-sm font-medium text-foreground">
            {t("unlockPdf.passwordLabel", { defaultValue: "PDF password (if required)" })}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("unlockPdf.passwordPlaceholder", { defaultValue: "Enter password" })}
              data-testid="input-unlock-password"
              className="w-full px-4 py-3 pr-12 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
      onProcess={async (file) => {
        const result = await unlockPDF(file, password);
        return {
          blob: new Blob([result as BlobPart], { type: "application/pdf" }),
          filename: getUnlockedFilename(file),
        };
      }}
    />
  );
}
