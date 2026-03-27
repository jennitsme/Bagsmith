import { NextRequest, NextResponse } from 'next/server';
import { getMiniAppById } from '@/lib/mini-apps';

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const app = await getMiniAppById(id);
  if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });
  return NextResponse.json({ ok: true, app });
}
