import { Redis as UpstashRedis } from "@upstash/redis";
import Redis from "ioredis";
import { envString } from "@/server/env";
import { captureServerException } from "@/server/monitoring/capture";

export type QueueRedis = {
  lpush(key: string, value: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lrem(key: string, count: number, value: string): Promise<void>;
  llen(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number; nx?: boolean }): Promise<boolean>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  decrby(key: string, amount: number): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  del(key: string): Promise<void>;
  rpop(key: string): Promise<string | null>;
  /** Atomically move item from source to dest (queue claim). Falls back to rpop+lpush. */
  rpoplpush(source: string, destination: string): Promise<string | null>;
  zadd(key: string, entry: { score: number; member: string }): Promise<void>;
  zrange(key: string, min: number, max: number, opts?: { byScore?: boolean }): Promise<string[]>;
  zrem(key: string, member: string): Promise<void>;
};

let tcpClient: Redis | null = null;
let upstashClient: UpstashRedis | null = null;
let queueAdapter: QueueRedis | null = null;

function parseNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string" && val) return Number(val);
  return 0;
}

function wrapTcp(client: Redis): QueueRedis {
  return {
    async lpush(key, value) {
      await client.lpush(key, value);
    },
    async lrange(key, start, stop) {
      const items = await client.lrange(key, start, stop);
      return items ?? [];
    },
    async lrem(key, count, value) {
      await client.lrem(key, count, value);
    },
    async llen(key) {
      return (await client.llen(key)) ?? 0;
    },
    async get(key) {
      const val = await client.get(key);
      return val === null ? null : String(val);
    },
    async set(key, value, opts) {
      if (opts?.nx && opts?.ex) {
        const res = await client.set(key, value, "EX", opts.ex, "NX");
        return res === "OK";
      }
      if (opts?.nx) {
        const res = await client.set(key, value, "NX");
        return res === "OK";
      }
      if (opts?.ex) {
        await client.set(key, value, "EX", opts.ex);
      } else {
        await client.set(key, value);
      }
      return true;
    },
    async incr(key) {
      return (await client.incr(key)) ?? 0;
    },
    async decr(key) {
      return (await client.decr(key)) ?? 0;
    },
    async incrby(key, amount) {
      return (await client.incrby(key, amount)) ?? 0;
    },
    async decrby(key, amount) {
      return (await client.decrby(key, amount)) ?? 0;
    },
    async expire(key, seconds) {
      await client.expire(key, seconds);
    },
    async del(key) {
      await client.del(key);
    },
    async rpop(key) {
      const val = await client.rpop(key);
      return val === null ? null : String(val);
    },
    async rpoplpush(source, destination) {
      const val = await client.rpop(source);
      if (val === null) return null;
      await client.lpush(destination, val);
      return String(val);
    },
    async zadd(key, entry) {
      await client.zadd(key, entry.score, entry.member);
    },
    async zrange(key, min, max, opts) {
      if (opts?.byScore) {
        const items = await client.zrangebyscore(key, min, max);
        return (items ?? []).map(String);
      }
      const items = await client.zrange(key, min, max);
      return (items ?? []).map(String);
    },
    async zrem(key, member) {
      await client.zrem(key, member);
    },
  };
}

function wrapUpstash(client: UpstashRedis): QueueRedis {
  return {
    async lpush(key, value) {
      await client.lpush(key, value);
    },
    async lrange(key, start, stop) {
      const items = await client.lrange(key, start, stop);
      return (items ?? []).map(String);
    },
    async lrem(key, count, value) {
      await client.lrem(key, count, value);
    },
    async llen(key) {
      return (await client.llen(key)) ?? 0;
    },
    async get(key) {
      const val = await client.get<string>(key);
      return val === null || val === undefined ? null : String(val);
    },
    async set(key, value, opts) {
      if (opts?.nx) {
        const res = opts.ex
          ? await client.set(key, value, { nx: true, ex: opts.ex })
          : await client.set(key, value, { nx: true });
        return res === "OK";
      }
      if (opts?.ex) {
        await client.set(key, value, { ex: opts.ex });
      } else {
        await client.set(key, value);
      }
      return true;
    },
    async incr(key) {
      return parseNumber(await client.incr(key));
    },
    async decr(key) {
      return parseNumber(await client.decr(key));
    },
    async incrby(key, amount) {
      return parseNumber(await client.incrby(key, amount));
    },
    async decrby(key, amount) {
      return parseNumber(await client.decrby(key, amount));
    },
    async expire(key, seconds) {
      await client.expire(key, seconds);
    },
    async del(key) {
      await client.del(key);
    },
    async rpop(key) {
      const val = await client.rpop<string>(key);
      return val === null || val === undefined ? null : String(val);
    },
    async rpoplpush(source, destination) {
      const val = await client.rpop<string>(source);
      if (val === null || val === undefined) return null;
      await client.lpush(destination, val);
      return String(val);
    },
    async zadd(key, entry) {
      await client.zadd(key, { score: entry.score, member: entry.member });
    },
    async zrange(key, min, max, opts) {
      if (opts?.byScore) {
        const items = await client.zrange(key, min, max, { byScore: true });
        return (items ?? []).map(String);
      }
      const items = await client.zrange(key, min, max);
      return (items ?? []).map(String);
    },
    async zrem(key, member) {
      await client.zrem(key, member);
    },
  };
}

function getTcpClient(): Redis | null {
  const url = envString("REDIS_URL");
  if (!url) return null;
  const useTls = url.startsWith("rediss://");
  if (!tcpClient) {
    tcpClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 5_000,
      commandTimeout: 5_000,
      ...(useTls ? { tls: {} } : {}),
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2_000);
      },
      reconnectOnError(err) {
        const msg = err.message ?? "";
        return msg.includes("READONLY") || msg.includes("ECONNRESET");
      },
    });
    tcpClient.on("error", (err) => {
      console.error("[redis] tcp error:", err.message);
      captureServerException(err, {
        pipeline_stage: "redis_connect",
        queue_name: "shared",
        worker_name: "vercel_api",
      });
    });
  }
  return tcpClient;
}

function getUpstashClient(): UpstashRedis | null {
  const url = envString("UPSTASH_REDIS_REST_URL");
  const token = envString("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  if (!upstashClient) {
    upstashClient = new UpstashRedis({ url, token });
  }
  return upstashClient;
}

/** Prefer Railway Redis TCP (`REDIS_URL`); legacy Upstash REST as fallback during migration. */
export function getQueueRedis(): QueueRedis | null {
  if (queueAdapter) return queueAdapter;
  const tcp = getTcpClient();
  if (tcp) {
    queueAdapter = wrapTcp(tcp);
    return queueAdapter;
  }
  const upstash = getUpstashClient();
  if (upstash) {
    queueAdapter = wrapUpstash(upstash);
    return queueAdapter;
  }
  return null;
}

export function isRedisConfigured(): boolean {
  return Boolean(envString("REDIS_URL") || (envString("UPSTASH_REDIS_REST_URL") && envString("UPSTASH_REDIS_REST_TOKEN")));
}

export function redisBackend(): "tcp" | "upstash" | "none" {
  if (envString("REDIS_URL")) return "tcp";
  if (envString("UPSTASH_REDIS_REST_URL") && envString("UPSTASH_REDIS_REST_TOKEN")) return "upstash";
  return "none";
}
