import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const runs = await prisma.forgeRun.findMany({
      where: { signature: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        signature: true,
        mode: true,
        success: true,
        amount: true,
        inputMint: true,
        outputMint: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load tx history' }, { status: 500 });
  }
}
