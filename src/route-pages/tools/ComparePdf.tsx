"use client";

import { useState, useCallback, useMemo } from "react";
import { ToolCompareFileSlot } from "@/components/tools/ux/ToolCompareFileSlot";
import ToolSEO from "@/components/ToolSEO";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import {
  GitCompareArrows,
  RotateCcw,
  FileText,
  Plus,
  Minus,
  Equal,
  CheckCircle2,
} from "lucide-react";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";

type Stage = "upload" | "processing" | "done";

type DiffSegment = {
  type: "equal" | "add" | "remove";
  text: string;
};

/** Myers-style word diff — produces equal/add/remove segments. */
function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const n = oldWords.length;
  const m = newWords.length;

  if (n + m > 80_000) {
    return simpleFallbackDiff(oldWords, newWords);
  }

  const max = n + m;
  const vSize = 2 * max + 1;
  const v = new Int32Array(vSize).fill(-1);
  const offset = max;
  v[offset + 1] = 0;

  type Snake = { prevK: number; prevEnd: number; startX: number; startY: number; endX: number; endY: number };
  const trace: Map<number, Snake>[] = [];

  outer: for (let d = 0; d <= max; d++) {
    const snakes = new Map<number, Snake>();
    trace.push(snakes);
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      let prevK: number;
      let prevEnd: number;
      if (k === -d || (k !== d && v[offset + k - 1]! < v[offset + k + 1]!)) {
        x = v[offset + k + 1]!;
        prevK = k + 1;
        prevEnd = x;
      } else {
        x = v[offset + k - 1]! + 1;
        prevK = k - 1;
        prevEnd = v[offset + k - 1]!;
      }
      let y = x - k;
      const startX = x;
      const startY = y;
      while (x < n && y < m && oldWords[x] === newWords[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      snakes.set(k, { prevK, prevEnd, startX, startY, endX: x, endY: y });
      if (x >= n && y >= m) break outer;
    }
  }

  const edits: Array<{ type: "equal" | "add" | "remove"; word: string }> = [];
  let cx = n;
  let cy = m;

  for (let d = trace.length - 1; d >= 0; d--) {
    const k = cx - cy;
    const snake = trace[d]!.get(k);
    if (!snake) break;

    while (cx > snake.startX && cy > snake.startY) {
      cx--;
      cy--;
      edits.push({ type: "equal", word: oldWords[cx]! });
    }
    if (d > 0) {
      if (snake.prevK === k + 1) {
        cy--;
        edits.push({ type: "add", word: newWords[cy]! });
      } else {
        cx--;
        edits.push({ type: "remove", word: oldWords[cx]! });
      }
    }
  }
  edits.reverse();
  return mergeEdits(edits);
}

function simpleFallbackDiff(oldWords: string[], newWords: string[]): DiffSegment[] {
  return [
    { type: "remove", text: oldWords.join("") },
    { type: "add", text: newWords.join("") },
  ];
}

function mergeEdits(edits: Array<{ type: "equal" | "add" | "remove"; word: string }>): DiffSegment[] {
  if (!edits.length) return [];
  const result: DiffSegment[] = [];
  let cur = edits[0]!;
  let accum = cur.word;
  for (let i = 1; i < edits.length; i++) {
    const e = edits[i]!;
    if (e.type === cur.type) {
      accum += e.word;
    } else {
      result.push({ type: cur.type, text: accum });
      cur = e;
      accum = e.word;
    }
  }
  result.push({ type: cur.type, text: accum });
  return result;
}

async function extractTextFromPdf(file: File): Promise<string[]> {
  const doc = await acquirePdfDocument(file);
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .filter((item) => typeof (item as any)?.str === "string")
        .map((item) => String((item as any).str))
        .join(" ");
      pages.push(text);
    }
    return pages;
  } finally {
    releasePdfDocument(file);
  }
}

