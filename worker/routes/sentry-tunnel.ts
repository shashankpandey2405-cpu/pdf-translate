/**
 * /api/sentry-tunnel — relays Sentry envelopes server-side so client ad-blockers
 * can't break error reporting. Reads the DSN from SENTRY_DSN or VITE_SENTRY_DSN.
 */

import { Hono } from "hono";
import type { Env } from "../env";
import { val } from "../env";

const app = new Hono<{ Bindings: Env }>();

function parseDsn(dsn: string) {
  const url = new URL(dsn);
  const publicKey = url.username;
  const host = url.host;
  const projectId = url.pathname.replace("/", "");
  if (!publicKey || !host || !projectId) {
    throw new Error("Invalid Sentry DSN");
  }
  return { publicKey, host, projectId };
}

app.post("/sentry-tunnel", async (c) => {
  const dsn = val(c.env.SENTRY_DSN) ?? val(c.env.VITE_SENTRY_DSN);
  if (!dsn) {
    return new Response(null, { status: 204 });
  }

  try {
    const envelope = await c.req.text();
    const { publicKey, host, projectId } = parseDsn(dsn);
    const ingestUrl = `https://${host}/api/${projectId}/envelope/`;
    const response = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: envelope,
    });
    return new Response(null, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sentry tunnel failed";
    return c.json({ error: message }, 500);
  }
});

export default app;
