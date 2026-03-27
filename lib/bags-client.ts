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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bagsFetch<T = unknown>(path: string, init?: RequestInit): Promise<BagsApiResponse<T>> {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing BAGS_API_KEY');
  }

  const baseUrl = process.env.BAGS_API_BASE_URL || DEFAULT_BASE_URL;
  const retries = 2;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as BagsApiResponse<T> | null;

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Bags API error (${response.status})`;
        const retriable = response.status >= 500 || response.status === 429;
        if (retriable && attempt < retries) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('Empty response from Bags API');
      }

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Bags request failed';
      const retriable = msg.includes('aborted') || msg.includes('fetch failed');
      if (retriable && attempt < retries) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Bags request failed after retries');
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
