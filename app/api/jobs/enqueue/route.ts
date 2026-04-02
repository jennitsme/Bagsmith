import { NextRequest, NextResponse } from 'next/server';
import { enqueueAppJob, type AppJobName } from '@/lib/jobs';
import { getAuthWallet } from '@/lib/auth-wallet';
import { assertAppOwnership } from '@/lib/app-authz';
import { checkRateLimit } from '@/lib/rate-limit';

function isJobName(v: string): v is AppJobName {
  return v === 'verify-refresh' || v === 'partner-status-refresh' || v === 'claim-status-refresh';
}

export async function POST(req: NextRequest) {
  try {
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || '');
    const appId = String(body?.appId || '');
    if (!isJobName(name)) return NextResponse.json({ ok: false, error: 'Invalid job name' }, { status: 400 });
    if (!appId) return NextResponse.json({ ok: false, error: 'appId is required' }, { status: 400 });

    const rl = await checkRateLimit(`jobs-enqueue:${wallet}:${appId}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
    }

    try {
      await assertAppOwnership(appId, wallet);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized';
      if (msg === 'App not found') return NextResponse.json({ ok: false, error: 'App not found' }, { status: 404 });
      if (msg.includes('Forbidden')) return NextResponse.json({ ok: false, error: msg }, { status: 403 });
      throw e;
    }

    const job = await enqueueAppJob(name, { appId, requestedBy: wallet });
    return NextResponse.json({ ok: true, jobId: job.id, name: job.name });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to enqueue job' }, { status: 500 });
  }
}
