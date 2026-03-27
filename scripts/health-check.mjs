import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';

function loadEnvFile(fileName) {
  const p = path.join(process.cwd(), fileName);
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const baseUrl = process.env.BAGS_API_BASE_URL || 'https://public-api-v2.bags.fm/api/v1';
const apiKey = process.env.BAGS_API_KEY || '';

const report = {
  db: { ok: false, detail: '' },
  redis: { ok: false, detail: '' },
  bags: { ok: false, detail: '' },
};

async function checkDb() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    report.db = { ok: true, detail: 'Postgres reachable' };
  } catch (e) {
    report.db = { ok: false, detail: e instanceof Error ? e.message : 'DB check failed' };
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function checkRedis() {
  const url = process.env.REDIS_URL || '';
  if (!url) {
    report.redis = { ok: false, detail: 'REDIS_URL missing' };
    return;
  }
  const redis = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  try {
    const pong = await redis.ping();
    report.redis = { ok: pong === 'PONG', detail: `PING=${pong}` };
  } catch (e) {
    report.redis = { ok: false, detail: e instanceof Error ? e.message : 'Redis check failed' };
  } finally {
    redis.disconnect();
  }
}

async function checkBags() {
  if (!apiKey) {
    report.bags = { ok: false, detail: 'BAGS_API_KEY missing' };
    return;
  }

  try {
    const q = new URL(`${baseUrl}/trade/quote`);
    q.searchParams.set('inputMint', 'So11111111111111111111111111111111111111112');
    q.searchParams.set('outputMint', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    q.searchParams.set('amount', '1000');
    q.searchParams.set('slippageMode', 'auto');

    const res = await fetch(q.toString(), {
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
    });

    const body = await res.text();
    if (!res.ok) {
      report.bags = { ok: false, detail: `HTTP ${res.status}: ${body.slice(0, 180)}` };
      return;
    }

    report.bags = { ok: true, detail: 'Quote endpoint healthy' };
  } catch (e) {
    report.bags = { ok: false, detail: e instanceof Error ? e.message : 'Bags check failed' };
  }
}

await Promise.all([checkDb(), checkRedis(), checkBags()]);

const allOk = report.db.ok && report.redis.ok && report.bags.ok;

console.log('\n=== Bagsmith Health Check ===');
for (const [k, v] of Object.entries(report)) {
  console.log(`${v.ok ? '✅' : '❌'} ${k.toUpperCase()}: ${v.detail}`);
}
console.log(`\nResult: ${allOk ? 'HEALTHY' : 'DEGRADED'}\n`);

process.exit(allOk ? 0 : 1);
