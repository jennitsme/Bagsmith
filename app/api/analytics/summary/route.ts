import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/forge-logs';

export async function GET() {
  try {
    const summary = await getAnalyticsSummary();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
