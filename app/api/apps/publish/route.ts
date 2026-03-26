import { NextRequest, NextResponse } from 'next/server';
import { ensureUserId } from '@/lib/user-session';
import { getAuthWallet } from '@/lib/auth-wallet';
import { createMiniAppFromRun, type AppType } from '@/lib/mini-apps';
import { publishAppSchema, zodErrorMessage } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const { userId } = ensureUserId(req);
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const parsedBody = publishAppSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, error: zodErrorMessage(parsedBody.error) || 'Invalid request body' }, { status: 400 });
    }

    const { runId, title, type, description } = parsedBody.data as { runId: string; title: string; type: AppType; description?: string };

    const app = await createMiniAppFromRun({ userId, ownerWallet: wallet, runId, title, type, description });
    return NextResponse.json({ ok: true, app });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 });
  }
}
