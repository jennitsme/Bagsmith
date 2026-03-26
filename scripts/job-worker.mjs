import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });

async function computeVerification(appId) {
  const app = await prisma.miniApp.findUnique({ where: { id: appId } });
  if (!app) throw new Error('App not found');

  const events = await prisma.miniAppEvent.findMany({ where: { appId }, orderBy: { createdAt: 'desc' }, take: 200 });
  const hasFeeShareEvent = events.some((e) => e.actionType === 'fee-share-setup');
  const hasPartnerEvent = events.some((e) => e.actionType === 'partner-config-create');
  const hasClaimEvent = events.some((e) => e.actionType === 'claim-fee-tx');

  return {
    ownershipVerified: false,
    deploymentProofAvailable: Boolean(app.txProof),
    feeShareConfigured: app.status === 'fee-share-configured' || hasFeeShareEvent,
    partnerConfigCreated: hasPartnerEvent,
    claimFlowInitialized: hasClaimEvent,
    ownerWallet: app.ownerWallet,
    txProof: app.txProof,
    appStatus: app.status,
  };
}

const worker = new Worker(
  'bagsmith-app-jobs',
  async (job) => {
    const appId = job.data?.appId;
    if (!appId) throw new Error('appId is required in job data');

    if (job.name === 'verify-refresh') {
      const verification = await computeVerification(appId);
      await prisma.miniAppEvent.create({
        data: {
          appId,
          actorWallet: null,
          actionType: 'verification-refresh-job',
          payloadJson: JSON.stringify({ verification }),
        },
      });
      return { verification };
    }

    if (job.name === 'partner-status-refresh' || job.name === 'claim-status-refresh') {
      await prisma.miniAppEvent.create({
        data: {
          appId,
          actorWallet: null,
          actionType: `${job.name}-job`,
          payloadJson: JSON.stringify({ ok: true }),
        },
      });
      return { ok: true };
    }

    throw new Error(`Unknown job: ${job.name}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`[worker] completed ${job.id} ${job.name}`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] failed ${job?.id} ${job?.name}`, err?.message);
});

console.log('[worker] bagsmith-app-jobs worker started');
