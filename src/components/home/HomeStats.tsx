"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Sparkles, Users, Globe } from "lucide-react";

const STATS = [
  { value: 500000, suffix: "+", label: "PDFs Processed", icon: Sparkles },
  { value: 30, suffix: "+", label: "AI-Powered Tools", icon: Shield },
  { value: 100, suffix: "+", label: "Countries Served", icon: Globe },
  { value: 50, suffix: "+", label: "Languages Supported", icon: Users },
] as const;

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatItem({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: typeof Shield }) {
  const { count, ref } = useCountUp(value);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 px-4 py-4">
      <Icon className="h-5 w-5 text-primary/70" aria-hidden />
      <span className="text-3xl font-black tracking-tight text-foreground tabular-nums sm:text-4xl">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

export function HomeStats() {
  return (
    <section aria-label="Platform statistics" className="border-y border-border/60 bg-muted/20 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-border/40 sm:grid-cols-4 py-4">
          {STATS.map(({ value, suffix, label, icon }) => (
            <StatItem key={label} value={value} suffix={suffix} label={label} icon={icon} />
          ))}
        </div>
      </div>
    </section>
  );
}
