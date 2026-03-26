import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { getOrCreateSettings, updateSettings } from '@/lib/user-profiles';

export async function GET(req: NextRequest) {
  const wallet = getAuthWallet(req);
  if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const settings = await getOrCreateSettings(wallet);
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  const wallet = getAuthWallet(req);
  if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const settings = await updateSettings(wallet, body || {});
  return NextResponse.json({ ok: true, settings });
}
