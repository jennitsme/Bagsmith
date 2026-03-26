import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { getTradeQuote, createSwapTransaction, sendSignedTransaction } from '@/lib/bags-client';
import { getDevWalletKeypair } from '@/lib/dev-wallet';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const inputMint = body?.inputMint;
    const outputMint = body?.outputMint;
    const amount = body?.amount;
    const executeSwap = Boolean(body?.executeSwap);

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
      mode: executeSwap ? 'execute' : 'quote-only',
    };

    if (!executeSwap) {
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

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
