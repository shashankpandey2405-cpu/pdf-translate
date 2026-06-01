"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileText, Minimize2 } from "lucide-react";

export function HeroPdfMockup() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-md aspect-[4/3]">
      <motion.div
        className="absolute inset-4 rounded-2xl border border-border/80 bg-card shadow-2xl shadow-primary/10 p-4"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">document.pdf</span>
        </div>
        <div className="space-y-2">
          {[0.9, 0.75, 0.85, 0.6].map((w, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full bg-muted origin-left"
              style={{ width: `${w * 100}%` }}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            />
          ))}
        </div>
        <motion.div
          className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2"
          animate={reduce ? undefined : { scale: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Minimize2 className="h-4 w-4 text-primary" />
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: "50%" }}
              animate={reduce ? undefined : { width: ["30%", "85%", "55%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span className="text-[10px] font-medium text-primary">Compressing</span>
        </motion.div>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((n) => (
            <motion.div
              key={n}
              className="h-14 flex-1 rounded-lg border border-border bg-muted/50"
              animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, delay: n * 0.3, repeat: Infinity }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
