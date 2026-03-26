import { NextRequest, NextResponse } from 'next/server';
import { ensureUserId } from '@/lib/user-session';
import { publishRun } from '@/lib/forge-logs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = ensureUserId(req);
    const body = await req.json();
    const runId = String(body?.runId || '');
    const title = typeof body?.title === 'string' ? body.title : undefined;
    if (!runId) return NextResponse.json({ ok: false, error: 'runId is required' }, { status: 400 });

    const run = await publishRun(runId, userId, title);
    return NextResponse.json({ ok: true, run });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 });
  }
}
