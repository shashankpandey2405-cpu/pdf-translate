import type { AppEnv } from "@/server/types";
import { deleteStagedKeysFromBucket } from "@/server/r2ImmediatePurge";

export function isEnhancedUserKey(userId: string, key: string, kind: "input" | "output"): boolean {
  const prefix = kind === "input" ? `enhanced/input/${userId}/` : `enhanced/output/${userId}/`;
  return key.startsWith(prefix);
}

export async function deleteEnhancedKeys(env: AppEnv, keys: string[]): Promise<number> {
  const unique = [...new Set(keys.filter(Boolean))];
  if (!unique.length) return 0;
  return deleteStagedKeysFromBucket(env, unique);
}
