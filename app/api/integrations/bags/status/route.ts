import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBagsApiHealth } from '@/lib/bags-client';

export async function GET() {
  try {
    const lastTx = await prisma.forgeRun.findFirst({
      where: { signature: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { signature: true, createdAt: true },
    });

    const baseUrl = process.env.BAGS_API_BASE_URL || 'https://public-api-v2.bags.fm/api/v1';
    const hasApiKey = Boolean(process.env.BAGS_API_KEY);

    let health: { ok: boolean; latencyMs?: number; quoteAvailable?: boolean; error?: string } = { ok: false };
    if (hasApiKey) {
      try {
        const h = await checkBagsApiHealth();
        health = { ok: h.ok, latencyMs: h.latencyMs, quoteAvailable: h.quoteAvailable };
      } catch (e) {
        health = { ok: false, error: e instanceof Error ? e.message : 'Health check failed' };
      }
    } else {
      health = { ok: false, error: 'Missing BAGS_API_KEY' };
    }

    return NextResponse.json({
      ok: true,
      status: {
        apiConnected: health.ok,
        baseUrl,
        network: 'Bags Public API v2 (Solana)',
        health,
        lastTxSignature: lastTx?.signature || null,
        lastTxAt: lastTx?.createdAt || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load status' }, { status: 500 });
  }
}
