import { createHash } from 'crypto';
import { getRedis } from '@/lib/redis';

const inMemoryLocks = new Map<string, number>();

function hashPayload(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function buildIdempotencyKey(parts: { scope: string; user: string; payload: unknown; explicitKey?: string | null }) {
  if (parts.explicitKey && parts.explicitKey.trim()) {
    return `idem:${parts.scope}:${parts.user}:${parts.explicitKey.trim().slice(0, 120)}`;
  }

  const digest = hashPayload(parts.payload).slice(0, 32);
  return `idem:${parts.scope}:${parts.user}:${digest}`;
}

export async function claimIdempotencyKey(key: string, ttlMs = 60_000) {
  const redis = getRedis();

  if (!redis) {
    const now = Date.now();
    const existing = inMemoryLocks.get(key);
    if (existing && existing > now) return false;
    inMemoryLocks.set(key, now + ttlMs);
    return true;
  }

  try {
    await redis.connect().catch(() => undefined);
    const result = await redis.set(key, '1', 'PX', ttlMs, 'NX');
    return result === 'OK';
  } catch {
    const now = Date.now();
    const existing = inMemoryLocks.get(key);
    if (existing && existing > now) return false;
    inMemoryLocks.set(key, now + ttlMs);
    return true;
  }
}
