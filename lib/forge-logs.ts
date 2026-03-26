import { promises as fs } from 'fs';
import path from 'path';

export type ForgeLog = {
  id: string;
  userId: string;
  createdAt: string;
  prompt: string;
  inputMint: string;
  outputMint: string;
  amount: string;
  mode: 'quote-only' | 'execute';
  success: boolean;
  signature?: string | null;
  wallet?: string | null;
  error?: string | null;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'forge-logs.json');

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(LOG_FILE);
  } catch {
    await fs.writeFile(LOG_FILE, '[]', 'utf8');
  }
}

export async function readForgeLogs(): Promise<ForgeLog[]> {
  await ensureStore();
  const raw = await fs.readFile(LOG_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export async function appendForgeLog(log: ForgeLog) {
  const logs = await readForgeLogs();
  logs.unshift(log);
  await fs.writeFile(LOG_FILE, JSON.stringify(logs.slice(0, 2000), null, 2), 'utf8');
}

function filterByRange(logs: ForgeLog[], range: '24h' | '7d' | '30d' | 'all') {
  if (range === 'all') return logs;
  const now = Date.now();
  const windowMs = range === '24h' ? 24 * 60 * 60 * 1000 : range === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return Number.isFinite(t) && now - t <= windowMs;
  });
}

export async function getAnalyticsSummary(
  range: '24h' | '7d' | '30d' | 'all' = 'all',
  opts?: { userId?: string; scope?: 'self' | 'global' }
) {
  const logs = await readForgeLogs();
  const scope = opts?.scope ?? 'self';

  const scopedByUser =
    scope === 'global' ? logs : logs.filter((l) => (opts?.userId ? l.userId === opts.userId : false));

  const scoped = filterByRange(scopedByUser, range);

  const totalRuns = scoped.length;
  const successfulRuns = scoped.filter((l) => l.success).length;
  const executeRuns = scoped.filter((l) => l.mode === 'execute').length;
  const successfulExecutes = scoped.filter((l) => l.mode === 'execute' && l.success).length;

  const totalInputAmount = scoped
    .filter((l) => l.success)
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

  return {
    scope,
    range,
    totalRuns,
    successfulRuns,
    executeRuns,
    successfulExecutes,
    successRate,
    totalInputAmount,
    recent: scoped.slice(0, 20),
    all: scoped,
  };
}

export function logsToCsv(logs: ForgeLog[]) {
  const header = ['id', 'userId', 'createdAt', 'prompt', 'inputMint', 'outputMint', 'amount', 'mode', 'success', 'signature', 'wallet', 'error'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = logs.map((l) =>
    [
      l.id,
      l.userId,
      l.createdAt,
      l.prompt,
      l.inputMint,
      l.outputMint,
      l.amount,
      l.mode,
      l.success,
      l.signature ?? '',
      l.wallet ?? '',
      l.error ?? '',
    ]
      .map(escape)
      .join(',')
  );

  return [header.join(','), ...rows].join('\n');
}
