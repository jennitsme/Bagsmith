const DEFAULT_BASE_URL = 'https://public-api-v2.bags.fm/api/v1';

export type TradeQuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageMode?: 'auto' | 'manual';
  slippageBps?: number;
};

export async function getTradeQuote(params: TradeQuoteParams) {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing BAGS_API_KEY');
  }

  const baseUrl = process.env.BAGS_API_BASE_URL || DEFAULT_BASE_URL;

  const search = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageMode: params.slippageMode || 'auto',
  });

  if (params.slippageMode === 'manual' && typeof params.slippageBps === 'number') {
    search.set('slippageBps', String(params.slippageBps));
  }

  const response = await fetch(`${baseUrl}/trade/quote?${search.toString()}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `Bags API error (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}
