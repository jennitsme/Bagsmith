import { NextRequest, NextResponse } from 'next/server';
import { enqueueAppJob, type AppJobName } from '@/lib/jobs';

function isJobName(v: string): v is AppJobName {
  return v === 'verify-refresh' || v === 'partner-status-refresh' || v === 'claim-status-refresh';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || '');
    const appId = String(body?.appId || '');
    if (!isJobName(name)) return NextResponse.json({ ok: false, error: 'Invalid job name' }, { status: 400 });
    if (!appId) return NextResponse.json({ ok: false, error: 'appId is required' }, { status: 400 });

    const job = await enqueueAppJob(name, { appId });
    return NextResponse.json({ ok: true, jobId: job.id, name: job.name });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to enqueue job' }, { status: 500 });
  }
}
