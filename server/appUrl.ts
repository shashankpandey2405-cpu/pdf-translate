import { envString } from "@/server/env";

/** Canonical app origin for OAuth, callbacks, and health checks. */
export function getAppBaseUrl(): string {
  const app = envString("NEXT_PUBLIC_APP_URL");
  if (app) return app.replace(/\/$/, "");
  const callback = envString("ENHANCED_CALLBACK_URL");
  if (callback) return callback.replace(/\/$/, "");
  const auth = envString("NEXTAUTH_URL") || envString("AUTH_URL");
  if (auth) return auth.replace(/\/$/, "");
  return "";
}
