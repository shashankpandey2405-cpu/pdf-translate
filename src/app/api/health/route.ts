import { validateProductionEnv } from "@/server/env/validateProduction";
import { isRedisConnected } from "@/server/security/redisHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const detailed = url.searchParams.get("detailed") === "1";
  const envReport = detailed ? validateProductionEnv() : null;

  return Response.json({
    ok: true,
    service: "pdftrusted-api",
    runtime: "nextjs-serverless",
    redis: isRedisConnected() ? "connected" : "unavailable",
    ...(detailed && envReport
      ? {
          productionReady: envReport.ok,
          checks: envReport.checks,
        }
      : {}),
  });
}
