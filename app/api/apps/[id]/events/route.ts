import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthWallet } from '@/lib/auth-wallet';

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const app = await prisma.miniApp.findUnique({ where: { id } });
    if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });

    const wallet = getAuthWallet(req);
    const isOwner = Boolean(wallet && wallet === app.ownerWallet);

    if (!app.isPublic && !isOwner) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, toInt(searchParams.get('limit'), 30)));

    const events = await prisma.miniAppEvent.findMany({
      where: { appId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const safeEvents = isOwner
      ? events
      : events.map((e) => ({
          id: e.id,
          appId: e.appId,
          actorWallet: e.actorWallet,
          actionType: e.actionType,
          createdAt: e.createdAt,
        }));

    return NextResponse.json({ ok: true, isOwner, total: safeEvents.length, events: safeEvents });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load events' }, { status: 500 });
  }
}
