import { NextResponse } from 'next/server';
import { clearAuthWallet } from '@/lib/auth-wallet';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthWallet(res);
  return res;
}
