import { Link } from "wouter";
import { Camera, FileUser, ImageDown, BadgeCheck } from "lucide-react";

const LINKS = [
  {
    slug: "resume-builder",
    href: "/resume-builder",
    icon: FileUser,
    title: "Resume Builder",
    desc: "10 ATS templates · live preview · zero uploads",
  },
  {
    slug: "photo-resizer",
    href: "/photo-resizer",
    icon: ImageDown,
    title: "Photo Resizer for Forms",
    desc: "Hit exact KB limits for official applications",
  },
  {
    slug: "document-scanner",
    href: "/document-scanner",
    icon: Camera,
    title: "Document Scanner",
    desc: "Mobile-ready scan to PDF in your browser",
  },
] as const;

export function StudentEssentialsLinks({ className = "" }: { className?: string }) {
  return (
    <section className={className}>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          Verified for University Use
        </span>
        <span className="text-xs text-muted-foreground">Optimized for high-speed academic submissions</span>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">Student Essentials</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Built for students — free core tools &amp; private browser processing · PDFTrusted
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.slug}
              href={item.href}
              className="group flex flex-col gap-2 rounded-2xl border border-emerald-500/25 bg-card/90 p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Icon className="h-6 w-6" aria-hidden strokeWidth={1.75} />
              </span>
              <span className="font-semibold text-foreground group-hover:text-primary">{item.title}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{item.desc}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
