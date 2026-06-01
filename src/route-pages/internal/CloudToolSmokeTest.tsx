"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { PDFDocument } from "pdf-lib";
import { usePremium } from "@/context/PremiumContext";
import {
  createEnhancedJob,
  pollEnhancedJob,
  presignEnhancedUpload,
  uploadToPresignedUrl,
} from "@/lib/enhanced/enhancedJobClient";
import type { EnhancedJobResponse } from "@/lib/enhanced/types";
import { InternalRouteGuard } from "@/components/internal/InternalRouteGuard";
import { toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";

type ToolRun = {
  toolSlug: string;
  ok: boolean;
  status: EnhancedJobResponse["status"] | "not_run";
  stage?: "presign" | "upload" | "enqueue" | "poll" | "download" | "done" | "failed";
  jobId?: string;
  traceId?: string;
  outputFilename?: string | null;
  downloadUrl?: string | null;
  outputBytes?: number;
  ms?: number;
  error?: string;
};

type ToolFileMap = Record<string, File | null>;

type Fixtures = {
  pdf: File | null;
  docx: File | null;
  pptx: File | null;
};

const CLOUD_TOOLS: Array<{
  toolSlug: string;
  needs: keyof Fixtures;
  label: string;
  options?: Record<string, unknown>;
}> = [
  { toolSlug: "ocr-pdf", label: "OCR PDF", needs: "pdf" },
  { toolSlug: "compress-pdf", label: "Compress PDF", needs: "pdf" },
  { toolSlug: "pdf-to-word", label: "PDF → Word", needs: "pdf" },
  { toolSlug: "pdf-to-excel", label: "PDF → Excel", needs: "pdf" },
  { toolSlug: "pdf-to-image", label: "PDF → images (ZIP)", needs: "pdf", options: { imageFormat: "png", dpi: 150 } },
  { toolSlug: "pdf-to-pptx", label: "PDF → PPTX", needs: "pdf", options: { dpi: 150 } },
  { toolSlug: "protect-pdf", label: "Protect PDF", needs: "pdf", options: { pdfUserPassword: "test1234" } },
  { toolSlug: "unlock-pdf", label: "Unlock PDF", needs: "pdf" },
  { toolSlug: "redact-pdf", label: "Redact PDF", needs: "pdf", options: { redactPatterns: ["EMAIL", "PHONE"] } },
  { toolSlug: "word-to-pdf", label: "Word → PDF", needs: "docx" },
  { toolSlug: "pptx-to-pdf", label: "PPTX → PDF", needs: "pptx" },
];

async function makeTinyPdf(): Promise<File> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  page.drawText("PDFTrusted cloud smoke test", { x: 72, y: 720, size: 18 });
  page.drawText("RowA  Col1    Col2", { x: 72, y: 680, size: 12 });
  page.drawText("RowB  12      34", { x: 72, y: 660, size: 12 });
  const bytes = await doc.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new File([copy], "fixture.pdf", { type: "application/pdf" });
}

async function readAsBlob(url: string, jobId?: string): Promise<Blob> {
  const isSameOrigin =
    url.startsWith("/") ||
    (typeof window !== "undefined" && url.startsWith(window.location.origin));
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`download_http_${res.status}`);
    return res.blob();
  } catch (e) {
    // Browser-side "Failed to fetch" here is almost always Cloudflare R2 CORS for GET/HEAD.
    const host = (() => {
      try {
        return new URL(url).host;
      } catch {
        return "unknown-host";
      }
    })();
    const msg = e instanceof Error ? e.message : String(e);
    if (!isSameOrigin && jobId) {
      try {
        const res = await fetch(`/api/enhanced/jobs/${jobId}/download`, { credentials: "include" });
        if (!res.ok) throw new Error(`proxy_download_http_${res.status}`);
        return res.blob();
      } catch (proxyErr) {
        const proxyMsg = proxyErr instanceof Error ? proxyErr.message : String(proxyErr);
        throw new Error(
          `download_fetch_failed(host=${host}): ${msg}; proxy_fallback_failed: ${proxyMsg}`,
        );
      }
    }
    throw new Error(
      `download_fetch_failed(host=${host}): ${msg}. If host is R2, add CORS AllowedOrigins for https://www.pdftrusted.com and AllowedMethods GET,HEAD.`,
    );
  }
}