export default function ComparePdf() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [diff, setDiff] = useState<DiffSegment[]>([]);
  const [stats, setStats] = useState({ additions: 0, deletions: 0, similarity: 0 });

  const onDropA = useCallback((files: File[]) => {
    if (files[0]) setFileA(files[0]);
  }, []);
  const onDropB = useCallback((files: File[]) => {
    if (files[0]) setFileB(files[0]);
  }, []);

  const compare = useCallback(async () => {
    if (!fileA || !fileB) return;
    setStage("processing");
    try {
      const [pagesA, pagesB] = await Promise.all([
        extractTextFromPdf(fileA),
        extractTextFromPdf(fileB),
      ]);
      const textA = pagesA.join("\n\n--- Page Break ---\n\n");
      const textB = pagesB.join("\n\n--- Page Break ---\n\n");
      const segments = computeWordDiff(textA, textB);
      setDiff(segments);

      const totalChars = textA.length + textB.length;
      let equalChars = 0;
      let addChars = 0;
      let removeChars = 0;
      for (const seg of segments) {
        if (seg.type === "equal") equalChars += seg.text.length;
        else if (seg.type === "add") addChars += seg.text.length;
        else removeChars += seg.text.length;
      }
      const similarity = totalChars > 0 ? Math.round((equalChars * 2 / totalChars) * 100) : 100;
      setStats({ additions: addChars, deletions: removeChars, similarity });
      setStage("done");
      toast({ title: "Comparison complete" });
    } catch (e) {
      console.error("[compare-pdf]", e);
      toast({ title: "Comparison failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      setStage("upload");
    }
  }, [fileA, fileB]);

  const reset = useCallback(() => {
    setFileA(null);
    setFileB(null);
    setStage("upload");
    setDiff([]);
    setStats({ additions: 0, deletions: 0, similarity: 0 });
  }, []);

  const diffLeft = useMemo(
    () => diff.filter((s) => s.type === "equal" || s.type === "remove"),
    [diff],
  );
  const diffRight = useMemo(
    () => diff.filter((s) => s.type === "equal" || s.type === "add"),
    [diff],
  );

  return (
    <>
      <ToolSEO
        title="Compare Two PDFs Side by Side — Free Online | PDFTrusted"
        description="Compare two PDF documents and see every text difference highlighted. Word-level diff with similarity score. Free browser tool."
        slug="compare-pdf"
      />

      {/* Desktop */}
      <div className="hidden overflow-y-auto lg:block">
        <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 sm:py-8">
          <div className="min-w-0 flex-1 space-y-8">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <GitCompareArrows className="h-4 w-4" />
                Compare PDF
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Compare Two PDFs Side by Side
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Upload two PDF files and instantly see every difference highlighted — additions in green, deletions in red.
              </p>
            </div>

            {stage === "upload" && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Original PDF (A)
                    </div>
                    <ToolCompareFileSlot
                      file={fileA}
                      onFiles={onDropA}
                      onClear={() => setFileA(null)}
                      label="Drop original PDF"
                      sublabel="The base version"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Revised PDF (B)
                    </div>
                    <ToolCompareFileSlot
                      file={fileB}
                      onFiles={onDropB}
                      onClear={() => setFileB(null)}
                      label="Drop revised PDF"
                      sublabel="The changed version"
                    />
                  </div>
                </div>

                {fileA && fileB && (
                  <div className="flex justify-center">
                    <Button size="lg" onClick={compare} className="gap-2">
                      <GitCompareArrows className="h-5 w-5" />
                      Compare Documents
                    </Button>
                  </div>
                )}
              </div>
            )}

            {stage === "processing" && (
              <ProcessingStatus
                type="instant"
                label="Extracting text and computing differences…"
                className="py-16"
              />
            )}

            {stage === "done" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-6 rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{stats.similarity}% Similar</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">{stats.additions} chars added</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Minus className="h-4 w-4" />
                    <span className="text-sm">{stats.deletions} chars removed</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    New Comparison
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Original (A) — {fileA?.name}
                    </h3>
                    <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {diffLeft.map((seg, i) => (
                        <span
                          key={i}
                          className={cn(
                            seg.type === "remove" && "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300 line-through",
                          )}
                        >
                          {seg.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Revised (B) — {fileB?.name}
                    </h3>
                    <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {diffRight.map((seg, i) => (
                        <span
                          key={i}
                          className={cn(
                            seg.type === "add" && "bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300",
                          )}
                        >
                          {seg.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: GitCompareArrows, title: "Word-Level Diff", desc: "Every word change detected and highlighted with precision." },
                { icon: FileText, title: "Contract & Legal", desc: "Perfect for comparing contract revisions, legal drafts, and reports." },
                { icon: Equal, title: "Similarity Score", desc: "See the exact percentage match between your two documents." },
              ].map((f) => (
                <div key={f.title} className="rounded-lg border bg-card p-4 text-center">
                  <f.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile */}
      <MobileToolLayout
        slug="compare-pdf"
        toolLabel="Compare PDF"
        title="Compare PDF"
        settingsPanel={null}
        processButton={
          stage === "upload" && fileA && fileB ? (
            <Button size="lg" onClick={compare} className="w-full gap-2">
              <GitCompareArrows className="h-5 w-5" />
              Compare Documents
            </Button>
          ) : null
        }
      >
        {stage === "upload" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Original PDF (A)
              </div>
              <ToolCompareFileSlot
                file={fileA}
                onFiles={onDropA}
                onClear={() => setFileA(null)}
                label="Drop original PDF"
                sublabel="The base version"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Revised PDF (B)
              </div>
              <ToolCompareFileSlot
                file={fileB}
                onFiles={onDropB}
                onClear={() => setFileB(null)}
                label="Drop revised PDF"
                sublabel="The changed version"
              />
            </div>

          </div>
        )}

        {stage === "processing" && (
          <ProcessingStatus type="instant" label="Computing differences…" className="py-12" />
        )}

        {stage === "done" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{stats.similarity}% Similar</span>
              </div>
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">{stats.additions} added</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <Minus className="h-3.5 w-3.5" />
                <span className="text-xs">{stats.deletions} removed</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Original (A)
                </h3>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {diffLeft.map((seg, i) => (
                    <span
                      key={i}
                      className={cn(
                        seg.type === "remove" && "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300 line-through",
                      )}
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Revised (B)
                </h3>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {diffRight.map((seg, i) => (
                    <span
                      key={i}
                      className={cn(
                        seg.type === "add" && "bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300",
                      )}
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button variant="outline" size="lg" onClick={reset} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              New Comparison
            </Button>
          </div>
        )}
      </MobileToolLayout>
    </>
  );
}
