import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'bagsmith_uid';

function makeUserId() {
  return `u_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`;
}

export function getUserIdFromRequest(req: NextRequest): string | null {
  const uid = req.cookies.get(COOKIE_NAME)?.value;
  return uid && uid.trim() ? uid.trim() : null;
}

export function ensureUserId(req: NextRequest): { userId: string; shouldSetCookie: boolean } {
  const existing = getUserIdFromRequest(req);
  if (existing) return { userId: existing, shouldSetCookie: false };
  return { userId: makeUserId(), shouldSetCookie: true };
}

export function attachUserCookie(res: NextResponse, userId: string) {
  res.cookies.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
