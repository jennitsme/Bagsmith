import { prisma } from '@/lib/prisma';

export async function computeVerification(appId: string, wallet?: string | null) {
  const app = await prisma.miniApp.findUnique({ where: { id: appId } });
  if (!app) throw new Error('App not found');

  const events = await prisma.miniAppEvent.findMany({ where: { appId }, orderBy: { createdAt: 'desc' }, take: 200 });

  const hasFeeShareEvent = events.some((e) => e.actionType === 'fee-share-setup');
  const hasPartnerEvent = events.some((e) => e.actionType === 'partner-config-create');
  const hasClaimEvent = events.some((e) => e.actionType === 'claim-fee-tx');

  return {
    ownershipVerified: Boolean(wallet && wallet === app.ownerWallet),
    deploymentProofAvailable: Boolean(app.txProof),
    feeShareConfigured: app.status === 'fee-share-configured' || hasFeeShareEvent,
    partnerConfigCreated: hasPartnerEvent,
    claimFlowInitialized: hasClaimEvent,
    ownerWallet: app.ownerWallet,
    txProof: app.txProof,
    appStatus: app.status,
  };
}
