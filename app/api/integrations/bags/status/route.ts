import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBagsApiHealth } from '@/lib/bags-client';
import { validateRuntimeEnv } from '@/lib/env';

export async function GET() {
  const baseUrl = process.env.BAGS_API_BASE_URL || 'https://public-api-v2.bags.fm/api/v1';
  const hasApiKey = Boolean(process.env.BAGS_API_KEY);

  let lastTxSignature: string | null = null;
  let lastTxAt: string | null = null;
  let dbError: string | null = null;

  try {
    const lastTx = await prisma.forgeRun.findFirst({
      where: { signature: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { signature: true, createdAt: true },
    });

    lastTxSignature = lastTx?.signature || null;
    lastTxAt = lastTx?.createdAt?.toISOString?.() || null;
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'DB status check failed';
  }

  let health: { ok: boolean; latencyMs?: number; quoteAvailable?: boolean; error?: string } = { ok: false };
  if (hasApiKey) {
    try {
      const h = await checkBagsApiHealth();
      health = { ok: h.ok, latencyMs: h.latencyMs, quoteAvailable: h.quoteAvailable };
    } catch (error) {
      health = { ok: false, error: error instanceof Error ? error.message : 'Health check failed' };
    }
  } else {
    health = { ok: false, error: 'Missing BAGS_API_KEY' };
  }

  const env = validateRuntimeEnv();

  return NextResponse.json({
    ok: true,
    status: {
      apiConnected: Boolean(health.ok),
      baseUrl,
      network: 'Bags Public API v2 (Solana)',
      health,
      lastTxSignature,
      lastTxAt,
      dbError,
      env,
    },
  });
}
