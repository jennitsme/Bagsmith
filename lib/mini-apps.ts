import { prisma } from '@/lib/prisma';

export type AppType = 'referral' | 'gated-access' | 'tipping' | 'launch-campaign' | 'loyalty';

function deriveConfig(type: AppType, prompt: string) {
  if (type === 'referral') {
    return {
      rewardBps: 500,
      campaignDays: 30,
      antiAbuse: true,
      leaderboard: true,
      notes: prompt.slice(0, 180),
    };
  }

  if (type === 'gated-access') {
    return {
      nftCollection: 'REQUIRED_BY_OWNER',
      allowlistFallback: true,
      accessRule: 'holder-only',
      notes: prompt.slice(0, 180),
    };
  }

  if (type === 'tipping') {
    return {
      protocolFeeBps: 100,
      minimumTip: '1000',
      notes: prompt.slice(0, 180),
    };
  }

  return { notes: prompt.slice(0, 180) };
}

export async function createMiniAppFromRun(params: {
  userId: string;
  ownerWallet: string;
  runId: string;
  title: string;
  type: AppType;
  description?: string;
}) {
  const run = await prisma.forgeRun.findFirst({ where: { id: params.runId, userId: params.userId } });
  if (!run) throw new Error('Run not found for current user.');
  if (!run.success) throw new Error('Only successful runs can be published as apps.');

  const config = deriveConfig(params.type, run.prompt);

  return prisma.miniApp.create({
    data: {
      ownerUserId: params.userId,
      ownerWallet: params.ownerWallet,
      sourceRunId: run.id,
      title: params.title.slice(0, 80),
      type: params.type,
      description: (params.description || run.prompt).slice(0, 280),
      configJson: JSON.stringify(config),
      txProof: run.signature || null,
      feeShareBps: params.type === 'referral' ? 500 : params.type === 'tipping' ? 100 : 0,
      status: 'active',
    },
  });
}

export async function listPublicMiniApps() {
  return prisma.miniApp.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
}

export async function getMiniAppById(id: string) {
  return prisma.miniApp.findUnique({ where: { id } });
}
