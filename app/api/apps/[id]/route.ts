import { NextRequest, NextResponse } from 'next/server';
import { getMiniAppById } from '@/lib/mini-apps';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const app = await getMiniAppById(params.id);
  if (!app) return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });
  return NextResponse.json({ ok: true, app });
}
