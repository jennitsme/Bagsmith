import { NextRequest, NextResponse } from 'next/server';

import { createFeeShareConfig } from '@/lib/bags-client';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';
import { assertAppOwnership } from '@/lib/app-authz';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const baseMint = String(body?.baseMint || '').trim();
    const claimersArray: string[] = Array.isArray(body?.claimersArray) ? body.claimersArray.map(String) : [];
    const basisPointsArray: number[] = Array.isArray(body?.basisPointsArray) ? body.basisPointsArray.map(Number) : [];

    if (!baseMint || claimersArray.length === 0 || basisPointsArray.length === 0) {
      return NextResponse.json({ ok: false, error: 'baseMint, claimersArray, basisPointsArray are required.' }, { status: 400 });
    }

    if (claimersArray.length !== basisPointsArray.length) {
      return NextResponse.json({ ok: false, error: 'claimersArray and basisPointsArray must have same length.' }, { status: 400 });
    }

    if (basisPointsArray.some((x) => !Number.isInteger(x) || x < 0)) {
      return NextResponse.json({ ok: false, error: 'basisPointsArray must contain non-negative integers.' }, { status: 400 });
    }

    const total = basisPointsArray.reduce((a, b) => a + b, 0);
    if (total !== 10000) {
      return NextResponse.json({ ok: false, error: 'basisPointsArray must sum to 10000.' }, { status: 400 });
    }

    let app;
    try {
      app = await assertAppOwnership(id, wallet);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized';
      if (msg === 'App not found') return NextResponse.json({ ok: false, error: 'App not found.' }, { status: 404 });
      if (msg.includes('Forbidden')) return NextResponse.json({ ok: false, error: msg }, { status: 403 });
      throw e;
    }

    const feeShare = await createFeeShareConfig({
      payer: wallet,
      baseMint,
      claimersArray,
      basisPointsArray,
    });

    await prisma.$transaction(async (tx) => {
      await tx.miniApp.update({
        where: { id },
        data: { status: 'fee-share-configured' },
      });

      await tx.miniAppEvent.create({
        data: {
          appId: app.id,
          actorWallet: wallet,
          actionType: 'fee-share-setup',
          payloadJson: JSON.stringify({ baseMint, claimersArray, basisPointsArray, feeShare }),
        },
      });
    });

    return NextResponse.json({ ok: true, feeShare });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed fee-share setup' }, { status: 500 });
  }
}
