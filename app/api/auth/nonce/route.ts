import { NextResponse } from 'next/server';
import { makeNonce, setNonceCookie } from '@/lib/auth-wallet';

export async function GET() {
  const nonce = makeNonce();
  const message = `Bagsmith Sign-In\nNonce: ${nonce}`;
  const res = NextResponse.json({ ok: true, nonce, message });
  setNonceCookie(res, nonce);
  return res;
}
