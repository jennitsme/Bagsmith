import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { getTradeQuote, createSwapTransaction, sendSignedTransaction } from '@/lib/bags-client';
import { getDevWalletKeypair } from '@/lib/dev-wallet';
import { appendForgeLog } from '@/lib/forge-logs';
import { attachUserCookie, ensureUserId } from '@/lib/user-session';
import { getAuthWallet } from '@/lib/auth-wallet';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildIdempotencyKey, claimIdempotencyKey } from '@/lib/idempotency';
import { forgeRequestSchema, zodErrorMessage } from '@/lib/validation';
import { assertSignerPolicy } from '@/lib/signer-policy';
import { canExecuteOnchain } from '@/lib/env';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function POST(req: NextRequest) {
  const parsedBody = forgeRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: zodErrorMessage(parsedBody.error) || 'Invalid request body' }, { status: 400 });
  }

  const { prompt, inputMint, outputMint, amount } = parsedBody.data;
  const executeSwap = Boolean(parsedBody.data.executeSwap);
  const mode = executeSwap ? 'execute' : 'quote-only';
  const { userId, shouldSetCookie } = ensureUserId(req);
  const authenticatedWallet = getAuthWallet(req);

  try {
    if (!authenticatedWallet) {
      const res = NextResponse.json({ ok: false, error: 'Unauthorized. Connect wallet and sign in first.' }, { status: 401 });
      if (shouldSetCookie) attachUserCookie(res, userId);
      return res;
    }

    const rl = await checkRateLimit(`${userId}:${authenticatedWallet}`, 15, 60_000);
    if (!rl.ok) {
      const res = NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
      if (shouldSetCookie) attachUserCookie(res, userId);
      return res;
    }
    if (!isNonEmptyString(prompt)) {
      const res = NextResponse.json({ ok: false, error: 'prompt is required.' }, { status: 400 });
      if (shouldSetCookie) attachUserCookie(res, userId);
      return res;
    }

    if (!isNonEmptyString(inputMint) || !isNonEmptyString(outputMint) || !isNonEmptyString(amount)) {
      const res = NextResponse.json(
        { ok: false, error: 'inputMint, outputMint, and amount are required.' },
        { status: 400 }
      );
      if (shouldSetCookie) attachUserCookie(res, userId);
      return res;
    }

    if (executeSwap) {
      const exec = canExecuteOnchain();
      if (!exec.ok) {
        const res = NextResponse.json({ ok: false, error: `Execute disabled: ${exec.issues.join('; ')}` }, { status: 503 });
        if (shouldSetCookie) attachUserCookie(res, userId);
        return res;
      }
      assertSignerPolicy({ inputMint: inputMint.trim(), outputMint: outputMint.trim(), amount: amount.trim() });
    }

    const wallet = getDevWalletKeypair();
    const userPublicKey = wallet.publicKey.toBase58();

    const quote = await getTradeQuote({
      inputMint: inputMint.trim(),
      outputMint: outputMint.trim(),
      amount: amount.trim(),
      slippageMode: 'auto',
    });

    const result: any = {
      ok: true,
      userId,
      stages: {
        promptAccepted: true,
        quoteFetched: true,
        swapCreated: false,
        transactionSent: false,
      },
      prompt,
      wallet: userPublicKey,
      quote,
      swap: null,
      signature: null,
      mode,
    };

    if (!executeSwap) {
      const runId = crypto.randomUUID();
      await appendForgeLog({
        id: runId,
        userId,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
        inputMint: inputMint.trim(),
        outputMint: outputMint.trim(),
        amount: amount.trim(),
        mode,
        success: true,
        signature: null,
        wallet: userPublicKey,
        error: null,
      });
      result.runId = runId;
      const res = NextResponse.json(result);
      if (shouldSetCookie) attachUserCookie(res, userId);
      return res;
    }

    const explicitIdempotencyKey = req.headers.get('idempotency-key');
    const idemKey = buildIdempotencyKey({
      scope: 'bags-forge-execute',
      user: `${userId}:${authenticatedWallet}`,
      payload: { prompt: prompt.trim(), inputMint: inputMint.trim(), outputMint: outputMint.trim(), amount: amount.trim() },
      explicitKey: explicitIdempotencyKey,
    });

    const claimed = await claimIdempotencyKey(idemKey, 120_000);
    if (!claimed) {
      const res = NextResponse.json(
        { ok: false, error: 'Duplicate execute request detected. Retry with a new idempotency key.' },
        { status: 409 }
      );
      if (shouldSetCookie) attachUserCookie(res, userId);
      return res;
    }

    const quoteResponse = quote?.response ?? quote;
    const swapTxPayload = await createSwapTransaction({ quoteResponse, userPublicKey });
    const swapTx = swapTxPayload?.response?.swapTransaction;

    if (!swapTx || typeof swapTx !== 'string') {
      throw new Error('Invalid swap transaction response from Bags API.');
    }

    result.stages.swapCreated = true;
    result.swap = swapTxPayload;

    const txBuffer = bs58.decode(swapTx);
    const tx = VersionedTransaction.deserialize(txBuffer);
    tx.sign([wallet]);

    const signedB58 = bs58.encode(tx.serialize());
    const sendResult = await sendSignedTransaction(signedB58);

    result.stages.transactionSent = true;
    result.signature = sendResult?.response || null;
    result.send = sendResult;

    const runId = crypto.randomUUID();
    await appendForgeLog({
      id: runId,
      userId,
      createdAt: new Date().toISOString(),
      prompt: prompt.trim(),
      inputMint: inputMint.trim(),
      outputMint: outputMint.trim(),
      amount: amount.trim(),
      mode,
      success: true,
      signature: result.signature,
      wallet: userPublicKey,
      error: null,
    });

    result.runId = runId;
    const res = NextResponse.json(result);
    if (shouldSetCookie) attachUserCookie(res, userId);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';

    if (isNonEmptyString(prompt) && isNonEmptyString(inputMint) && isNonEmptyString(outputMint) && isNonEmptyString(amount)) {
      await appendForgeLog({
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
        inputMint: inputMint.trim(),
        outputMint: outputMint.trim(),
        amount: amount.trim(),
        mode,
        success: false,
        signature: null,
        wallet: null,
        error: message,
      }).catch(() => undefined);
    }

    const res = NextResponse.json({ ok: false, error: message }, { status: 500 });
    if (shouldSetCookie) attachUserCookie(res, userId);
    return res;
  }
}
