import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';
import { getClaimTransactionsV3 } from '@/lib/bags-client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const app = await prisma.miniApp.findUnique({ where: { id: params.id } });
    if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const payload = {
      claimerWallet: wallet,
      ...(body || {}),
    };

    const claimTx = await getClaimTransactionsV3(payload);

    await prisma.miniAppEvent.create({
      data: {
        appId: app.id,
        actorWallet: wallet,
        actionType: 'claim-fee-tx',
        payloadJson: JSON.stringify({ payload, claimTx }),
      },
    });

    return NextResponse.json({ ok: true, claimTx });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to get claim tx' }, { status: 500 });
  }
}
