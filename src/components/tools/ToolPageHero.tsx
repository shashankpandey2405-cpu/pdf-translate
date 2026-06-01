"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ToolIcon } from "@/components/home/ToolIcon";
import { ProcessingTypeBadge, FormatBadge } from "@/components/ui/premium-badge";
import { fadeUp, fadeUpTransition } from "@/components/premium/motion";

type Props = {
  slug: string;
  title: string;
  description: string;
  processingType?: "browser" | "cloud" | "ai";
  formats?: string[];
  className?: string;
};

export function ToolPageHero({ slug, title, description, processingType, formats, className }: Props) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      className={cn("text-center py-8 sm:py-12", className)}
    >
      <motion.div variants={fadeUp} transition={fadeUpTransition} className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <ToolIcon slug={slug} className="h-8 w-8" />
        </div>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        transition={fadeUpTransition}
        className="mt-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </motion.h1>

      <motion.p
        variants={fadeUp}
        transition={fadeUpTransition}
        className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
      >
        {description}
      </motion.p>

      <motion.div
        variants={fadeUp}
        transition={fadeUpTransition}
        className="mt-4 flex flex-wrap items-center justify-center gap-3"
      >
        {processingType && <ProcessingTypeBadge type={processingType} />}
        {formats && formats.length > 0 && <FormatBadge formats={formats} />}
      </motion.div>
    </motion.div>
  );
}
