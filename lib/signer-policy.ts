const DEFAULT_ALLOWLIST = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
];

function parseAllowlist() {
  const raw = process.env.BAGS_ALLOWED_MINTS;
  if (!raw || !raw.trim()) return DEFAULT_ALLOWLIST;
  return raw.split(',').map((x) => x.trim()).filter(Boolean);
}

export function assertSignerPolicy(params: { inputMint: string; outputMint: string; amount: string }) {
  const allowlist = parseAllowlist();
  if (!allowlist.includes(params.inputMint) || !allowlist.includes(params.outputMint)) {
    throw new Error('Signer policy rejected mint pair. Configure BAGS_ALLOWED_MINTS for allowed routes.');
  }

  const amount = Number(params.amount);
  const maxAmount = Number(process.env.BAGS_MAX_SWAP_AMOUNT || '10000000');
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount under signer policy.');
  }
  if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
    throw new Error('Invalid BAGS_MAX_SWAP_AMOUNT policy configuration.');
  }
  if (amount > maxAmount) {
    throw new Error(`Signer policy rejected amount > max (${maxAmount}).`);
  }
}
