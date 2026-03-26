import { NextRequest, NextResponse } from 'next/server';

import { createFeeShareConfig } from '@/lib/bags-client';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const baseMint = String(body?.baseMint || '').trim();
    const claimersArray = Array.isArray(body?.claimersArray) ? body.claimersArray.map(String) : [];
    const basisPointsArray = Array.isArray(body?.basisPointsArray) ? body.basisPointsArray.map(Number) : [];

    if (!baseMint || claimersArray.length === 0 || basisPointsArray.length === 0) {
      return NextResponse.json({ ok: false, error: 'baseMint, claimersArray, basisPointsArray are required.' }, { status: 400 });
    }

    const total = basisPointsArray.reduce((a, b) => a + b, 0);
    if (total !== 10000) {
      return NextResponse.json({ ok: false, error: 'basisPointsArray must sum to 10000.' }, { status: 400 });
    }

    const app = await prisma.miniApp.findUnique({ where: { id: params.id } });
    if (!app) return NextResponse.json({ ok: false, error: 'App not found.' }, { status: 404 });

    const feeShare = await createFeeShareConfig({
      payer: wallet,
      baseMint,
      claimersArray,
      basisPointsArray,
    });

    await prisma.miniApp.update({
      where: { id: params.id },
      data: { status: 'fee-share-configured' },
    });

    await prisma.miniAppEvent.create({
      data: {
        appId: app.id,
        actorWallet: wallet,
        actionType: 'fee-share-setup',
        payloadJson: JSON.stringify({ baseMint, claimersArray, basisPointsArray, feeShare }),
      },
    });

    return NextResponse.json({ ok: true, feeShare });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed fee-share setup' }, { status: 500 });
  }
}
