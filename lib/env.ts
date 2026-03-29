type EnvCheckResult = {
  ok: boolean;
  issues: string[];
  warnings: string[];
};

export type WalletExecutionMode = 'phantom' | 'server_signer';

function isLikelyBagsKey(value: string) {
  return /^bags_(prod|dev|test)_/.test(value.trim());
}

export function getWalletExecutionMode(): WalletExecutionMode {
  const raw = (process.env.BAGS_WALLET_MODE || process.env.WALLET_MODE || 'phantom').trim().toLowerCase();
  if (raw === 'server_signer') return 'server_signer';
  return 'phantom';
}

export function canExecuteOnchain() {
  const issues: string[] = [];
  if (!(process.env.BAGS_API_KEY || '').trim()) issues.push('Missing BAGS_API_KEY');

  const walletMode = getWalletExecutionMode();
  if (walletMode === 'server_signer' && !(process.env.BAGS_DEV_WALLET_SECRET || '').trim()) {
    issues.push('Missing BAGS_DEV_WALLET_SECRET');
  }

  return { ok: issues.length === 0, issues, walletMode };
}

export function validateRuntimeEnv(): EnvCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  const db = process.env.DATABASE_URL || '';
  const redis = process.env.REDIS_URL || '';
  const bagsBase = process.env.BAGS_API_BASE_URL || 'https://public-api-v2.bags.fm/api/v1';
  const bagsKey = process.env.BAGS_API_KEY || '';
  const wallet = process.env.BAGS_DEV_WALLET_SECRET || '';
  const walletMode = getWalletExecutionMode();
  const maxSwapRaw = process.env.BAGS_MAX_SWAP_AMOUNT || '10000000';

  if (!db.trim()) issues.push('Missing DATABASE_URL');
  if (!redis.trim()) warnings.push('REDIS_URL missing: rate-limit/idempotency will use in-memory fallback');

  try {
    const u = new URL(bagsBase);
    if (!/^https?:$/.test(u.protocol)) issues.push('BAGS_API_BASE_URL must be http/https URL');
  } catch {
    issues.push('Invalid BAGS_API_BASE_URL');
  }

  if (!bagsKey.trim()) {
    issues.push('Missing BAGS_API_KEY');
  } else if (!isLikelyBagsKey(bagsKey)) {
    warnings.push('BAGS_API_KEY format looks unusual (expected bags_prod_/bags_dev_/bags_test_)');
  }

  if (walletMode === 'server_signer' && !wallet.trim()) {
    issues.push('Missing BAGS_DEV_WALLET_SECRET (required when BAGS_WALLET_MODE=server_signer)');
  }

  if (walletMode === 'phantom' && !wallet.trim()) {
    warnings.push('BAGS_DEV_WALLET_SECRET missing: OK in phantom mode (user signs in wallet).');
  }

  const maxSwap = Number(maxSwapRaw);
  if (!Number.isFinite(maxSwap) || maxSwap <= 0) {
    issues.push('Invalid BAGS_MAX_SWAP_AMOUNT (must be a positive number)');
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
  };
}
