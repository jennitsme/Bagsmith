import { NextResponse } from 'next/server';
import { listPublicMiniApps } from '@/lib/mini-apps';

export async function GET() {
  const apps = await listPublicMiniApps();
  return NextResponse.json({ ok: true, apps });
}
