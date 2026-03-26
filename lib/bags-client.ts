const DEFAULT_BASE_URL = 'https://public-api-v2.bags.fm/api/v1';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export type TradeQuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageMode?: 'auto' | 'manual';
  slippageBps?: number;
};

type BagsApiResponse<T = unknown> = {
  success?: boolean;
  response?: T;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

async function bagsFetch<T = unknown>(path: string, init?: RequestInit): Promise<BagsApiResponse<T>> {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing BAGS_API_KEY');
  }

  const baseUrl = process.env.BAGS_API_BASE_URL || DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as BagsApiResponse<T> | null;

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `Bags API error (${response.status})`;
    throw new Error(errorMessage);
  }

  if (!data) {
    throw new Error('Empty response from Bags API');
  }

  return data;
}

export async function getTradeQuote(params: TradeQuoteParams) {
  const search = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageMode: params.slippageMode || 'auto',
  });

  if (params.slippageMode === 'manual' && typeof params.slippageBps === 'number') {
    search.set('slippageBps', String(params.slippageBps));
  }

  return bagsFetch(`/trade/quote?${search.toString()}`, { method: 'GET' });
}

export async function createSwapTransaction(params: { quoteResponse: unknown; userPublicKey: string }) {
  return bagsFetch<{ swapTransaction: string }>(`/trade/swap`, {
    method: 'POST',
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
    }),
  });
}

export async function sendSignedTransaction(transaction: string) {
  return bagsFetch<string>(`/solana/send-transaction`, {
    method: 'POST',
    body: JSON.stringify({ transaction }),
  });
}

export async function createFeeShareConfig(params: {
  payer: string;
  baseMint: string;
  claimersArray: string[];
  basisPointsArray: number[];
}) {
  return bagsFetch<any>(`/fee-share/config`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createPartnerConfigCreationTx(params: { partnerWallet: string }) {
  return bagsFetch<any>(`/fee-share/partner-config/creation-tx`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getClaimTransactionsV3(params: Record<string, unknown>) {
  return bagsFetch<any>(`/fee-share/claim-transactions/v3`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createTokenLaunchTransaction(params: {
  ipfs: string;
  tokenMint: string;
  wallet: string;
  initialBuyLamports: number;
  configKey: string;
}) {
  return bagsFetch<any>(`/token-launch/create-launch-transaction`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function checkBagsApiHealth() {
  const startedAt = Date.now();
  const quote = await getTradeQuote({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: '1000',
    slippageMode: 'auto',
  });

  return {
    ok: true,
    latencyMs: Date.now() - startedAt,
    quoteAvailable: Boolean(quote?.response || quote),
  };
}
