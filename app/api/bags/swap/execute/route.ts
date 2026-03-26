import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { createSwapTransaction, sendSignedTransaction } from '@/lib/bags-client';
import { getDevWalletKeypair } from '@/lib/dev-wallet';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawQuote = body?.quote;

    if (!rawQuote) {
      return NextResponse.json({ ok: false, error: 'Missing quote payload.' }, { status: 400 });
    }

    const quoteResponse = rawQuote?.response ?? rawQuote;

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
