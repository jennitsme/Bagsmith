import { NextRequest, NextResponse } from 'next/server';
import { appQueue } from '@/lib/jobs';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const job = await appQueue.getJob(id);
    if (!job) return NextResponse.json({ ok: false, error: 'Job not found' }, { status: 404 });

    const state = await job.getState();
    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        name: job.name,
        state,
        returnvalue: job.returnvalue ?? null,
        failedReason: job.failedReason ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to load job status' }, { status: 500 });
  }
}
