import { envString } from "@/server/env";
import { hasS3Credentials } from "@/server/s3";
import { getAppEnvSafe } from "@/server/env";
import { isRedisConnected } from "@/server/security/redisHealth";

export type EnvCheck = { ok: boolean; message?: string };

export type ProductionEnvReport = {
  ok: boolean;
  checks: Record<string, EnvCheck>;
};

function checkPresent(key: string, label?: string): EnvCheck {
  const v = envString(key);
  return v ? { ok: true } : { ok: false, message: `${label ?? key} is not set` };
}

export function validateProductionEnv(): ProductionEnvReport {
  const env = getAppEnvSafe();
  const checks: Record<string, EnvCheck> = {
    supabaseUrl: checkPresent("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnon: checkPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseService: checkPresent("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    appUrl: checkPresent("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_APP_URL"),
    cronSecret: checkPresent("CRON_SECRET", "CRON_SECRET"),
    workerSecret: checkPresent("RENDER_WORKER_SECRET", "RENDER_WORKER_SECRET"),
    redis: isRedisConnected()
      ? { ok: true }
      : {
          ok: false,
          message:
            "Redis not connected (set REDIS_URL or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)",
        },
    storage: hasS3Credentials(env)
      ? { ok: true }
      : { ok: false, message: "S3/R2 credentials missing (S3_BUCKET, S3_ACCESS_KEY_ID, …)" },
  };

  const enhanced =
    envString("NEXT_PUBLIC_ENHANCED_ENABLED") === "true" ||
    envString("VITE_ENHANCED_ENABLED") === "true";

  if (enhanced) {
    checks.enhancedCallback = checkPresent("ENHANCED_CALLBACK_URL", "ENHANCED_CALLBACK_URL");
  }

  const ok = Object.values(checks).every((c) => c.ok);
  return { ok, checks };
}
