import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserId } from '@/lib/user-session';

function normalizeScope(value: string | null): 'self' | 'global' {
  return value === 'global' ? 'global' : 'self';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = normalizeScope(searchParams.get('scope'));
    const { userId } = ensureUserId(req);

    const where: any = { signature: { not: null } };
    if (scope === 'self') where.userId = userId;

    const runs = await prisma.forgeRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        userId: true,
        signature: true,
        mode: true,
        success: true,
        amount: true,
        inputMint: true,
        outputMint: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, scope, runs });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load tx history' }, { status: 500 });
  }
}
