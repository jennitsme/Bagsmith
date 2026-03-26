import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { prisma } from '@/lib/prisma';
import { createTokenLaunchTransaction } from '@/lib/bags-client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const app = await prisma.miniApp.findUnique({ where: { id: params.id } });
    if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const ipfs = String(body?.ipfs || '').trim();
    const tokenMint = String(body?.tokenMint || '').trim();
    const configKey = String(body?.configKey || '').trim();
    const initialBuyLamports = Number(body?.initialBuyLamports ?? 1000000);

    if (!ipfs || !tokenMint || !configKey || !Number.isFinite(initialBuyLamports) || initialBuyLamports <= 0) {
      return NextResponse.json({ ok: false, error: 'ipfs, tokenMint, configKey, and valid initialBuyLamports are required.' }, { status: 400 });
    }

    const launchTx = await createTokenLaunchTransaction({
      ipfs,
      tokenMint,
      wallet,
      initialBuyLamports,
      configKey,
    });

    await prisma.miniAppEvent.create({
      data: {
        appId: app.id,
        actorWallet: wallet,
        actionType: 'launch-test-token-tx',
        payloadJson: JSON.stringify({ ipfs, tokenMint, configKey, initialBuyLamports, launchTx }),
      },
    });

    return NextResponse.json({ ok: true, launchTx });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create test token launch tx' }, { status: 500 });
  }
}
