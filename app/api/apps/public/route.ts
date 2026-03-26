import { NextResponse } from 'next/server';
import { getPublicRuns } from '@/lib/forge-logs';

export async function GET() {
  const runs = await getPublicRuns(50);
  return NextResponse.json({ ok: true, runs });
}
