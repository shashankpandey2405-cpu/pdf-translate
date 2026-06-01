import { useEffect } from "react";
import { useLocation } from "wouter";
import { setRouteTags } from "@/utils/logger";

/** Keeps Sentry + GA route context aligned with Wouter (locale-prefixed paths). */
export function MonitoringRouteListener() {
  const [location] = useLocation();

  useEffect(() => {
    setRouteTags(location || "/");
  }, [location]);

  return null;
}
