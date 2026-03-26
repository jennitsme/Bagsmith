import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';
import { createPartnerConfigCreationTx } from '@/lib/bags-client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const app = await prisma.miniApp.findUnique({ where: { id: params.id } });
    if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });

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
