import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { computeVerification } from '@/lib/verification';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wallet = getAuthWallet(req);
    const verification = await computeVerification(params.id, wallet);
    return NextResponse.json({ ok: true, verification });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to verify app status' }, { status: 500 });
  }
}
