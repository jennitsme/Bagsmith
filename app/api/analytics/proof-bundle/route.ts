import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/forge-logs';
import { ensureUserId } from '@/lib/user-session';

function normalizeRange(value: string | null): '24h' | '7d' | '30d' | 'all' {
  if (value === '24h' || value === '7d' || value === '30d' || value === 'all') return value;
  return '7d';
}

function normalizeScope(value: string | null): 'self' | 'global' {
  return value === 'global' ? 'global' : 'self';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = normalizeRange(searchParams.get('range'));
  const scope = normalizeScope(searchParams.get('scope'));
  const { userId } = ensureUserId(req);

  const summary = await getAnalyticsSummary(range, { userId, scope });
  const signatures = summary.all.filter((x) => x.success && x.signature).map((x) => x.signature);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    scope,
    range,
    totals: {
      totalRuns: summary.totalRuns,
      successfulRuns: summary.successfulRuns,
      executeRuns: summary.executeRuns,
      successfulExecutes: summary.successfulExecutes,
      successRate: summary.successRate,
      totalInputAmount: summary.totalInputAmount,
      signatureCount: signatures.length,
    },
    signatures,
    exportLinks: {
      analyticsCsv: `/api/analytics/export?range=${range}&scope=${scope}`,
      txHistoryCsv: `/api/integrations/bags/tx-history/export?scope=${scope}`,
    },
  });
}
