import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || '';

let redisSingleton: IORedis | null = null;

export function getRedis(): IORedis | null {
  if (!redisUrl) return null;
  if (redisSingleton) return redisSingleton;

  redisSingleton = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisSingleton.on('error', () => {
    // swallow runtime redis errors; callers should handle null/throws gracefully
  });

  return redisSingleton;
}
