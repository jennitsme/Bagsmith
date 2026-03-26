import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserId } from '@/lib/user-session';

function normalizeScope(value: string | null): 'self' | 'global' {
  return value === 'global' ? 'global' : 'self';
}

function toCsv(rows: any[]) {
  const header = ['id', 'userId', 'signature', 'mode', 'success', 'amount', 'inputMint', 'outputMint', 'createdAt'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = normalizeScope(searchParams.get('scope'));
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const { userId } = ensureUserId(req);

    const where: any = { signature: { not: null } };
    if (scope === 'self') where.userId = userId;

    const all = await prisma.forgeRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    const filtered = q
      ? all.filter((tx) =>
          [tx.signature, tx.inputMint, tx.outputMint, tx.userId, tx.mode]
            .some((v) => String(v || '').toLowerCase().includes(q))
        )
      : all;

    const csv = toCsv(filtered.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bags-tx-history-${scope}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to export tx history' }, { status: 500 });
  }
}
