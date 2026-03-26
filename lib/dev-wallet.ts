import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

export function getDevWalletKeypair(): Keypair {
  const secret = process.env.BAGS_DEV_WALLET_SECRET;
  if (!secret) {
    throw new Error('Missing BAGS_DEV_WALLET_SECRET. Set a base58-encoded Solana secret key for server-side signing.');
  }

  let decoded: Uint8Array;
  try {
    decoded = bs58.decode(secret.trim());
  } catch {
    throw new Error('Invalid BAGS_DEV_WALLET_SECRET format. Expected base58 string.');
  }

  if (decoded.length !== 64) {
    throw new Error(`Invalid BAGS_DEV_WALLET_SECRET length: expected 64 bytes, got ${decoded.length}.`);
  }

  return Keypair.fromSecretKey(decoded);
}
