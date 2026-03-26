import { NextRequest, NextResponse } from 'next/server';
import { getTradeQuote } from '@/lib/bags-client';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const inputMint = body?.inputMint;
    const outputMint = body?.outputMint;
    const amount = body?.amount;
    const slippageMode = body?.slippageMode;
    const slippageBps = body?.slippageBps;

    if (!isNonEmptyString(inputMint) || !isNonEmptyString(outputMint) || !isNonEmptyString(amount)) {
      return NextResponse.json(
        { ok: false, error: 'inputMint, outputMint, and amount are required.' },
        { status: 400 }
      );
    }

    const quote = await getTradeQuote({
      inputMint: inputMint.trim(),
      outputMint: outputMint.trim(),
      amount: amount.trim(),
      slippageMode: slippageMode === 'manual' ? 'manual' : 'auto',
      slippageBps: typeof slippageBps === 'number' ? slippageBps : undefined,
    });

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
