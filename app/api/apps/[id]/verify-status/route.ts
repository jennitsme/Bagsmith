import { NextRequest, NextResponse } from 'next/server';
import { getAuthWallet } from '@/lib/auth-wallet';
import { computeVerification } from '@/lib/verification';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const wallet = getAuthWallet(req);
    const verification = await computeVerification(id, wallet);
    return NextResponse.json({ ok: true, verification });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to verify app status' }, { status: 500 });
  }
}
