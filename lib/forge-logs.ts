import { prisma } from '@/lib/prisma';

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
  isPublic?: boolean;
  publicTitle?: string | null;
};

function rangeToDate(range: '24h' | '7d' | '30d' | 'all') {
  if (range === 'all') return null;
  const hours = range === '24h' ? 24 : range === '7d' ? 24 * 7 : 24 * 30;
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function appendForgeLog(log: ForgeLog) {
  await prisma.forgeRun.create({
    data: {
      id: log.id,
      userId: log.userId,
      wallet: log.wallet ?? null,
      prompt: log.prompt,
      inputMint: log.inputMint,
      outputMint: log.outputMint,
      amount: log.amount,
      mode: log.mode,
      success: log.success,
      signature: log.signature ?? null,
      error: log.error ?? null,
      isPublic: Boolean(log.isPublic),
      publicTitle: log.publicTitle ?? null,
      createdAt: new Date(log.createdAt),
    },
  });
}

export async function getAnalyticsSummary(
  range: '24h' | '7d' | '30d' | 'all' = 'all',
  opts?: { wallet?: string; scope?: 'self' | 'global' }
) {
  const scope = opts?.scope ?? 'self';
  const dateFrom = rangeToDate(range);

  const where: any = {};
  if (scope === 'self') where.wallet = opts?.wallet || '__none__';
  if (dateFrom) where.createdAt = { gte: dateFrom };

  const all = await prisma.forgeRun.findMany({ where, orderBy: { createdAt: 'desc' } });

  const totalRuns = all.length;
  const successfulRuns = all.filter((l) => l.success).length;
  const executeRuns = all.filter((l) => l.mode === 'execute').length;
  const successfulExecutes = all.filter((l) => l.mode === 'execute' && l.success).length;
  const totalInputAmount = all.filter((l) => l.success).reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

  const mapped: ForgeLog[] = all.map((l) => ({
    id: l.id,
    userId: l.userId,
    createdAt: l.createdAt.toISOString(),
    prompt: l.prompt,
    inputMint: l.inputMint,
    outputMint: l.outputMint,
    amount: l.amount,
    mode: l.mode as 'quote-only' | 'execute',
    success: l.success,
    signature: l.signature,
    wallet: l.wallet,
    error: l.error,
    isPublic: l.isPublic,
    publicTitle: l.publicTitle,
  }));

  return {
    scope,
    range,
    totalRuns,
    successfulRuns,
    executeRuns,
    successfulExecutes,
    successRate,
    totalInputAmount,
    recent: mapped.slice(0, 20),
    all: mapped,
  };
}

export async function publishRun(runId: string, userId: string, title?: string) {
  const run = await prisma.forgeRun.findFirst({ where: { id: runId, userId } });
  if (!run) throw new Error('Run not found');

  return prisma.forgeRun.update({
    where: { id: runId },
    data: { isPublic: true, publicTitle: title?.slice(0, 80) || null },
  });
}

export async function getPublicRuns(limit = 30) {
  return prisma.forgeRun.findMany({
    where: { isPublic: true, success: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export function logsToCsv(logs: ForgeLog[]) {
  const header = ['id', 'userId', 'createdAt', 'prompt', 'inputMint', 'outputMint', 'amount', 'mode', 'success', 'signature', 'wallet', 'error'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    header.join(','),
    ...logs.map((l) =>
      [l.id, l.userId, l.createdAt, l.prompt, l.inputMint, l.outputMint, l.amount, l.mode, l.success, l.signature ?? '', l.wallet ?? '', l.error ?? '']
        .map(escape)
        .join(',')
    ),
  ].join('\n');
}
