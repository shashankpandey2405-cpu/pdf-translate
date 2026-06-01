import { rateLimitGet, rateLimitIncr } from "@/server/enhanced/redis";

const REGISTER_HOURLY_IP = 8;
const FORGOT_HOURLY_IP = 6;
const FORGOT_HOURLY_EMAIL = 3;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function assertAccountRegisterRateLimit(
  req: Request,
): Promise<{ allowed: true } | { allowed: false }> {
  const ip = clientIp(req);
  const key = `ratelimit:account:register:hour:${ip}`;
  const current = await rateLimitGet(key);
  if (current >= REGISTER_HOURLY_IP) return { allowed: false };
  await rateLimitIncr(key, 3600);
  return { allowed: true };
}

export async function assertForgotPasswordRateLimit(
  req: Request,
  email: string,
): Promise<{ allowed: true } | { allowed: false }> {
  const ip = clientIp(req);
  const ipKey = `ratelimit:account:forgot:hour:${ip}`;
  const emailKey = `ratelimit:account:forgot:email:${email.toLowerCase()}`;
  const ipCount = await rateLimitGet(ipKey);
  const emailCount = await rateLimitGet(emailKey);
  if (ipCount >= FORGOT_HOURLY_IP || emailCount >= FORGOT_HOURLY_EMAIL) {
    return { allowed: false };
  }
  await rateLimitIncr(ipKey, 3600);
  await rateLimitIncr(emailKey, 3600);
  return { allowed: true };
}
