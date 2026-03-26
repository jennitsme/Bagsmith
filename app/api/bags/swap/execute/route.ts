import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { createSwapTransaction, sendSignedTransaction } from '@/lib/bags-client';
import { getDevWalletKeypair } from '@/lib/dev-wallet';
import { getAuthWallet } from '@/lib/auth-wallet';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildIdempotencyKey, claimIdempotencyKey } from '@/lib/idempotency';
import { swapExecuteRequestSchema, zodErrorMessage } from '@/lib/validation';
import { assertSignerPolicy } from '@/lib/signer-policy';

export async function POST(req: NextRequest) {
  try {
    const walletSession = getAuthWallet(req);
    if (!walletSession) {
      return NextResponse.json({ ok: false, error: 'Unauthorized. Connect wallet and sign in first.' }, { status: 401 });
    }

    const rl = await checkRateLimit(`swap-exec:${walletSession}`, 12, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
    }

    const parsedBody = swapExecuteRequestSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, error: zodErrorMessage(parsedBody.error) || 'Invalid request body' }, { status: 400 });
    }

    const rawQuote: any = parsedBody.data.quote;

    const explicitIdempotencyKey = req.headers.get('idempotency-key');
    const idemKey = buildIdempotencyKey({
      scope: 'bags-swap-execute',
      user: walletSession,
      payload: { quote: rawQuote },
      explicitKey: explicitIdempotencyKey,
    });

    const claimed = await claimIdempotencyKey(idemKey, 120_000);
    if (!claimed) {
      return NextResponse.json(
        { ok: false, error: 'Duplicate execute request detected. Retry with a new idempotency key.' },
        { status: 409 }
      );
    }

    const quoteResponse: any = rawQuote?.response ?? rawQuote;
    const inputMint = quoteResponse?.inputMint;
    const outputMint = quoteResponse?.outputMint;
    const amount = quoteResponse?.inAmount || quoteResponse?.amount;

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json({ ok: false, error: 'Quote payload missing inputMint/outputMint/amount for signer policy.' }, { status: 400 });
    }

    assertSignerPolicy({ inputMint: String(inputMint), outputMint: String(outputMint), amount: String(amount) });

    const wallet = getDevWalletKeypair();
    const userPublicKey = wallet.publicKey.toBase58();

    const swapTxPayload = await createSwapTransaction({ quoteResponse, userPublicKey });
    const swapTx = swapTxPayload?.response?.swapTransaction;

    if (!swapTx || typeof swapTx !== 'string') {
      throw new Error('Invalid swap transaction response from Bags API.');
    }

    const txBuffer = bs58.decode(swapTx);
    const tx = VersionedTransaction.deserialize(txBuffer);
    tx.sign([wallet]);

    const signedSerialized = tx.serialize();
    const signedB58 = bs58.encode(signedSerialized);

    const sendResult = await sendSignedTransaction(signedB58);
    const signature = sendResult?.response;

    return NextResponse.json({
      ok: true,
      wallet: userPublicKey,
      signature,
      swap: swapTxPayload,
      send: sendResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
