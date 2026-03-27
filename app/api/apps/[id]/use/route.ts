import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { prisma } from '@/lib/prisma';
import { getAuthWallet } from '@/lib/auth-wallet';
import { createSwapTransaction, getTradeQuote, sendSignedTransaction } from '@/lib/bags-client';
import { getDevWalletKeypair } from '@/lib/dev-wallet';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildIdempotencyKey, claimIdempotencyKey } from '@/lib/idempotency';
import { assertSignerPolicy } from '@/lib/signer-policy';
import { canExecuteOnchain } from '@/lib/env';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const executeOnchain = Boolean(body?.executeOnchain);

    const app = await prisma.miniApp.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    const wallet = getAuthWallet(req);

    let config: any = {};
    try {
      config = JSON.parse(app.configJson || '{}');
    } catch {
      config = {};
    }

    let action: any = { type: 'generic', message: 'App usage recorded.' };

    if (app.type === 'referral') {
      action = {
        type: 'referral',
        message: 'Referral app joined successfully.',
        rewardBps: config.rewardBps ?? 0,
        campaignDays: config.campaignDays ?? 0,
      };
    }

    if (app.type === 'gated-access') {
      const allowed = Boolean(wallet);
      action = {
        type: 'gated-access',
        allowed,
        message: allowed
          ? 'Access granted. Wallet verified for gated app.'
          : 'Access denied. Connect and verify wallet session first.',
      };
    }

    if (app.type === 'tipping') {
      action = {
        type: 'tipping',
        message: 'Tip action initialized.',
        protocolFeeBps: config.protocolFeeBps ?? 0,
        minimumTip: config.minimumTip ?? '0',
      };

      if (executeOnchain) {
        const exec = canExecuteOnchain();
        if (!exec.ok) {
          return NextResponse.json({ ok: false, error: `Execute disabled: ${exec.issues.join('; ')}` }, { status: 503 });
        }

        if (!wallet) {
          return NextResponse.json({ ok: false, error: 'Unauthorized for on-chain execution.' }, { status: 401 });
        }

        const rl = await checkRateLimit(`app-use-exec:${wallet}:${app.id}`, 8, 60_000);
        if (!rl.ok) {
          return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
        }

        const explicitIdempotencyKey = req.headers.get('idempotency-key');
        const idemKey = buildIdempotencyKey({
          scope: 'app-use-execute',
          user: wallet,
          payload: { appId: app.id, sourceRunId: app.sourceRunId },
          explicitKey: explicitIdempotencyKey,
        });

        const claimed = await claimIdempotencyKey(idemKey, 120_000);
        if (!claimed) {
          return NextResponse.json(
            { ok: false, error: 'Duplicate execute request detected. Retry with a new idempotency key.' },
            { status: 409 }
          );
        }

        const sourceRun = await prisma.forgeRun.findUnique({ where: { id: app.sourceRunId } });
        if (!sourceRun) throw new Error('Source run not found for this app.');

        assertSignerPolicy({
          inputMint: sourceRun.inputMint,
          outputMint: sourceRun.outputMint,
          amount: sourceRun.amount,
        });

        const signer = getDevWalletKeypair();
        const quote = await getTradeQuote({
          inputMint: sourceRun.inputMint,
          outputMint: sourceRun.outputMint,
          amount: sourceRun.amount,
          slippageMode: 'auto',
        });

        const quoteResponse = (quote as any)?.response ?? quote;
        const swapTxPayload = await createSwapTransaction({
          quoteResponse,
          userPublicKey: signer.publicKey.toBase58(),
        });

        const swapTx = (swapTxPayload as any)?.response?.swapTransaction;
        if (!swapTx || typeof swapTx !== 'string') {
          throw new Error('Invalid swap transaction from Bags API.');
        }

        const tx = VersionedTransaction.deserialize(bs58.decode(swapTx));
        tx.sign([signer]);
        const sent = await sendSignedTransaction(bs58.encode(tx.serialize()));

        action.onchain = {
          executed: true,
          signature: (sent as any)?.response || null,
          message: 'Tipping on-chain transaction executed via Bags pipeline.',
        };
      }
    }

    if (app.type === 'launch-campaign') {
      const completed = Number(body?.questCompleted ?? 0);
      const required = Number(config.questCountRequired ?? 3);
      action = {
        type: 'launch-campaign',
        message: completed >= required ? 'Campaign reward unlocked.' : 'Progress recorded for launch campaign.',
        completed,
        required,
        rewardEligible: completed >= required,
      };
    }

    if (app.type === 'loyalty') {
      const volume = Number(body?.tradeVolume ?? 0);
      const points = Math.max(0, Math.floor(volume / 100));
      action = {
        type: 'loyalty',
        message: 'Loyalty points updated.',
        tradeVolume: volume,
        pointsEarned: points,
      };
    }

    await prisma.miniAppEvent.create({
      data: {
        appId: app.id,
        actorWallet: wallet || null,
        actionType: action.type || 'generic',
        payloadJson: JSON.stringify({ action, executeOnchain }),
      },
    });

    return NextResponse.json({ ok: true, appId: app.id, usageCount: app.usageCount, action });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to use app' }, { status: 500 });
  }
}
