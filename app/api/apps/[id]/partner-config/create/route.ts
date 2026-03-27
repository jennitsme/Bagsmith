import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';
import { createPartnerConfigCreationTx } from '@/lib/bags-client';
import { assertAppOwnership } from '@/lib/app-authz';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    let app;
    try {
      app = await assertAppOwnership(id, wallet);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized';
      if (msg === 'App not found') return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });
      if (msg.includes('Forbidden')) return NextResponse.json({ ok: false, error: msg }, { status: 403 });
      throw e;
    }

    const tx = await createPartnerConfigCreationTx({ partnerWallet: wallet });

    await prisma.miniAppEvent.create({
      data: {
        appId: app.id,
        actorWallet: wallet,
        actionType: 'partner-config-create',
        payloadJson: JSON.stringify({ tx }),
      },
    });

    return NextResponse.json({ ok: true, tx });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create partner config tx' }, { status: 500 });
  }
}
