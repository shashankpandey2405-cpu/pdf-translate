"use client";

import { cn } from "@/lib/utils";

export function PulseGlow({ className, color = "primary" }: { className?: string; color?: "primary" | "ai" | "success" }) {
  const colorMap = {
    primary: "bg-primary/20",
    ai: "bg-blue-500/20",
    success: "bg-emerald-500/20",
  };
  return (
    <span className={cn("absolute inset-0 rounded-full animate-ai-pulse", colorMap[color], className)} aria-hidden />
  );
}

export function ScanLine({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-ai-scan", className)} aria-hidden />
  );
}

export function ProcessingOrb({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-16 w-16", md: "h-24 w-24", lg: "h-32 w-32" };
  return (
    <div className={cn("relative flex items-center justify-center", sizeMap[size], className)} aria-hidden>
      <div className="absolute inset-0 rounded-full gradient-ai opacity-20 animate-ai-pulse" />
      <div className="absolute inset-2 rounded-full gradient-ai opacity-30 animate-ai-pulse" style={{ animationDelay: "0.3s" }} />
      <div className="absolute inset-4 rounded-full gradient-ai opacity-40 animate-ai-pulse" style={{ animationDelay: "0.6s" }} />
      <div className="relative z-10 flex items-center justify-center rounded-full bg-background shadow-lg" style={{ width: "60%", height: "60%" }}>
        <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    </div>
  );
}

export function DocumentAnalysisVisual({ className, progress = 0 }: { className?: string; progress?: number }) {
  return (
    <div className={cn("relative w-full max-w-[200px] mx-auto", className)} aria-hidden>
      <div className="relative rounded-xl border border-border bg-card p-4 shadow-lg">
        {/* Document lines */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full mb-2 last:mb-0 transition-all duration-500",
              i * 16 < progress ? "bg-primary/30" : "bg-muted",
            )}
            style={{ width: `${60 + Math.sin(i * 1.2) * 30}%`, transitionDelay: `${i * 80}ms` }}
          />
        ))}
        {/* Scan line overlay */}
        {progress > 0 && progress < 100 && (
          <div className="absolute inset-x-0 overflow-hidden" style={{ top: 0, height: "100%" }}>
            <ScanLine />
          </div>
        )}
      </div>
    </div>
  );
}

export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 gradient-mesh", className)} aria-hidden />
  );
}

export function AnimatedCheckmark({ className, size = 48 }: { className?: string; size?: number }) {
  return (
    <svg
      className={cn("text-emerald-500", className)}
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden
    >
      <circle cx="26" cy="26" r="24" fill="currentColor" opacity="0.1" />
      <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M16 27l7 7 13-14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-check-reveal"
        strokeDasharray="100"
      />
    </svg>
  );
}

export function FloatingParticles({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/20 animate-float"
          style={{
            left: `${15 + (i * 70) / count}%`,
            top: `${20 + Math.sin(i * 1.5) * 30}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
