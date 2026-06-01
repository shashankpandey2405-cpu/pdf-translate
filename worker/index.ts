/**
 * PDFTrusted Cloudflare Worker entry.
 *
 * Single Worker that:
 *   1. Routes all /api/* requests through Hono to the corresponding route module.
 *   2. Falls through any other request to the static-assets binding (the built Vite SPA).
 *
 * Asset fallthrough is handled at the top-level fetch handler (outside Hono) so the
 * Cloudflare-typed Request reaches env.ASSETS.fetch without DOM-type collisions.
 */

import { Hono } from "hono";
import type { ExportedHandler } from "@cloudflare/workers-types";
import type { Env } from "./env";

import authRoutes from "./routes/auth";
import accountRoutes from "./routes/account";
import r2Routes from "./routes/r2";
import multipartRoutes from "./routes/multipart";
import sentryTunnelRoutes from "./routes/sentry-tunnel";
import localeHintRoutes from "./routes/locale-hint";
import webhookRoutes from "./routes/webhooks";
import { purgeExpiredStagedObjects } from "./lib/r2StagingCleanup";

// -- /api router ------------------------------------------------------------
const api = new Hono<{ Bindings: Env }>();

api.route("/", authRoutes);            // /api/auth/*, /api/session
api.route("/", accountRoutes);          // /api/account-{register,forgot-password,reset-password}
api.route("/", sentryTunnelRoutes);     // /api/sentry-tunnel
api.route("/", localeHintRoutes);       // /api/locale-hint
api.route("/r2", r2Routes);             // /api/r2/presign-put
api.route("/multipart", multipartRoutes);   // /api/multipart/{init,sign-part,complete,abort}
api.route("/webhooks", webhookRoutes);  // /api/webhooks/lemon-squeezy

api.notFound((c) => c.json({ error: "not_found", path: c.req.path }, 404));

const app = new Hono<{ Bindings: Env }>();
app.route("/api", api);

// -- Cloudflare Worker fetch handler ---------------------------------------
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      // Hono needs the standards-DOM Request type; the structural shape is
      // identical, so a single `unknown` hop is enough to satisfy TS.
      return (await app.fetch(request as unknown as Request, env, ctx)) as unknown as ReturnType<typeof env.ASSETS.fetch> extends Promise<infer R> ? R : never;
    }
    return env.ASSETS.fetch(request);
  },
  scheduled(_event, env, ctx) {
    ctx.waitUntil(
      purgeExpiredStagedObjects(env).then((r) => {
        console.log("[pdftrusted] r2 staging purge", r);
      }),
    );
  },
} satisfies ExportedHandler<Env>;
