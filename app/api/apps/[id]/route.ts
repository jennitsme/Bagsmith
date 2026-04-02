import { NextRequest, NextResponse } from 'next/server';
import { getMiniAppById } from '@/lib/mini-apps';
import { getAuthWallet } from '@/lib/auth-wallet';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const app = await getMiniAppById(id);
  if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });

  const wallet = getAuthWallet(req);
  const isOwner = Boolean(wallet && wallet === app.ownerWallet);

  if (!app.isPublic && !isOwner) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  if (isOwner) {
    return NextResponse.json({ ok: true, app });
  }

  return NextResponse.json({
    ok: true,
    app: {
      id: app.id,
      title: app.title,
      type: app.type,
      description: app.description,
      txProof: app.txProof,
      feeShareBps: app.feeShareBps,
      status: app.status,
      usageCount: app.usageCount,
      ownerWallet: app.ownerWallet,
      isPublic: app.isPublic,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    },
  });
}
