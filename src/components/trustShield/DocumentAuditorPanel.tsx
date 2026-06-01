"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DocumentAuditReport } from "@/lib/trustShield/documentAuditor";
import { auditPdfInWorker } from "@/lib/trustShield/pdfWorkerClient";
import { getAuditActionHref, getAuditActionLabel } from "@/lib/trustShield/auditActions";
import { cn } from "@/lib/utils";

type Props = {
  file: File | null;
  className?: string;
};

export function DocumentAuditorPanel({ file, className }: Props) {
  const { t } = useTranslation();
  const [report, setReport] = useState<DocumentAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setReport(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void auditPdfInWorker(file)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Scan failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) return null;

  return (
    <section
      className={cn("rounded-2xl border border-border bg-muted/20 p-4", className)}
      aria-label={t("trustShield.auditorTitle", { defaultValue: "Document health scan" })}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ScanLine className="h-4 w-4 text-primary" aria-hidden />
        {t("trustShield.auditorTitle", { defaultValue: "TrustShield pre-scan" })}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {report && !loading && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {t("trustShield.health", { defaultValue: "Health" })}:{" "}
              <strong className="text-foreground">{report.healthScore}%</strong>
            </span>
            <span>{report.pageCount} pages</span>
            <span>~{report.estimatedImageCount} images</span>
            {report.formFieldCount > 0 && <span>{report.formFieldCount} form fields</span>}
          </div>
          <ul className="space-y-2">
            {report.findings.map((f) => (
              <li
                key={f.id}
                className={cn(
                  "flex gap-2 rounded-xl border px-3 py-2 text-xs",
                  f.severity === "critical" && "border-destructive/30 bg-destructive/5",
                  f.severity === "warn" && "border-amber-500/30 bg-amber-500/5",
                  f.severity === "info" && "border-border bg-background/60",
                )}
              >
                {f.severity === "critical" || f.severity === "warn" ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                )}
                <div>
                  <p className="font-medium text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-muted-foreground">{f.detail}</p>
                  {f.action && getAuditActionHref(f) && (
                    <a
                      href={getAuditActionHref(f)!}
                      className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline"
                    >
                      {getAuditActionLabel(f.action)} →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
