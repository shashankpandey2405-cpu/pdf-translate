"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { content } from "@/tools/protect-pdf/content";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { protectPdfWithPassword, getProtectedFilename } from "@/tools/protect-pdf/logic";
import { scorePassword } from "@/lib/trustShield/passwordStrength";
import { cn } from "@/lib/utils";

export default function ProtectPdf() {
  const { t, i18n } = useTranslation();
  const { setMode } = useProcessingMode();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  useEffect(() => {
    setMode("enhanced");
  }, [setMode]);

  const passwordsValid =
    password.length >= 8 && password === confirm && strength.strength !== "weak";

  const strengthColor =
    strength.strength === "strong"
      ? "text-emerald-600"
      : strength.strength === "fair"
        ? "text-amber-600"
        : "text-destructive";

  return (
    <SinglePdfToolShell
      supportsEnhanced
      slug={content.slug}
      toolLabel="Protect PDF"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<ShieldCheck className="w-5 h-5 text-violet-600" />}
      iconClassName="bg-violet-50"
      steps={content.steps}
      lang={i18n.language}
      canProcess={() => passwordsValid}
      cloudOptions={() => ({
        toolSlug: "protect-pdf",
        pdfUserPassword: password,
      })}
      configurePanel={() => (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 leading-relaxed">
            <strong>Browser:</strong> PDFTrusted AES package (.pdftrusted) — not Acrobat-compatible.{" "}
            <strong>Cloud:</strong> standard PDF open password (qpdf, works in Adobe Reader).
          </p>
          <label className="block text-sm font-medium text-foreground">
            {t("protectPdf.passwordLabel", { defaultValue: "Encryption password" })}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("protectPdf.passwordPlaceholder", { defaultValue: "Strong password" })}
              data-testid="input-protect-password"
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
          <p className={cn("text-xs font-medium capitalize", strengthColor)}>
            {t("protectPdf.strength", { defaultValue: "Strength" })}: {strength.strength}
          </p>
          <label className="block text-sm font-medium text-foreground">
            {t("protectPdf.confirmLabel", { defaultValue: "Confirm password" })}
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
      onProcess={async (file) => {
        const result = await protectPdfWithPassword(file, password);
        const buf = new ArrayBuffer(result.byteLength);
        new Uint8Array(buf).set(result);
        return {
          blob: new Blob([buf], { type: "application/octet-stream" }),
          filename: getProtectedFilename(file),
        };
      }}
    />
  );
}
