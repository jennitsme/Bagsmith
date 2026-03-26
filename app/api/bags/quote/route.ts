import { NextRequest, NextResponse } from 'next/server';
import { getTradeQuote } from '@/lib/bags-client';
import { quoteRequestSchema, zodErrorMessage } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const parsedBody = quoteRequestSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, error: zodErrorMessage(parsedBody.error) || 'Invalid request body' }, { status: 400 });
    }

    const { inputMint, outputMint, amount, slippageMode, slippageBps } = parsedBody.data;

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
