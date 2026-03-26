import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/forge-logs';
import { ensureUserId, attachUserCookie } from '@/lib/user-session';

function normalizeRange(value: string | null): '24h' | '7d' | '30d' | 'all' {
  if (value === '24h' || value === '7d' || value === '30d' || value === 'all') return value;
  return 'all';
}

function normalizeScope(value: string | null): 'self' | 'global' {
  return value === 'global' ? 'global' : 'self';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = normalizeRange(searchParams.get('range'));
    const scope = normalizeScope(searchParams.get('scope'));
    const { userId, shouldSetCookie } = ensureUserId(req);

    const summary = await getAnalyticsSummary(range, { userId, scope });
    const res = NextResponse.json({ ok: true, userId, summary });
    if (shouldSetCookie) attachUserCookie(res, userId);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
