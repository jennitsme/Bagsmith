import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { getOrCreateProfile, updateProfile } from '@/lib/user-profiles';

export async function GET(req: NextRequest) {
  const wallet = getAuthWallet(req);
  if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const profile = await getOrCreateProfile(wallet);
  return NextResponse.json({ ok: true, profile });
}

export async function PUT(req: NextRequest) {
  const wallet = getAuthWallet(req);
  if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const displayName = typeof body?.displayName === 'string' ? body.displayName : undefined;
  const bio = typeof body?.bio === 'string' ? body.bio : undefined;
  const avatarUrl = typeof body?.avatarUrl === 'string' ? body.avatarUrl : undefined;

  const profile = await updateProfile(wallet, { displayName, bio, avatarUrl });
  return NextResponse.json({ ok: true, profile });
}
