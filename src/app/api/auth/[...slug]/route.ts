import { NextResponse } from "next/server";
import { withSentryRoute } from "@/server/monitoring/withSentryRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy Auth.js removed — use Supabase Auth only. */
async function handle() {
  return NextResponse.json(
    {
      error: "legacy_auth_disabled",
      message: "Use Supabase Auth (/login). Legacy Auth.js has been removed from this deployment.",
    },
    { status: 410 },
  );
}

const wrapped = withSentryRoute("auth_legacy", handle);

export const GET = wrapped;
export const POST = wrapped;
export const PUT = wrapped;
export const PATCH = wrapped;
export const DELETE = wrapped;
export const HEAD = wrapped;
