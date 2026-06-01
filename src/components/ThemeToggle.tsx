import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (resolvedTheme || theme) : "light";
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-8 w-8 sm:h-9 sm:w-9 md:h-auto md:w-auto items-center justify-center rounded-xl md:rounded-2xl border border-border bg-card md:px-3 md:py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-primary/10 hover:border-primary"
      aria-label="Toggle Dark Mode"
      data-testid="button-theme-toggle"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" aria-hidden />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" aria-hidden />
      )}
    </button>
  );
}
