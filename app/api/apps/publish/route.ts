import { NextRequest, NextResponse } from 'next/server';
import { ensureUserId } from '@/lib/user-session';
import { getAuthWallet } from '@/lib/auth-wallet';
import { createMiniAppFromRun, type AppType } from '@/lib/mini-apps';

export async function POST(req: NextRequest) {
  try {
    const { userId } = ensureUserId(req);
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const runId = String(body?.runId || '');
    const title = String(body?.title || '').trim();
    const type = String(body?.type || '').trim() as AppType;
    const description = typeof body?.description === 'string' ? body.description : undefined;

    if (!runId || !title || !type) {
      return NextResponse.json({ ok: false, error: 'runId, title, and type are required' }, { status: 400 });
    }

    const app = await createMiniAppFromRun({ userId, ownerWallet: wallet, runId, title, type, description });
    return NextResponse.json({ ok: true, app });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 });
  }
}
