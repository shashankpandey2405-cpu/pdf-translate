"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/components/premium/motion";

type Props = {
  id?: string;
  title: string;
  subtitle?: ReactNode;
  featured?: boolean;
  children: ReactNode;
};

export function CategoryPanel({ id, title, subtitle, featured, children }: Props) {
  return (
    <section id={id} className="relative scroll-mt-24">
      <div
        className={`mb-5 rounded-2xl border px-4 py-3 ${
          featured
            ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent"
            : "border-border/60 bg-muted/20"
        }`}
      >
        <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle ? <div className="mt-1.5 text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-40px" }}>
        {children}
      </motion.div>
    </section>
  );
}
