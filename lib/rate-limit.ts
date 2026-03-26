import { getRedis } from '@/lib/redis';

const inMemoryBucket = new Map<string, { count: number; resetAt: number }>();

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs?: number;
};

function checkRateLimitInMemory(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const current = inMemoryBucket.get(key);

  if (!current || current.resetAt <= now) {
    inMemoryBucket.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  inMemoryBucket.set(key, current);
  return { ok: true, remaining: limit - current.count };
}

export async function checkRateLimit(key: string, limit = 20, windowMs = 60_000): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return checkRateLimitInMemory(key, limit, windowMs);

  const redisKey = `rl:${key}`;

  try {
    await redis.connect().catch(() => undefined);

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }

    if (count > limit) {
      const ttl = await redis.pttl(redisKey);
      return {
        ok: false,
        remaining: 0,
        retryAfterMs: ttl > 0 ? ttl : windowMs,
      };
    }

    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch {
    return checkRateLimitInMemory(key, limit, windowMs);
  }
}
