"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileBarChart, Languages, MessageSquare, Minimize2, ScanText } from "lucide-react";
import { Link } from "wouter";

const SUGGESTED_TOOLS = [
  { slug: "compress-pdf", label: "Compress PDF", icon: Minimize2, desc: "Reduce file size" },
  { slug: "ocr-pdf", label: "OCR PDF", icon: ScanText, desc: "Extract text from scans" },
  { slug: "translate-pdf", label: "Translate PDF", icon: Languages, desc: "50+ languages" },
  { slug: "ai-summarize", label: "Summarize", icon: FileBarChart, desc: "AI-powered summary" },
  { slug: "chat-pdf", label: "Chat with PDF", icon: MessageSquare, desc: "Ask questions" },
] as const;

type Props = {
  filename: string;
  fileSize: number;
  currentSlug: string;
  /** Mobile: skip suggested-tools grid (less friction after upload). */
  compact?: boolean;
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function UploadSuccessStep({ filename, fileSize, currentSlug, compact = false }: Props) {
  const suggested = SUGGESTED_TOOLS.filter((t) => t.slug !== currentSlug);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{filename}</p>
          <p className="text-xs text-muted-foreground">{(fileSize / 1024 / 1024).toFixed(1)} MB uploaded</p>
        </div>
      </motion.div>

      {compact ? null : (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Try another tool
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {suggested.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.slug}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.15 + idx * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={`/${tool.slug}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.97]"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{tool.label}</span>
                  <span className="text-[10px] text-muted-foreground">{tool.desc}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
      )}
    </motion.div>
  );
}
