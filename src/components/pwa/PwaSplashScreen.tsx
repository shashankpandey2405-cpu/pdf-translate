"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstallContext } from "@/context/PwaInstallContext";
import { brandLogoNavSrc } from "@/lib/branding";

const SPLASH_KEY = "pdftrusted_splash_shown";
const SPLASH_DURATION_MS = 1100;

export function PwaSplashScreen() {
  const { standalone } = usePwaInstallContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!standalone) return;
    try {
      const shown = sessionStorage.getItem(SPLASH_KEY);
      if (shown) return;
      setVisible(true);
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      return;
    }
    const timer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    const safety = setTimeout(() => setVisible(false), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(safety);
    };
  }, [standalone]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="pwa-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Glow ring behind logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute h-40 w-40 rounded-full bg-primary blur-3xl"
          />

          <motion.img
            src={brandLogoNavSrc()}
            alt=""
            width={88}
            height={88}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-[88px] w-[88px] rounded-2xl shadow-xl shadow-primary/25"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="relative z-10 mt-5 text-xl font-bold tracking-tight text-foreground"
          >
            PDF<span className="text-primary">Trusted</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="relative z-10 mt-1.5 text-xs text-muted-foreground"
          >
            AI-Powered PDF Tools
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            className="relative z-10 mt-8 flex items-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
