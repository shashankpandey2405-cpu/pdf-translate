import { useEffect, useState } from "react";

/** True after the first client commit — use to gate browser-only UI and avoid SSR mismatches. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
