import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { ensureUserId, attachUserCookie } from '@/lib/user-session';

export async function GET(req: NextRequest) {
  const wallet = getAuthWallet(req);
  const { userId, shouldSetCookie } = ensureUserId(req);
  const res = NextResponse.json({ ok: true, wallet, userId, authenticated: Boolean(wallet) });
  if (shouldSetCookie) attachUserCookie(res, userId);
  return res;
}
