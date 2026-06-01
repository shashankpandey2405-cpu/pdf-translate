"use client";

import { motion } from "framer-motion";
import { PremiumToolCardInner, type PremiumToolCardProps } from "@/components/home/PremiumToolCardCore";

export function PremiumToolCardMotionShell(props: Omit<PremiumToolCardProps, "disableMotion">) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="will-change-transform"
    >
      <PremiumToolCardInner {...props} />
    </motion.div>
  );
}
