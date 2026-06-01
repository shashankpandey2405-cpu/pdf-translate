import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function pathnameOnly(location: string): string {
  return location.split("?")[0].split("#")[0];
}

export default function ScrollToTop() {
  const [location] = useLocation();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const path = pathnameOnly(location);
    if (previousPath.current === path) return;
    previousPath.current = path;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);

  return null;
}
