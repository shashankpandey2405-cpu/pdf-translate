import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isDebugRouteAllowed } from "@/server/security/debugAccess";
import { isProductionDeployment } from "@/server/qa/isQaMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_PATH = path.join(process.cwd(), "debug-f2fbc8.log");

export async function POST(req: Request) {
  if (!isDebugRouteAllowed(req)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  if (isProductionDeployment()) {
    return NextResponse.json({ ok: false, error: "file_log_disabled_in_production" }, { status: 403 });
  }
  try {
    const body = await req.json();
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(body)}\n`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
