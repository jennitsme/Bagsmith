import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lastTx = await prisma.forgeRun.findFirst({
      where: { signature: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { signature: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      status: {
        apiConnected: Boolean(process.env.BAGS_API_KEY),
        baseUrl: process.env.BAGS_API_BASE_URL || 'https://public-api-v2.bags.fm/api/v1',
        network: 'Bags Public API v2 (Solana)',
        lastTxSignature: lastTx?.signature || null,
        lastTxAt: lastTx?.createdAt || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load status' }, { status: 500 });
  }
}
