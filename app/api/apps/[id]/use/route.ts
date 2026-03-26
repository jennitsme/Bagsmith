import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const app = await prisma.miniApp.update({
      where: { id: params.id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({ ok: true, appId: app.id, usageCount: app.usageCount });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to use app' }, { status: 500 });
  }
}
