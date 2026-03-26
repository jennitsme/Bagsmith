import { prisma } from '@/lib/prisma';
import { generateStructuredConfig } from '@/lib/app-config-generator';

export type AppType = 'referral' | 'gated-access' | 'tipping' | 'launch-campaign' | 'loyalty';

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

  const config = generateStructuredConfig(params.type, run.prompt);

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
