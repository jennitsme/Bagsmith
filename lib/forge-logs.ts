import { promises as fs } from 'fs';
import path from 'path';

export type ForgeLog = {
  id: string;
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
  await fs.writeFile(LOG_FILE, JSON.stringify(logs.slice(0, 1000), null, 2), 'utf8');
}

export async function getAnalyticsSummary() {
  const logs = await readForgeLogs();
  const totalRuns = logs.length;
  const successfulRuns = logs.filter((l) => l.success).length;
  const executeRuns = logs.filter((l) => l.mode === 'execute').length;
  const successfulExecutes = logs.filter((l) => l.mode === 'execute' && l.success).length;

  const totalInputAmount = logs
    .filter((l) => l.success)
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

  return {
    totalRuns,
    successfulRuns,
    executeRuns,
    successfulExecutes,
    successRate,
    totalInputAmount,
    recent: logs.slice(0, 20),
  };
}
