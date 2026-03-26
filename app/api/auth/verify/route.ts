import { NextRequest, NextResponse } from 'next/server';
import { clearNonce, getNonce, setAuthWallet, verifyWalletSignature } from '@/lib/auth-wallet';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = String(body?.wallet || '');
    const message = String(body?.message || '');
    const signature = String(body?.signature || '');

    const nonce = getNonce(req);
    if (!nonce) return NextResponse.json({ ok: false, error: 'Missing auth nonce.' }, { status: 400 });

    const expected = `Bagsmith Sign-In\nNonce: ${nonce}`;
    if (message !== expected) {
      return NextResponse.json({ ok: false, error: 'Invalid sign-in message.' }, { status: 400 });
    }

    const valid = verifyWalletSignature({ wallet, message, signatureBase58: signature });
    if (!valid) return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 401 });

    const res = NextResponse.json({ ok: true, wallet });
    setAuthWallet(res, wallet);
    clearNonce(res);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
