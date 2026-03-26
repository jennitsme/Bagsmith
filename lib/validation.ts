import { z } from 'zod';

export const forgeRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(1200),
  inputMint: z.string().trim().min(20).max(64),
  outputMint: z.string().trim().min(20).max(64),
  amount: z.string().trim().regex(/^\d+$/, 'amount must be an integer string').min(1).max(20),
  executeSwap: z.boolean().optional(),
});

export const quoteRequestSchema = z.object({
  inputMint: z.string().trim().min(20).max(64),
  outputMint: z.string().trim().min(20).max(64),
  amount: z.string().trim().regex(/^\d+$/, 'amount must be an integer string').min(1).max(20),
  slippageMode: z.enum(['auto', 'manual']).optional(),
  slippageBps: z.number().int().min(1).max(5000).optional(),
});

export const swapExecuteRequestSchema = z.object({
  quote: z.unknown(),
});

export const publishAppSchema = z.object({
  runId: z.string().trim().min(5).max(100),
  title: z.string().trim().min(3).max(80),
  type: z.enum(['referral', 'gated-access', 'tipping', 'launch-campaign', 'loyalty']),
  description: z.string().trim().max(280).optional(),
});

export function zodErrorMessage(error: unknown) {
  if (!(error instanceof z.ZodError)) return null;
  return error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
}
