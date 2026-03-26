import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet, getAuthExpiry } from '@/lib/auth-wallet';
import { ensureUserId, attachUserCookie } from '@/lib/user-session';

export async function GET(req: NextRequest) {
  const wallet = getAuthWallet(req);
  const expiresAt = getAuthExpiry(req);
  const { userId, shouldSetCookie } = ensureUserId(req);
  const now = Date.now();
  const expiresInSec = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;

  const res = NextResponse.json({
    ok: true,
    wallet,
    userId,
    authenticated: Boolean(wallet),
    verifiedWalletSession: Boolean(wallet),
    expiresAt,
    expiresInSec,
  });
  if (shouldSetCookie) attachUserCookie(res, userId);
  return res;
}