async function countPdfPagesQuick(file: File): Promise<number | null> {
  try {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

async function runCloudJob(params: {
  toolSlug: string;
  file: File;
  options?: Record<string, unknown>;
  unlockPasswordSourceBlob?: Blob | null;
}): Promise<{ jobId: string; traceId?: string; outputFilename?: string | null; downloadUrl: string; outputBlob: Blob; ms: number }> {
  const started = performance.now();
  const pages = params.file.type.includes("pdf") || params.file.name.toLowerCase().endsWith(".pdf")
    ? await countPdfPagesQuick(params.file)
    : null;

  let presign: Awaited<ReturnType<typeof presignEnhancedUpload>>;
  try {
    presign = await presignEnhancedUpload(params.file, { toolSlug: params.toolSlug, pageCount: pages });
  } catch (e) {
    throw new Error(`presign_failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    await uploadToPresignedUrl(presign.url, params.file, presign.contentType, {
      key: presign.key,
      toolSlug: params.toolSlug,
    });
  } catch (e) {
    throw new Error(`upload_failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  let jobId: string;
  try {
    ({ jobId } = await createEnhancedJob({
      toolSlug: params.toolSlug,
      inputR2Key: presign.key,
      fileSize: params.file.size,
      pageCount: pages,
      jobId: presign.jobId,
      traceId: presign.traceId,
      options: params.options,
    }));
  } catch (e) {
    throw new Error(`enqueue_failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  const deadline = Date.now() + 12 * 60 * 1000;
  let delay = 600;
  while (Date.now() < deadline) {
    let snap: EnhancedJobResponse;
    try {
      snap = await pollEnhancedJob(jobId);
    } catch (e) {
      throw new Error(`poll_failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (snap.status === "done") {
      if (!snap.downloadUrl) throw new Error("done_without_download_url");
      const outputBlob = await readAsBlob(snap.downloadUrl, jobId);
      return {
        jobId,
        traceId: snap.traceId,
        outputFilename: snap.outputFilename,
        downloadUrl: snap.downloadUrl,
        outputBlob,
        ms: Math.round(performance.now() - started),
      };
    }
    if (snap.status === "failed") {
      throw new Error(snap.errorMessage ?? snap.errorCode ?? "cloud_failed");
    }
    if (snap.status === "cancelled") throw new Error("cloud_cancelled");
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(4000, Math.round(delay * 1.25));
  }
  throw new Error("cloud_timeout");
}

function downloadJson(filename: string, payload: unknown) {
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function copyText(text: string) {
  if (typeof navigator === "undefined") return;
  void navigator.clipboard?.writeText(text);
}

export default function CloudToolSmokeTest() {
  const { isSignedIn } = usePremium();
  const exampleUrls = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        smoke: "/en/internal/cloud-smoke",
        infra: "/en/internal/cloud-pipeline",
      };
    }
    const { origin } = window.location;
    const parts = window.location.pathname.split("/").filter(Boolean);
    const lang = parts[0]?.length === 2 ? parts[0] : "en";
    return {
      smoke: `${origin}/${lang}/internal/cloud-smoke`,
      infra: `${origin}/${lang}/internal/cloud-pipeline`,
    };
  }, []);
  const [fixtures, setFixtures] = useState<Fixtures>({ pdf: null, docx: null, pptx: null });
  const [toolFiles, setToolFiles] = useState<ToolFileMap>({});
  const [rows, setRows] = useState<ToolRun[]>(() =>
    CLOUD_TOOLS.map((t) => ({ toolSlug: t.toolSlug, ok: false, status: "not_run" })),
  );
  const [running, setRunning] = useState(false);
  const lastProtectedPdfRef = useRef<Blob | null>(null);
  const [protectPassword, setProtectPassword] = useState("test1234");
  const [unlockPassword, setUnlockPassword] = useState("test1234");
  const [redactCsv, setRedactCsv] = useState("EMAIL,PHONE");

  const missingCloud = useMemo(() => CLOUD_TOOLS.filter((t) => !toolSupportsCloudProcessing(t.toolSlug)), []);

  const ensurePdfFixture = useCallback(async () => {
    if (fixtures.pdf) return fixtures.pdf;
    const pdf = await makeTinyPdf();
    setFixtures((f) => ({ ...f, pdf }));
    return pdf;
  }, [fixtures.pdf]);

  const updateRow = useCallback((toolSlug: string, patch: Partial<ToolRun>) => {
    setRows((prev) => prev.map((r) => (r.toolSlug === toolSlug ? { ...r, ...patch } : r)));
  }, []);

  const fileForTool = useCallback(
    async (toolSlug: string, needs: keyof Fixtures): Promise<File | null> => {
      const direct = toolFiles[toolSlug] ?? null;
      if (direct) return direct;
      const global = fixtures[needs];
      if (global) return global;
      if (needs === "pdf") {
        return ensurePdfFixture();
      }
      return null;
    },
    [ensurePdfFixture, fixtures, toolFiles],
  );

  const runOne = useCallback(
    async (toolSlug: string) => {
      const tool = CLOUD_TOOLS.find((t) => t.toolSlug === toolSlug);
      if (!tool) return;

      updateRow(toolSlug, {
        ok: false,
        status: "queued",
        stage: "presign",
        error: undefined,
        outputBytes: undefined,
        outputFilename: undefined,
        downloadUrl: undefined,
        ms: undefined,
      });
      try {
        let file: File | null = await fileForTool(toolSlug, tool.needs);
        if (!file) {
          updateRow(toolSlug, {
            ok: false,
            status: "failed",
            stage: "failed",
            error: `missing_fixture:${tool.needs}`,
          });
          return;
        }

        let options = tool.options;
        if (toolSlug === "unlock-pdf") {
          // Unlock should run against a password-protected PDF output if available.
          const protectedBlob = lastProtectedPdfRef.current;
          if (!protectedBlob) {
            updateRow(toolSlug, {
              ok: false,
              status: "failed",
              stage: "failed",
              error: "unlock_requires_protect_first",
            });
            return;
          }
          file = new File([protectedBlob], "protected.pdf", { type: "application/pdf" });
          options = { pdfUnlockPassword: unlockPassword };
        } else if (toolSlug === "protect-pdf") {
          options = { pdfUserPassword: protectPassword };
        } else if (toolSlug === "redact-pdf") {
          const patterns = redactCsv
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          // Permit/scanned PDFs often lack email/phone; numeric + word tokens still validate redaction.
          options = {
            redactPatterns: patterns.length ? patterns : ["EMAIL", "PHONE"],
            redactCustomRegex: ["\\b\\d{4,}\\b", "\\b[A-Za-z]{6,}\\b"],
          };
        }

        updateRow(toolSlug, { stage: "upload" });
        const result = await runCloudJob({ toolSlug, file, options });
        const outBytes = result.outputBlob.size;
        if (toolSlug === "protect-pdf") {
          lastProtectedPdfRef.current = result.outputBlob;
        }

        updateRow(toolSlug, {
          ok: outBytes > 512,
          status: "done",
          stage: "done",
          jobId: result.jobId,
          traceId: result.traceId,
          outputFilename: result.outputFilename ?? null,
          downloadUrl: result.downloadUrl,
          outputBytes: outBytes,
          ms: result.ms,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const stage =
          msg.startsWith("presign_failed:") ? "presign"
          : msg.startsWith("upload_failed:") ? "upload"
          : msg.startsWith("enqueue_failed:") ? "enqueue"
          : msg.startsWith("poll_failed:") ? "poll"
          : msg.startsWith("download_") ? "download"
          : "failed";
        updateRow(toolSlug, {
          ok: false,
          status: "failed",
          stage,
          error: msg,
        });
      }
    },
    [fileForTool, protectPassword, redactCsv, unlockPassword, updateRow],
  );

  const runAll = useCallback(async () => {
    setRunning(true);
    lastProtectedPdfRef.current = null;
    try {
      for (const t of CLOUD_TOOLS) {
        // Keep runs deterministic and low load: sequential execution.
        // eslint-disable-next-line no-await-in-loop
        await runOne(t.toolSlug);
      }
    } finally {
      setRunning(false);
    }
  }, [runOne]);

  const summary = useMemo(() => {
    const done = rows.filter((r) => r.status === "done").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const notRun = rows.filter((r) => r.status === "not_run").length;
    return { done, failed, notRun, total: rows.length };
  }, [rows]);

  const retryFailed = useCallback(async () => {
    setRunning(true);
    try {
      const failed = new Set(
        rows.filter((r) => r.status === "failed").map((r) => r.toolSlug),
      );
      if (failed.has("unlock-pdf") && !lastProtectedPdfRef.current) {
        await runOne("protect-pdf");
      }
      for (const t of CLOUD_TOOLS) {
        if (!failed.has(t.toolSlug)) continue;
        // eslint-disable-next-line no-await-in-loop
        await runOne(t.toolSlug);
      }
    } finally {
      setRunning(false);
    }
  }, [rows, runOne]);

  return (
    <InternalRouteGuard>
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Cloud smoke test (internal)</title>
      </Helmet>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Internal QA</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Cloud tool smoke test</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Runs every cloud-enabled tool once and reports jobId / traceId / output size. Not linked from marketing.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Yeh tool navbar / menu mein nahi dikhega</p>
        <p className="mt-2">
          Address bar mein manually kholo — pehle <strong className="text-foreground">locale</strong> ho na zaroori hai (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/en/</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/hi/</code>, wagaira):
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs break-all">
          <li>
            Full smoke test: <span className="text-foreground">{exampleUrls.smoke}</span>
          </li>
          <li>
            Sirf Redis/API health: <span className="text-foreground">{exampleUrls.infra}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs">
          Local dev example:{" "}
          <code className="rounded bg-muted px-1 py-0.5">http://localhost:3000/en/internal/cloud-smoke</code> (jo port tum
          use karte ho).
        </p>
        <p className="mt-2 text-xs">
          Agar page hi na khule → latest frontend deploy verify karo (ye routes Sirf nayi build mein hain).
        </p>
      </div>

      {!isSignedIn ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          Sign in required (cloud jobs need auth cookies).
        </div>
      ) : null}

      {missingCloud.length ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Cloud not configured for: {missingCloud.map((t) => t.toolSlug).join(", ")}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Status summary</p>
        <p className="mt-2">
          Done: <span className="font-mono text-foreground">{summary.done}</span> · Failed:{" "}
          <span className="font-mono text-foreground">{summary.failed}</span> · Not run:{" "}
          <span className="font-mono text-foreground">{summary.notRun}</span> · Total:{" "}
          <span className="font-mono text-foreground">{summary.total}</span>
        </p>
        <p className="mt-2 text-xs">
          Downloads use same-origin <span className="font-mono">/api/enhanced/jobs/&#123;id&#125;/download</span> (no R2 CORS). If
          “Open download link” still fails, redeploy Vercel after latest code.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Passwords (security)</p>
          <label className="mt-3 block text-xs font-medium text-muted-foreground">Protect password</label>
          <input
            value={protectPassword}
            onChange={(e) => setProtectPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. test1234"
          />
          <label className="mt-3 block text-xs font-medium text-muted-foreground">Unlock password</label>
          <input
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. test1234"
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Redaction patterns</p>
          <p className="mt-2 text-xs text-muted-foreground">Comma-separated (e.g. EMAIL,PHONE,SSN)</p>
          <input
            value={redactCsv}
            onChange={(e) => setRedactCsv(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Note: <span className="font-mono">unlock-pdf</span> runs against the last <span className="font-mono">protect-pdf</span>{" "}
            output. Run protect first.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          disabled={running}
          onClick={() => void ensurePdfFixture()}
          className="min-h-[44px] rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 disabled:opacity-60"
        >
          Generate PDF fixture
        </button>

        <label className="min-h-[44px] cursor-pointer rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30">
          Upload DOCX fixture
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFixtures((prev) => ({ ...prev, docx: f }));
            }}
          />
        </label>

        <label className="min-h-[44px] cursor-pointer rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30">
          Upload PPTX fixture
          <input
            type="file"
            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFixtures((prev) => ({ ...prev, pptx: f }));
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!isSignedIn || running}
          onClick={() => void runAll()}
          className="min-h-[48px] rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {running ? "Running…" : "Run ALL cloud tools"}
        </button>
        <button
          type="button"
          disabled={!isSignedIn || running}
          onClick={() => void retryFailed()}
          className="min-h-[48px] rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 disabled:opacity-60"
        >
          Retry FAILED only
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => {
            const ts = new Date().toISOString().replace(/[:.]/g, "-");
            downloadJson(`pdftrusted-cloud-smoke-${ts}.json`, {
              generatedAt: new Date().toISOString(),
              tools: CLOUD_TOOLS.map((t) => ({ toolSlug: t.toolSlug, label: t.label, needs: t.needs })),
              results: rows,
              fixtures: {
                pdf: fixtures.pdf ? { name: fixtures.pdf.name, bytes: fixtures.pdf.size, type: fixtures.pdf.type } : null,
                docx: fixtures.docx ? { name: fixtures.docx.name, bytes: fixtures.docx.size, type: fixtures.docx.type } : null,
                pptx: fixtures.pptx ? { name: fixtures.pptx.name, bytes: fixtures.pptx.size, type: fixtures.pptx.type } : null,
              },
              toolFiles: Object.fromEntries(
                Object.entries(toolFiles).map(([slug, f]) => [
                  slug,
                  f ? { name: f.name, bytes: f.size, type: f.type } : null,
                ]),
              ),
            });
          }}
          className="min-h-[48px] rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 disabled:opacity-60"
        >
          Export report JSON
        </button>
      </div>

      <ul className="space-y-3">
        {CLOUD_TOOLS.map((t) => {
          const row = rows.find((r) => r.toolSlug === t.toolSlug)!;
          const color = row.status === "done" && row.ok
            ? "border-emerald-500/40 bg-emerald-500/5"
            : row.status === "failed"
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-card";
          return (
            <li key={t.toolSlug} className={`rounded-2xl border p-4 ${color}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.toolSlug} · needs {t.needs}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Selected file:{" "}
                    <span className="font-mono text-foreground">
                      {(toolFiles[t.toolSlug] ?? fixtures[t.needs])?.name ?? "—"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground hover:bg-muted/30">
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        t.needs === "pdf"
                          ? ".pdf,application/pdf"
                          : t.needs === "docx"
                            ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            : ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      }
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setToolFiles((prev) => ({ ...prev, [t.toolSlug]: f }));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!isSignedIn || running}
                    onClick={() => void runOne(t.toolSlug)}
                    className="min-h-[40px] rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground hover:bg-muted/30 disabled:opacity-60"
                  >
                    Run
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <p>Status: <span className="font-medium text-foreground">{row.status}</span></p>
                {row.stage ? <p>stage: <span className="font-mono text-foreground">{row.stage}</span></p> : null}
                {row.jobId ? <p>jobId: <span className="font-mono text-foreground">{row.jobId}</span></p> : null}
                {row.traceId ? <p>traceId: <span className="font-mono text-foreground">{row.traceId}</span></p> : null}
                {row.outputFilename ? <p>output: <span className="font-mono text-foreground">{row.outputFilename}</span></p> : null}
                {row.outputBytes !== undefined ? <p>bytes: <span className="font-mono text-foreground">{row.outputBytes}</span></p> : null}
                {row.ms !== undefined ? <p>time: <span className="font-mono text-foreground">{row.ms}ms</span></p> : null}
                {row.downloadUrl ? (
                  <p className="break-all">
                    downloadUrl: <span className="font-mono text-foreground">{row.downloadUrl}</span>
                  </p>
                ) : null}
                {row.error ? <p className="text-destructive">error: {row.error}</p> : null}
              </div>
              {row.downloadUrl ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    className="min-h-[36px] inline-flex items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted/30"
                    href={row.jobId ? `/api/enhanced/jobs/${row.jobId}/download` : row.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download (via API)
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(row.downloadUrl ?? "")}
                    className="min-h-[36px] rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted/30"
                  >
                    Copy link
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
    </InternalRouteGuard>
  );
}

