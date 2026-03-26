import { NextRequest, NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

const NONCE_COOKIE = 'bagsmith_nonce';
const AUTH_COOKIE = 'bagsmith_wallet';

export function makeNonce() {
  return crypto.randomUUID().replace(/-/g, '');
}

export function setNonceCookie(res: NextResponse, nonce: string) {
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 10,
  });
}

export function getNonce(req: NextRequest) {
  return req.cookies.get(NONCE_COOKIE)?.value || null;
}

export function clearNonce(res: NextResponse) {
  res.cookies.set(NONCE_COOKIE, '', { path: '/', maxAge: 0 });
}

export function setAuthWallet(res: NextResponse, wallet: string) {
  res.cookies.set(AUTH_COOKIE, wallet, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthWallet(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 });
}

export function getAuthWallet(req: NextRequest) {
  return req.cookies.get(AUTH_COOKIE)?.value || null;
}

export function verifyWalletSignature(params: { wallet: string; message: string; signatureBase58: string }) {
  const pubkey = new PublicKey(params.wallet);
  const sig = bs58.decode(params.signatureBase58);
  const msgBytes = new TextEncoder().encode(params.message);
  const ok = nacl.sign.detached.verify(msgBytes, sig, pubkey.toBytes());
  return ok;
}
