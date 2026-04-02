import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, logsToCsv } from '@/lib/forge-logs';
import { getAuthWallet } from '@/lib/auth-wallet';

function normalizeRange(value: string | null): '24h' | '7d' | '30d' | 'all' {
  if (value === '24h' || value === '7d' || value === '30d' || value === 'all') return value;
  return 'all';
}

function normalizeScope(value: string | null): 'self' | 'global' {
  return value === 'global' ? 'global' : 'self';
}

function allowGlobalAnalytics() {
  return process.env.BAGSMITH_ENABLE_GLOBAL_ANALYTICS === 'true';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = normalizeRange(searchParams.get('range'));
    const scope = normalizeScope(searchParams.get('scope'));
    const wallet = getAuthWallet(req);

    if (scope === 'global' && !allowGlobalAnalytics()) {
      return NextResponse.json({ ok: false, error: 'Global analytics disabled.' }, { status: 403 });
    }

    if (scope === 'self' && !wallet) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getAnalyticsSummary(range, { wallet: wallet || undefined, scope });
    const csv = logsToCsv(summary.all);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bagsmith-analytics-${scope}-${range}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
