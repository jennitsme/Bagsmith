import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { getTradeQuote, createSwapTransaction, sendSignedTransaction } from '@/lib/bags-client';
import { getDevWalletKeypair } from '@/lib/dev-wallet';
import { appendForgeLog } from '@/lib/forge-logs';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = body?.prompt;
  const inputMint = body?.inputMint;
  const outputMint = body?.outputMint;
  const amount = body?.amount;
  const executeSwap = Boolean(body?.executeSwap);
  const mode = executeSwap ? 'execute' : 'quote-only';

  try {
    if (!isNonEmptyString(prompt)) {
      return NextResponse.json({ ok: false, error: 'prompt is required.' }, { status: 400 });
    }

    if (!isNonEmptyString(inputMint) || !isNonEmptyString(outputMint) || !isNonEmptyString(amount)) {
      return NextResponse.json(
        { ok: false, error: 'inputMint, outputMint, and amount are required.' },
        { status: 400 }
      );
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
      await appendForgeLog({
        id: crypto.randomUUID(),
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
      return NextResponse.json(result);
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

    await appendForgeLog({
      id: crypto.randomUUID(),
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

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';

    if (isNonEmptyString(prompt) && isNonEmptyString(inputMint) && isNonEmptyString(outputMint) && isNonEmptyString(amount)) {
      await appendForgeLog({
        id: crypto.randomUUID(),
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

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
