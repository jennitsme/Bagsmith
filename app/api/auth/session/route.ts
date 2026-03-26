import { NextRequest, NextResponse } from 'next/server';
import { attachUserCookie, ensureUserId } from '@/lib/user-session';

export async function GET(req: NextRequest) {
  const { userId, shouldSetCookie } = ensureUserId(req);
  const res = NextResponse.json({ ok: true, userId });
  if (shouldSetCookie) attachUserCookie(res, userId);
  return res;
}
