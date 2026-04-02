import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthWallet } from '@/lib/auth-wallet';

function normalizeScope(value: string | null): 'self' | 'global' {
  return value === 'global' ? 'global' : 'self';
}

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function allowGlobalAnalytics() {
  return process.env.BAGSMITH_ENABLE_GLOBAL_ANALYTICS === 'true';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = normalizeScope(searchParams.get('scope'));
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const offset = toInt(searchParams.get('offset'), 0);
    const limit = Math.min(100, Math.max(1, toInt(searchParams.get('limit'), 20)));

    const wallet = getAuthWallet(req);

    if (scope === 'global' && !allowGlobalAnalytics()) {
      return NextResponse.json({ ok: false, error: 'Global tx history disabled.' }, { status: 403 });
    }

    if (scope === 'self' && !wallet) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const where: any = { signature: { not: null } };
    if (scope === 'self') where.wallet = wallet;

    const all = await prisma.forgeRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        wallet: true,
        signature: true,
        mode: true,
        success: true,
        amount: true,
        inputMint: true,
        outputMint: true,
        createdAt: true,
      },
    });

    const filtered = q
      ? all.filter((tx) => [tx.signature, tx.inputMint, tx.outputMint, tx.wallet, tx.mode].some((v) => String(v || '').toLowerCase().includes(q)))
      : all;

    const sliced = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < filtered.length;

    return NextResponse.json({ ok: true, scope, total: filtered.length, offset, limit, hasMore, runs: sliced });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load tx history' }, { status: 500 });
  }
}
