import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const appQueue = new Queue('bagsmith-app-jobs', {
  connection: redisConnection,
});

export type AppJobName = 'verify-refresh' | 'partner-status-refresh' | 'claim-status-refresh';

export async function enqueueAppJob(name: AppJobName, data: Record<string, unknown>) {
  return appQueue.add(name, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}
