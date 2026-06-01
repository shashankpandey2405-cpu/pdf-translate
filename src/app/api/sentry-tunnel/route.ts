import { getAppEnv } from "@/server/types";
import { val } from "@/server/strings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDsn(dsn: string) {
  const url = new URL(dsn);
  const publicKey = url.username;
  const host = url.host;
  const projectId = url.pathname.replace(/^\//, "");
  if (!publicKey || !host || !projectId) {
    throw new Error("Invalid Sentry DSN");
  }
  return { publicKey, host, projectId };
}

function resolveServerDsn(): string | undefined {
  const env = getAppEnv();
  return (
    val(env.SENTRY_DSN) ??
    val(env.VITE_SENTRY_DSN) ??
    (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined)
  );
}

function envelopeMatchesDsn(envelopeDsn: string, serverDsn: string): boolean {
  if (envelopeDsn.trim() === serverDsn.trim()) return true;
  try {
    const a = parseDsn(envelopeDsn);
    const b = parseDsn(serverDsn);
    return a.host === b.host && a.projectId === b.projectId && a.publicKey === b.publicKey;
  } catch {
    return false;
  }
}

/** Accept Sentry envelopes from our client and forward to ingest (ad-blocker tunnel). */
export async function POST(req: Request) {
  const serverDsn = resolveServerDsn();
  if (!serverDsn) {
    return new Response(null, { status: 204 });
  }

  try {
    const envelope = await req.text();
    if (!envelope.trim()) {
      return new Response(null, { status: 204 });
    }

    const headerLine = envelope.split("\n")[0];
    if (!headerLine) {
      return new Response(null, { status: 204 });
    }

    let header: { dsn?: string };
    try {
      header = JSON.parse(headerLine) as { dsn?: string };
    } catch {
      return new Response(null, { status: 204 });
    }

    if (header.dsn && !envelopeMatchesDsn(header.dsn, serverDsn)) {
      return new Response(null, { status: 204 });
    }

    const { publicKey, host, projectId } = parseDsn(serverDsn);
    const ingestUrl = `https://${host}/api/${projectId}/envelope/`;
    const response = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: envelope,
    });

    // Avoid surfacing ingest 400s in the browser console (misconfig / replay noise).
    if (!response.ok) {
      return new Response(null, { status: 204 });
    }

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
