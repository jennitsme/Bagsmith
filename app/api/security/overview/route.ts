import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/redis';
import { checkBagsApiHealth } from '@/lib/bags-client';

type Check = {
  name: string;
  status: 'passed' | 'active' | 'warning';
  desc: string;
};

export async function GET() {
  const checks: Check[] = [];

  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'Database Connectivity', status: 'passed', desc: 'Postgres reachable and queryable.' });
  } catch (error) {
    checks.push({
      name: 'Database Connectivity',
      status: 'warning',
      desc: `Postgres check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Redis check
  try {
    const redis = getRedis();
    if (!redis) {
      checks.push({ name: 'Rate Limit Backend', status: 'warning', desc: 'REDIS_URL not set. Falling back to in-memory limiter.' });
    } else {
      await redis.connect().catch(() => undefined);
      const pong = await redis.ping();
      if (pong === 'PONG') {
        checks.push({ name: 'Rate Limit Backend', status: 'active', desc: 'Redis available for rate limit + idempotency.' });
      } else {
        checks.push({ name: 'Rate Limit Backend', status: 'warning', desc: 'Redis ping did not return PONG.' });
      }
    }
  } catch (error) {
    checks.push({
      name: 'Rate Limit Backend',
      status: 'warning',
      desc: `Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Bags API health
  const hasApiKey = Boolean(process.env.BAGS_API_KEY);
  if (!hasApiKey) {
    checks.push({ name: 'Bags API Health', status: 'warning', desc: 'BAGS_API_KEY missing.' });
  } else {
    try {
      const h = await checkBagsApiHealth();
      checks.push({
        name: 'Bags API Health',
        status: h.ok ? 'active' : 'warning',
        desc: h.ok ? `Quote health OK (${h.latencyMs} ms).` : 'Health check failed.',
      });
    } catch (error) {
      checks.push({
        name: 'Bags API Health',
        status: 'warning',
        desc: `Bags API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // Signer policy config sanity
  const maxSwapAmount = Number(process.env.BAGS_MAX_SWAP_AMOUNT || '10000000');
  const hasMintAllowlist = Boolean((process.env.BAGS_ALLOWED_MINTS || '').trim());
  checks.push({
    name: 'Signer Policy',
    status: Number.isFinite(maxSwapAmount) && maxSwapAmount > 0 ? 'active' : 'warning',
    desc: `Max swap amount: ${Number.isFinite(maxSwapAmount) ? maxSwapAmount : 'invalid'}; allowlist source: ${hasMintAllowlist ? 'env override' : 'default list'}`,
  });

  const summary = {
    passed: checks.filter((c) => c.status === 'passed').length,
    active: checks.filter((c) => c.status === 'active').length,
    warning: checks.filter((c) => c.status === 'warning').length,
  };

  return NextResponse.json({ ok: true, summary, checks, mvpScope: ['referral', 'tipping', 'launch-campaign'] });
}
