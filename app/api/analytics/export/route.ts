import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, logsToCsv } from '@/lib/forge-logs';

function normalizeRange(value: string | null): '24h' | '7d' | '30d' | 'all' {
  if (value === '24h' || value === '7d' || value === '30d' || value === 'all') return value;
  return 'all';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = normalizeRange(searchParams.get('range'));
    const summary = await getAnalyticsSummary(range);
    const csv = logsToCsv(summary.all);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bagsmith-analytics-${range}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
