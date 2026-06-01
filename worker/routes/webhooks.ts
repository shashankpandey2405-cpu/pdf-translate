/**
 * PayPal webhooks are handled by Next.js at /api/webhooks/paypal.
 * This route returns 410 so legacy Worker mounts do not accept stale Lemon URLs.
 */

import { Hono } from "hono";

const app = new Hono();

app.post("/lemon-squeezy", (c) =>
  c.json({ error: "removed", message: "Use /api/webhooks/paypal on the Next.js app." }, 410),
);

app.post("/paypal", (c) =>
  c.json({ error: "use_next_app", message: "Configure PayPal webhook → /api/webhooks/paypal" }, 410),
);

export default app;
