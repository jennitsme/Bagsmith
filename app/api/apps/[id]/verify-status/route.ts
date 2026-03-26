import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wallet = getAuthWallet(req);
    const app = await prisma.miniApp.findUnique({ where: { id: params.id } });
    if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });

    const events = await prisma.miniAppEvent.findMany({ where: { appId: app.id }, orderBy: { createdAt: 'desc' }, take: 100 });

    const hasFeeShareEvent = events.some((e) => e.actionType === 'fee-share-setup');
    const hasPartnerEvent = events.some((e) => e.actionType === 'partner-config-create');
    const hasClaimEvent = events.some((e) => e.actionType === 'claim-fee-tx');

    return NextResponse.json({
      ok: true,
      verification: {
        ownershipVerified: Boolean(wallet && wallet === app.ownerWallet),
        deploymentProofAvailable: Boolean(app.txProof),
        feeShareConfigured: app.status === 'fee-share-configured' || hasFeeShareEvent,
        partnerConfigCreated: hasPartnerEvent,
        claimFlowInitialized: hasClaimEvent,
        ownerWallet: app.ownerWallet,
        txProof: app.txProof,
        appStatus: app.status,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to verify app status' }, { status: 500 });
  }
}
