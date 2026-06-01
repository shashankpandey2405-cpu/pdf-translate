"use client";

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
      <div className="hero-orb hero-orb-a absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="hero-orb hero-orb-b absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
    </div>
  );
}
